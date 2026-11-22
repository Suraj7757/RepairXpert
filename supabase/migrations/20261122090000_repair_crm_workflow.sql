-- Repair CRM workflow hardening
-- Preserve existing tables and data; add intake/payment fields only when absent.

ALTER TABLE public.repair_jobs
  ADD COLUMN IF NOT EXISTS service_category text,
  ADD COLUMN IF NOT EXISTS device_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS expected_delivery_at date,
  ADD COLUMN IF NOT EXISTS advance_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS intake_notes text NOT NULL DEFAULT '';

-- A dedicated, append-only status timeline for repair jobs.
CREATE TABLE IF NOT EXISTS public.repair_job_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_job_id uuid NOT NULL REFERENCES public.repair_jobs(id) ON DELETE CASCADE,
  shop_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  note text NOT NULL DEFAULT '',
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_repair_job_status_history_job
  ON public.repair_job_status_history(repair_job_id, created_at DESC);

ALTER TABLE public.repair_job_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Shop can read own repair status history" ON public.repair_job_status_history;
CREATE POLICY "Shop can read own repair status history"
  ON public.repair_job_status_history
  FOR SELECT TO authenticated
  USING (
    auth.uid() = shop_user_id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE OR REPLACE FUNCTION public.log_repair_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _from_status text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
      RETURN NEW;
    END IF;
    _from_status := OLD.status::text;
  END IF;

  INSERT INTO public.repair_job_status_history (
    repair_job_id, shop_user_id, from_status, to_status, changed_by
  )
  VALUES (
    NEW.id, NEW.user_id, _from_status, NEW.status::text, auth.uid()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_repair_job_status_change ON public.repair_jobs;
CREATE TRIGGER trg_log_repair_job_status_change
  AFTER INSERT OR UPDATE ON public.repair_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_repair_job_status_change();

-- Backfill one initial timeline event for jobs that existed before this migration.
INSERT INTO public.repair_job_status_history (
  repair_job_id, shop_user_id, from_status, to_status, note, changed_by, created_at
)
SELECT
  rj.id, rj.user_id, NULL, rj.status::text, 'Existing repair at migration time', NULL, rj.created_at
FROM public.repair_jobs rj
WHERE NOT EXISTS (
  SELECT 1
  FROM public.repair_job_status_history h
  WHERE h.repair_job_id = rj.id
);

-- Extend the existing atomic booking RPC. Advance payments are recorded in the
-- same transaction as the job so the job and its receipt cannot get out of sync.
CREATE OR REPLACE FUNCTION public.create_repair_job(
  p_user_id uuid,
  p_customer_name text,
  p_customer_mobile text,
  p_device_brand text,
  p_device_model text,
  p_problem_description text,
  p_technician_name text,
  p_estimated_cost numeric,
  p_service_category text DEFAULT NULL,
  p_device_details jsonb DEFAULT '{}'::jsonb
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job_id text;
  _customer_id uuid;
  _repair_job_id uuid;
  _advance numeric := 0;
  _advance_method public.payment_method := 'Cash'::public.payment_method;
  _advance_receiver text;
  _admin_pct numeric := 50;
  _staff_pct numeric := 50;
  _split_enabled boolean := true;
BEGIN
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  _advance := COALESCE(NULLIF(p_device_details->>'advance_amount', '')::numeric, 0);
  IF _advance < 0 THEN
    RAISE EXCEPTION 'Advance amount cannot be negative';
  END IF;
  IF _advance > COALESCE(p_estimated_cost, 0) THEN
    RAISE EXCEPTION 'Advance cannot be greater than the estimated repair cost';
  END IF;

  IF _advance > 0 THEN
    _advance_method := COALESCE(
      NULLIF(p_device_details->>'advance_method', '')::public.payment_method,
      'Cash'::public.payment_method
    );
    IF _advance_method = 'Due'::public.payment_method THEN
      RAISE EXCEPTION 'Advance must be received by Cash or UPI/QR';
    END IF;
    _advance_receiver := NULLIF(p_device_details->>'advance_qr_receiver', '');
  END IF;

  SELECT
    COALESCE(ss.admin_share_percent, 50),
    COALESCE(ss.staff_share_percent, 50),
    COALESCE(ss.revenue_split_enabled, true)
  INTO _admin_pct, _staff_pct, _split_enabled
  FROM public.shop_settings ss
  WHERE ss.user_id = p_user_id;

  IF NOT COALESCE(_split_enabled, true) THEN
    _admin_pct := 100;
    _staff_pct := 0;
  ELSIF COALESCE(_admin_pct, 50) < 0
     OR COALESCE(_staff_pct, 50) < 0
     OR COALESCE(_admin_pct, 50) + COALESCE(_staff_pct, 50) <> 100 THEN
    -- Defensive fallback for old settings that pre-date the 100% validation.
    _admin_pct := 100;
    _staff_pct := 0;
  END IF;

  SELECT id INTO _customer_id
  FROM public.customers
  WHERE user_id = p_user_id
    AND mobile = p_customer_mobile
    AND deleted = false
  LIMIT 1;

  IF _customer_id IS NULL THEN
    INSERT INTO public.customers (user_id, name, mobile)
    VALUES (p_user_id, p_customer_name, p_customer_mobile)
    RETURNING id INTO _customer_id;
  ELSE
    UPDATE public.customers
    SET name = p_customer_name, updated_at = now()
    WHERE id = _customer_id;
  END IF;

  _job_id := public.next_job_id(p_user_id, p_device_brand);

  INSERT INTO public.repair_jobs (
    user_id, job_id, customer_id, customer_name, customer_mobile,
    device_brand, device_model, problem_description,
    technician_name, status, estimated_cost,
    service_category, device_details, expected_delivery_at,
    advance_amount, intake_notes
  )
  VALUES (
    p_user_id, _job_id, _customer_id, p_customer_name, p_customer_mobile,
    p_device_brand, COALESCE(p_device_model, ''), p_problem_description,
    p_technician_name, 'Received'::public.job_status, COALESCE(p_estimated_cost, 0),
    p_service_category, COALESCE(p_device_details, '{}'::jsonb),
    NULLIF(p_device_details->>'expected_delivery_date', '')::date,
    _advance, COALESCE(p_device_details->>'intake_notes', '')
  )
  RETURNING id INTO _repair_job_id;

  IF _advance > 0 THEN
    INSERT INTO public.payments (
      user_id, job_id, repair_job_id, amount, method, qr_receiver,
      admin_share, staff_share
    )
    VALUES (
      p_user_id, _job_id, _repair_job_id, _advance, _advance_method, _advance_receiver,
      _advance * COALESCE(_admin_pct, 100) / 100,
      _advance * COALESCE(_staff_pct, 0) / 100
    );
  END IF;

  RETURN _job_id;
END;
$$;

-- Atomic payment collection and delivery. Due is not a collection method: it is
-- the outstanding amount, derived from the actual received payment rows.
CREATE OR REPLACE FUNCTION public.record_repair_job_payment(
  p_repair_job_id uuid,
  p_amount numeric,
  p_method text,
  p_qr_receiver text DEFAULT NULL,
  p_mark_delivered boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job public.repair_jobs%ROWTYPE;
  _received numeric := 0;
  _balance numeric := 0;
  _admin_pct numeric := 100;
  _staff_pct numeric := 0;
  _split_enabled boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF COALESCE(p_amount, 0) < 0 THEN
    RAISE EXCEPTION 'Payment amount cannot be negative';
  END IF;
  IF p_method NOT IN ('Cash', 'UPI/QR') THEN
    RAISE EXCEPTION 'Select a received payment method: Cash or UPI/QR';
  END IF;

  SELECT rj.* INTO _job
  FROM public.repair_jobs rj
  WHERE rj.id = p_repair_job_id
    AND rj.deleted = false
    AND (
      rj.user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.staff_members sm
        JOIN auth.users au ON lower(au.email) = lower(sm.email)
        WHERE sm.shop_user_id = rj.user_id
          AND au.id = auth.uid()
          AND COALESCE(sm.is_active, false) = true
      )
    )
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Repair job not found or access denied';
  END IF;

  SELECT COALESCE(SUM(p.amount), 0) INTO _received
  FROM public.payments p
  WHERE p.repair_job_id = _job.id
    AND p.deleted = false
    AND p.method::text NOT IN ('Due', 'Refunded');

  _balance := GREATEST(0, COALESCE(_job.estimated_cost, 0) - _received);
  IF COALESCE(p_amount, 0) > _balance + 0.01 THEN
    RAISE EXCEPTION 'Amount exceeds outstanding balance of %', _balance;
  END IF;

  SELECT
    COALESCE(ss.admin_share_percent, 100),
    COALESCE(ss.staff_share_percent, 0),
    COALESCE(ss.revenue_split_enabled, false)
  INTO _admin_pct, _staff_pct, _split_enabled
  FROM public.shop_settings ss
  WHERE ss.user_id = _job.user_id;

  IF NOT COALESCE(_split_enabled, false)
     OR COALESCE(_admin_pct, 0) < 0
     OR COALESCE(_staff_pct, 0) < 0
     OR COALESCE(_admin_pct, 0) + COALESCE(_staff_pct, 0) <> 100 THEN
    _admin_pct := 100;
    _staff_pct := 0;
  END IF;

  IF COALESCE(p_amount, 0) > 0 THEN
    INSERT INTO public.payments (
      user_id, job_id, repair_job_id, amount, method, qr_receiver,
      admin_share, staff_share
    )
    VALUES (
      _job.user_id, _job.job_id, _job.id, p_amount,
      p_method::public.payment_method,
      CASE WHEN p_method = 'UPI/QR' THEN NULLIF(p_qr_receiver, '') ELSE NULL END,
      p_amount * _admin_pct / 100,
      p_amount * _staff_pct / 100
    );
    _received := _received + p_amount;
  END IF;

  IF p_mark_delivered THEN
    UPDATE public.repair_jobs
    SET status = 'Delivered'::public.job_status,
        delivered_at = now(),
        updated_at = now()
    WHERE id = _job.id;
  END IF;

  RETURN jsonb_build_object(
    'paid_amount', _received,
    'balance_amount', GREATEST(0, COALESCE(_job.estimated_cost, 0) - _received),
    'delivered', p_mark_delivered
  );
END;
$$;

REVOKE ALL ON FUNCTION public.record_repair_job_payment(uuid, numeric, text, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_repair_job_payment(uuid, numeric, text, text, boolean) TO authenticated;

-- Public tracking returns the repair status event list without exposing private
-- intake data, device credentials, customer contact details or payment records.
CREATE OR REPLACE FUNCTION public.track_order(_tracking_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  _order record;
  _history jsonb;
BEGIN
  SELECT jsonb_build_object(
    'type','job',
    'tracking_id',rj.job_id,
    'customer_name',rj.customer_name,
    'device_brand',rj.device_brand,
    'device_model',rj.device_model,
    'problem',rj.problem_description,
    'status',rj.status,
    'estimated_cost',rj.estimated_cost,
    'paid_amount',COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.repair_job_id = rj.id
        AND p.deleted = false
        AND p.method::text NOT IN ('Due', 'Refunded')
    ), 0),
    'balance_amount',GREATEST(0, rj.estimated_cost - COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.repair_job_id = rj.id
        AND p.deleted = false
        AND p.method::text NOT IN ('Due', 'Refunded')
    ), 0)),
    'created_at',rj.created_at,
    'delivered_at',rj.delivered_at,
    'expected_delivery_at',rj.expected_delivery_at,
    'history',COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'from_status',h.from_status,
        'to_status',h.to_status,
        'note',h.note,
        'created_at',h.created_at
      ) ORDER BY h.created_at DESC)
      FROM public.repair_job_status_history h
      WHERE h.repair_job_id = rj.id
    ), '[]'::jsonb)
  ) INTO result
  FROM public.repair_jobs rj
  WHERE rj.job_id = _tracking_id
    AND rj.deleted = false
    AND (rj.status != 'Delivered' OR rj.delivered_at > now() - interval '3 days')
  LIMIT 1;

  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT jsonb_build_object(
    'type','sell',
    'tracking_id',s.sell_id,
    'item_name',s.item_name,
    'quantity',s.quantity,
    'total',s.total,
    'status',s.status,
    'created_at',s.created_at,
    'user_id',s.user_id
  ) INTO result
  FROM public.sells s
  WHERE s.sell_id = _tracking_id
    AND s.deleted = false
    AND s.created_at > now() - interval '30 days'
  LIMIT 1;

  IF result IS NOT NULL THEN RETURN result; END IF;

  SELECT * INTO _order
  FROM public.marketplace_orders
  WHERE order_number = _tracking_id
    AND created_at > now() - interval '60 days'
  LIMIT 1;

  IF _order.id IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'to_status', h.to_status,
      'from_status', h.from_status,
      'note', h.note,
      'created_at', h.created_at
    ) ORDER BY h.created_at DESC), '[]'::jsonb)
    INTO _history
    FROM public.order_status_history h
    WHERE h.order_id = _order.id;

    result := jsonb_build_object(
      'type','marketplace',
      'tracking_id', _order.order_number,
      'customer_name', _order.buyer_name,
      'items', _order.items,
      'total', _order.total,
      'status', _order.fulfillment_status,
      'payment_status', _order.payment_status,
      'payment_method', _order.payment_method,
      'fulfillment_method', _order.fulfillment_method,
      'qr_receiver', _order.qr_receiver,
      'created_at', _order.created_at,
      'shop_name', (SELECT shop_name FROM public.shop_settings WHERE user_id = _order.seller_id),
      'history', _history
    );
    RETURN result;
  END IF;

  RETURN NULL;
END;
$function$;
