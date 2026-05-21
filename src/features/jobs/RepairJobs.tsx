import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import {
  useSupabaseQuery,
  useSoftDelete,
  useShopSettings,
  getNextJobId,
} from "@/hooks/useSupabaseData";
import { supabase } from "@/services/supabase";
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  FileText,
  AlertCircle,
  Pencil,
  Share2,
  ConciergeBell,
  QrCode,
  RotateCcw,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/invoice";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";

import { usePlanRestrictions } from "@/hooks/usePlanRestrictions";
import { STATUS_TEMPLATES, openWhatsApp } from "@/lib/whatsappTemplates";
import { useAutomationSettings } from "@/hooks/useAutomation";
import { QRCodeSVG } from "qrcode.react";
import RepairCaseForm from "./RepairCaseForm";
import PaymentLinkModal from "../payments/PaymentLinkModal";
import TrackDialog from "./components/TrackDialog";

// Quick service catalog for job creation (mirrors ServicesManagement seed)
const SERVICE_CATALOG = [
  {
    label: "Screen Replacement",
    price: 800,
    problem: "Screen replacement needed",
    category: "mobile",
  },
  {
    label: "Battery Replacement",
    price: 350,
    problem: "Battery replacement needed",
    category: "mobile",
  },
  {
    label: "Charging Port Repair",
    price: 200,
    problem: "Charging port not working",
    category: "mobile",
  },
  {
    label: "Motherboard Repair",
    price: 500,
    problem: "Motherboard/chip-level repair required",
    category: "mobile",
  },
  {
    label: "Water Damage Treatment",
    price: 400,
    problem: "Water damage — ultrasonic cleaning required",
    category: "mobile",
  },
  {
    label: "Laptop Screen Repair",
    price: 1500,
    problem: "Laptop screen replacement needed",
    category: "laptop",
  },
  {
    label: "Laptop Keyboard Replacement",
    price: 700,
    problem: "Keyboard replacement needed",
    category: "laptop",
  },
  {
    label: "RAM / SSD Upgrade",
    price: 300,
    problem: "RAM/SSD upgrade requested",
    category: "laptop",
  },
  {
    label: "TV Panel Repair",
    price: 1200,
    problem: "TV LED panel fault — repair needed",
    category: "tv",
  },
  {
    label: "Printer Head Cleaning",
    price: 150,
    problem: "Printer head cleaning & alignment",
    category: "pc",
  },
  { label: "Other / Custom", price: 0, problem: "", category: "mobile" },
];

type JobStatus =
  | "Received"
  | "In Progress"
  | "Ready"
  | "Delivered"
  | "Rejected"
  | "Unrepairable"
  | "Returned"
  | "Re-work";
type PaymentMethod = "Cash" | "UPI/QR" | "Due";

const statusColors: Record<string, string> = {
  Received:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
  "In Progress":
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Re-work":
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Ready: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Delivered:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  Unrepairable:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Returned:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
};

// Define allowed next statuses for each status
const nextStatuses: Record<JobStatus, JobStatus[]> = {
  Received: ["In Progress", "Rejected"],
  "In Progress": ["Ready", "Unrepairable", "Re-work"],
  "Re-work": ["In Progress", "Ready"],
  Ready: ["Delivered"],
  Rejected: ["Returned"],
  Unrepairable: ["Returned"],
  Delivered: [],
  Returned: [],
};

export default function RepairJobs() {
  const { user } = useAuth();
  const { data: jobs, refetch } = useSupabaseQuery<any>("repair_jobs");
  const { data: staffMembers } = useSupabaseQuery<any>("staff_members");
  const { data: payments, refetch: refetchPayments } =
    useSupabaseQuery<any>("payments");
  const { softDelete } = useSoftDelete();
  const { settings } = useShopSettings();
  const { settings: autoSettings } = useAutomationSettings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearType, setClearType] = useState<"all" | "delivered">("all");
  const [payLinkOpen, setPayLinkOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returnNominalCharge, setReturnNominalCharge] = useState("0");
  const [isCreating, setIsCreating] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [customerMobile, setCustomerMobile] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [technician, setTechnician] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [editName, setEditName] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editTech, setEditTech] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [qrReceiver, setQrReceiver] = useState(
    settings?.qr_receivers?.[0] || "Admin QR",
  );
  const [customQr, setCustomQr] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");

  const [formState, setFormState] = useState<any>({
    device_brand: "",
    device_model: "",
    problem_description: "",
    estimated_cost: "",
    service_category: "mobile",
    device_details: {},
  });

  const allStatuses: JobStatus[] = [
    "Received",
    "In Progress",
    "Ready",
    "Delivered",
    "Rejected",
    "Unrepairable",
  ];

  const filtered = jobs.filter((j: any) => {
    const matchSearch =
      j.job_id.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      j.customer_mobile.includes(search) ||
      j.device_brand.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || j.status === statusFilter;
    return matchSearch && matchStatus;
  });

  useEffect(() => {
    const handleHash = () => {
      if (window.location.hash === "#new") {
        setCreateOpen(true);
        window.history.replaceState(null, "", window.location.pathname);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const handleMobileSearch = async (mobile: string) => {
    setCustomerMobile(mobile);
    if (mobile.length >= 10 && user) {
      const { data } = await supabase
        .from("customers")
        .select("name")
        .eq("user_id", user.id)
        .eq("mobile", mobile)
        .eq("deleted", false)
        .maybeSingle();
      if (data) {
        setCustomerName(data.name);
        toast.info(`Customer found: ${data.name}`);
      }
    }
  };

  const { limits, planType } = usePlanRestrictions();

  const handleCreateJob = async () => {
    if (
      !customerName ||
      !customerMobile ||
      !formState.device_brand ||
      !formState.problem_description ||
      !user
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (limits.maxJobs !== Infinity && jobs.length >= limits.maxJobs) {
      toast.error(
        `Plan Limit Reached: Your ${planType} plan only supports up to ${limits.maxJobs} jobs. Please upgrade to continue.`,
      );
      return;
    }

    setIsCreating(true);
    try {
      const selectedStaff = staffMembers?.find((s: any) => s.id === technician);
      const techName = selectedStaff ? selectedStaff.name : (technician === "none" ? null : technician || null);

      // Use the optimized RPC to create the job in a single round-trip
      const { data: jobId, error: rpcError } = await supabase.rpc(
        "create_repair_job",
        {
          p_user_id: user.id,
          p_customer_name: customerName,
          p_customer_mobile: customerMobile,
          p_device_brand: formState.device_brand,
          p_device_model: formState.device_model || null,
          p_problem_description: formState.problem_description,
          p_technician_name: techName,
          p_estimated_cost: parseFloat(formState.estimated_cost) || 0,
          p_service_category: formState.service_category,
          p_device_details: formState.device_details,
        },
      );

      if (rpcError) throw rpcError;

      if (selectedStaff) {
        const { data: jobData } = await supabase
          .from("repair_jobs")
          .select("id")
          .eq("job_id", jobId)
          .single();
          
        if (jobData) {
          await supabase.from("staff_job_assignments").insert({
            repair_job_id: jobData.id,
            staff_member_id: selectedStaff.id,
            shop_user_id: user.id,
          });
        }
      }

      toast.success(`Job ${jobId} created`);
      refetch();
      setCreateOpen(false);
      setServiceType("");
      setCustomerMobile("");
      setCustomerName("");
      setTechnician("");
      setFormState({
        device_brand: "",
        device_model: "",
        problem_description: "",
        estimated_cost: "",
        service_category: "mobile",
        device_details: {},
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to create job");
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (job: any) => {
    setSelectedJob(job);
    setEditName(job.customer_name);
    setEditMobile(job.customer_mobile);
    const matchedStaff = staffMembers?.find((s: any) => s.name === job.technician_name);
    setEditTech(matchedStaff ? matchedStaff.id : (job.technician_name || "none"));
    setFormState({
      device_brand: job.device_brand,
      device_model: job.device_model || "",
      problem_description: job.problem_description,
      estimated_cost: String(job.estimated_cost),
      service_category: job.service_category || "mobile",
      device_details: job.device_details || {},
    });
    setEditOpen(true);
  };

  const handleEditJob = async () => {
    if (
      !selectedJob ||
      !editName ||
      !editMobile ||
      !formState.device_brand ||
      !formState.problem_description
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsEditing(true);
    try {
      const selectedStaff = staffMembers?.find((s: any) => s.id === editTech);
      const techName = selectedStaff ? selectedStaff.name : (editTech === "none" ? null : editTech || null);

      const { error } = await supabase
        .from("repair_jobs")
        .update({
          customer_name: editName,
          customer_mobile: editMobile,
          device_brand: formState.device_brand,
          device_model: formState.device_model || null,
          problem_description: formState.problem_description,
          technician_name: techName,
          estimated_cost: parseFloat(formState.estimated_cost) || 0,
          service_category: formState.service_category,
          device_details: formState.device_details,
        } as any)
        .eq("id", selectedJob.id);

      if (error) throw error;

      if (selectedStaff) {
        const { data: existingAssignment } = await supabase
          .from("staff_job_assignments")
          .select("id")
          .eq("repair_job_id", selectedJob.id)
          .maybeSingle();
          
        if (existingAssignment) {
          await supabase.from("staff_job_assignments").update({
            staff_member_id: selectedStaff.id
          }).eq("id", existingAssignment.id);
        } else {
          await supabase.from("staff_job_assignments").insert({
            repair_job_id: selectedJob.id,
            staff_member_id: selectedStaff.id,
            shop_user_id: user.id,
          });
        }
      }

      toast.success(`Job ${selectedJob.job_id} updated`);
      refetch();
      setEditOpen(false);
      setSelectedJob(null);
      setFormState({
        device_brand: "",
        device_model: "",
        problem_description: "",
        estimated_cost: "",
        service_category: "mobile",
        device_details: {},
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update job");
    } finally {
      setIsEditing(false);
    }
  };

  const changeStatus = async (job: any, newStatus: JobStatus) => {
    if (newStatus === "Delivered") {
      setSelectedJob(job);
      setPaymentAmount(String(job.estimated_cost));
      setPaymentOpen(true);
      return;
    }
    if (newStatus === "Returned") {
      setSelectedJob(job);
      setReturnOpen(true);
      return;
    }
    if (newStatus === "Re-work") {
      const reworkCount = (job.rework_count || 0) + 1;
      await supabase
        .from("repair_jobs")
        .update({
          status: newStatus as any,
          rework_count: reworkCount,
        } as any)
        .eq("id", job.id);
      toast.success(`Job ${job.job_id} marked for Re-work (${reworkCount})`);
    } else {
      await supabase
        .from("repair_jobs")
        .update({ status: newStatus as any })
        .eq("id", job.id);
      toast.success(`Job ${job.job_id} → ${newStatus}`);
    }
    // Auto WhatsApp notify on status change
    if (
      autoSettings?.auto_whatsapp_status &&
      STATUS_TEMPLATES[newStatus] &&
      job.customer_mobile
    ) {
      const text = STATUS_TEMPLATES[newStatus]({
        customerName: job.customer_name,
        jobId: job.job_id,
        deviceBrand: job.device_brand,
        deviceModel: job.device_model || "",
        estimatedCost: Number(job.estimated_cost),
        shopName: settings?.shop_name || "RepairXpert",
      });
      setTimeout(() => openWhatsApp(job.customer_mobile, text), 300);
    }
    refetch();
  };

  const handleReturn = async () => {
    if (!selectedJob || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const amount = parseFloat(returnNominalCharge) || 0;

      // 1. Update job status
      await supabase
        .from("repair_jobs")
        .update({
          status: "Returned" as any,
          return_reason: returnReason,
          delivered_at: new Date().toISOString(),
        } as any)
        .eq("id", selectedJob.id);

      // 2. Record nominal charge if any
      if (amount > 0) {
        const splitEnabled = settings?.revenue_split_enabled !== false;
        const adminPct = splitEnabled
          ? (settings?.admin_share_percent ?? 50) / 100
          : 1;
        const staffPct = splitEnabled
          ? (settings?.staff_share_percent ?? 50) / 100
          : 0;

        await supabase.from("payments").insert({
          user_id: user.id,
          job_id: selectedJob.job_id,
          repair_job_id: selectedJob.id,
          amount,
          method: "Cash",
          admin_share: amount * adminPct,
          staff_share: amount * staffPct,
        });
      }

      refetch();
      refetchPayments();
      setReturnOpen(false);
      setSelectedJob(null);
      toast.success(`Job ${selectedJob.job_id} returned to customer`);
    } catch (error: any) {
      toast.error("Return failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteJob = async (job: any) => {
    const ok = await softDelete("repair_jobs", job.id, job.job_id);
    if (ok) {
      toast("Job moved to trash", {
        action: {
          label: "Undo",
          onClick: async () => {
            await supabase
              .from("repair_jobs")
              .update({ deleted: false, deleted_at: null })
              .eq("id", job.id);
            refetch();
          },
        },
        duration: 5000,
      });
      refetch();
    }
  };

  const handlePayment = async () => {
    if (!selectedJob || !user || isProcessing) return;
    setIsProcessing(true);
    try {
      const amount = parseFloat(paymentAmount) || 0;
      const receiver = qrReceiver === "Custom" ? customQr : qrReceiver;
      const splitEnabled = settings?.revenue_split_enabled !== false;
      const adminPct = splitEnabled
        ? (settings?.admin_share_percent ?? 50) / 100
        : 1;
      const staffPct = splitEnabled
        ? (settings?.staff_share_percent ?? 50) / 100
        : 0;

      await supabase
        .from("repair_jobs")
        .update({
          status: "Delivered" as any,
          delivered_at: new Date().toISOString(),
        })
        .eq("id", selectedJob.id);
      await supabase.from("payments").insert({
        user_id: user.id,
        job_id: selectedJob.job_id,
        repair_job_id: selectedJob.id,
        amount,
        method: paymentMethod as any,
        qr_receiver: paymentMethod === "UPI/QR" ? receiver : null,
        admin_share: amount * adminPct,
        staff_share: amount * staffPct,
      });
<<<<<<< HEAD

      // Award Loyalty Points to Customer
      if (selectedJob.customer_mobile && amount > 0) {
        try {
          const { data: customerProfile } = await supabase
            .from("profiles")
            .select("id, user_id, loyalty_points")
            .eq("phone", selectedJob.customer_mobile)
            .maybeSingle();

          if (customerProfile) {
            const pointsEarned = Math.max(1, Math.floor(amount / 100)); // ₹100 spent = 1 pt
            const newPoints = (customerProfile.loyalty_points || 0) + pointsEarned;

            await supabase
              .from("profiles")
              .update({ loyalty_points: newPoints } as any)
              .eq("id", customerProfile.id);

            await supabase.from("loyalty_ledger").insert({
              user_id: customerProfile.user_id,
              points: pointsEarned,
              description: `Earned from Repair Job ${selectedJob.job_id} payment`,
            });
            toast.success(`Awarded ${pointsEarned} loyalty points to customer!`);
          }
        } catch (loyaltyErr) {
          console.error("Failed to award loyalty points:", loyaltyErr);
        }
      }

=======
>>>>>>> c408fdbab0c70d405e0ef64a0ca7825de86b9241
      refetch();
      refetchPayments();
      setPaymentOpen(false);
      setSelectedJob(null);
      toast.success(`Job ${selectedJob.job_id} delivered & payment recorded`);
    } catch (error: any) {
      toast.error("Payment failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearJobs = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    try {
      const now = new Date().toISOString();
      if (clearType === "all") {
        await supabase
          .from("repair_jobs")
          .update({ deleted: true, deleted_at: now })
          .eq("user_id", user.id)
          .eq("deleted", false);
        await supabase
          .from("payments")
          .update({ deleted: true, deleted_at: now })
          .eq("user_id", user.id)
          .eq("deleted", false);
        // Reset job counter
        await supabase
          .from("job_counter")
          .update({ counter: 0 } as any)
          .eq("user_id", user.id);
      } else {
        const deliveredIds = jobs
          .filter((j: any) => j.status === "Delivered")
          .map((j: any) => j.id);
        if (deliveredIds.length > 0) {
          await supabase
            .from("repair_jobs")
            .update({ deleted: true, deleted_at: now })
            .in("id", deliveredIds);
          await supabase
            .from("payments")
            .update({ deleted: true, deleted_at: now })
            .in("repair_job_id", deliveredIds);
        }
      }
      refetch();
      refetchPayments();
      setClearConfirmOpen(false);
      toast.success(
        clearType === "all"
          ? "All jobs cleared & ID reset"
          : "Delivered jobs moved to trash",
      );
    } catch (error: any) {
      toast.error("Clear failed: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInvoice = (job: any) => {
    const payment = payments.find((p: any) => p.repair_job_id === job.id);
    const s = settings || {
      shop_name: "RepairDesk",
      phone: "",
      address: "",
      gstin: "",
      admin_share_percent: 50,
      staff_share_percent: 50,
      qr_receivers: [],
    };
    generateInvoicePDF(
      {
        id: job.id,
        jobId: job.job_id,
        customerId: job.customer_id,
        customerName: job.customer_name,
        customerMobile: job.customer_mobile,
        deviceBrand: job.device_brand,
        deviceModel: job.device_model || "",
        problemDescription: job.problem_description,
        status: job.status,
        estimatedCost: Number(job.estimated_cost),
        createdAt: job.created_at,
        updatedAt: job.updated_at,
        deliveredAt: job.delivered_at,
      },
      payment
        ? {
            id: payment.id,
            jobId: payment.job_id,
            repairJobId: payment.repair_job_id,
            amount: Number(payment.amount),
            method: payment.method,
            qrReceiver: payment.qr_receiver,
            adminShare: Number(payment.admin_share),
            staffShare: Number(payment.staff_share),
            settled: payment.settled,
            createdAt: payment.created_at,
          }
        : undefined,
      {
        shopName: s.shop_name,
        phone: s.phone,
        address: s.address,
        gstin: s.gstin,
        adminSharePercent: s.admin_share_percent,
        staffSharePercent: s.staff_share_percent,
        qrReceivers: s.qr_receivers,
      },
    );
  };

  const shareWhatsApp = (job: any) => {
    const payment = payments.find((p: any) => p.repair_job_id === job.id);
    const shopName = settings?.shop_name || "RepairDesk";
    let msg = `*${shopName} - Job Update*\n\nJob ID: ${job.job_id}\nCustomer: ${job.customer_name}\nDevice: ${job.device_brand} ${job.device_model || ""}\nProblem: ${job.problem_description}\nStatus: ${job.status}\nEstimated Cost: ₹${Number(job.estimated_cost).toLocaleString()}`;
    if (payment)
      msg += `\n\nPayment: ₹${Number(payment.amount).toLocaleString()} (${payment.method})`;
    msg += `\n\n📦 Track your order: ${window.location.origin}/track?id=${job.job_id}`;
    const url = `https://wa.me/${job.customer_mobile.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const exportToExcel = () => {
    const headers = [
      "Job ID",
      "Date",
      "Customer",
      "Mobile",
      "Device",
      "Problem",
      "Status",
      "Cost",
    ];
    const rows = filtered.map((j) => [
      j.job_id,
      new Date(j.created_at).toLocaleDateString(),
      j.customer_name,
      j.customer_mobile,
      `${j.device_brand} ${j.device_model || ""}`,
      j.problem_description,
      j.status,
      j.estimated_cost,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `repair_jobs_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Excel (CSV) exported");
  };

  const exportToPDF = () => {
    const doc = new jsPDF() as any;
    doc.text("Repair Jobs Report", 14, 15);
    const tableData = filtered.map((j) => [
      j.job_id,
      j.customer_name,
      j.device_brand + " " + (j.device_model || ""),
      j.status,
      "Rs." + Number(j.estimated_cost).toLocaleString(),
    ]);
    autoTable(doc, {
      head: [["ID", "Customer", "Device", "Status", "Cost"]],
      body: tableData,
      startY: 20,
    });
    doc.save(`repair_jobs_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF exported");
  };

  const qrReceivers = settings?.qr_receivers || [
    "Admin QR",
    "Staff QR",
    "Shop QR",
  ];
  const splitEnabled = settings?.revenue_split_enabled !== false;

  return (
    <MainLayout title="Repair Jobs">
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToExcel}>
                  Export to Excel (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    setClearType("delivered");
                    setClearConfirmOpen(true);
                  }}
                >
                  Clear Delivered Jobs
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setClearType("all");
                    setClearConfirmOpen(true);
                  }}
                  className="text-destructive"
                >
                  Clear All Jobs (Reset ID)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> New Job
            </Button>
          </div>
        </div>

        <Card className="shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-semibold">Job ID</th>
                  <th className="text-left p-3 font-semibold">Customer</th>
                  <th className="text-left p-3 font-semibold hidden md:table-cell">
                    Device
                  </th>
                  <th className="text-left p-3 font-semibold hidden lg:table-cell">
                    Problem
                  </th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Amount</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((job: any) => {
                  const allowedNext =
                    nextStatuses[job.status as JobStatus] || [];
                  return (
                    <tr
                      key={job.id}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span
                              className="font-mono font-bold text-primary cursor-pointer hover:underline"
                              onClick={() => {
                                setSelectedJob(job);
                                setDetailsOpen(true);
                              }}
                            >
                              {job.job_id}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => {
                                navigator.clipboard.writeText(job.job_id);
                                toast.success("Copied!");
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                              onClick={() => {
                                setSelectedTrackId(job.job_id);
                                setTrackOpen(true);
                              }}
                            >
                              <Share2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(job.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>{job.customer_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {job.customer_mobile}
                        </div>
                      </td>
                      <td className="p-3 hidden md:table-cell">
                        {job.device_brand} {job.device_model}
                      </td>
                      <td className="p-3 hidden lg:table-cell max-w-48 truncate">
                        {job.problem_description}
                      </td>
                      <td className="p-3">
                        <Badge
                          className={`${statusColors[job.status] || ""} border-0 text-xs`}
                        >
                          {job.status}
                        </Badge>
                      </td>
                      <td className="p-3 font-semibold">
                        ₹{Number(job.estimated_cost).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedJob(job);
                                setDetailsOpen(true);
                              }}
                            >
                              <FileText className="h-4 w-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(job)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            {allowedNext.length > 0 && (
                              <DropdownMenuSeparator />
                            )}
                            {allowedNext.map((s) => (
                              <DropdownMenuItem
                                key={s}
                                onClick={() => changeStatus(job, s)}
                              >
                                → {s}
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleInvoice(job)}
                            >
                              <FileText className="h-4 w-4 mr-2" /> Invoice PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedJob(job);
                                setPayLinkOpen(true);
                              }}
                            >
                              <QrCode className="h-4 w-4 mr-2" /> Payment Link /
                              QR
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => shareWhatsApp(job)}
                            >
                              <Share2 className="h-4 w-4 mr-2" /> WhatsApp
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteJob(job)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No jobs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Create Job Dialog */}
        <PaymentLinkModal
          open={shareOpen}
          onOpenChange={setShareOpen}
          job={selectedJob}
        />
        <TrackDialog
          open={trackOpen}
          onOpenChange={setTrackOpen}
          initialId={selectedTrackId}
        />

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Create New Repair Job
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Enter customer details and device information to log a new
                repair job.
              </p>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Details */}
                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                      1
                    </span>
                    <h3 className="font-semibold text-sm">Customer Info</h3>
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Mobile Number *
                    </Label>
                    <Input
                      className="mt-1 font-mono"
                      placeholder="9876543210"
                      value={customerMobile}
                      onChange={(e) => handleMobileSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Customer Name *
                    </Label>
                    <Input
                      className="mt-1"
                      placeholder="John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground">
                      Assigned Technician
                    </Label>
                    <Select value={technician || "none"} onValueChange={setTechnician}>
                      <SelectTrigger className="mt-1 bg-background">
                        <SelectValue placeholder="Select staff..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None / Auto</SelectItem>
                        {staffMembers?.filter((s: any) => s.is_active).map((staff: any) => (
                          <SelectItem key={staff.id} value={staff.id}>
                            {staff.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                      2
                    </span>
                    <h3 className="font-semibold text-sm">
                      Quick Service Pick
                    </h3>
                  </div>
                  <div>
                    <Label className="flex items-center gap-1 text-xs font-bold uppercase text-muted-foreground mb-1">
                      <ConciergeBell className="h-3 w-3" /> Quick Pick (Catalog)
                    </Label>
                    <Select
                      value={serviceType}
                      onValueChange={(v) => {
                        setServiceType(v);
                        const svc = SERVICE_CATALOG.find((s) => s.label === v);
                        if (svc) {
                          setFormState((prev) => ({
                            ...prev,
                            problem_description:
                              svc.problem || prev.problem_description,
                            estimated_cost:
                              svc.price > 0
                                ? String(svc.price)
                                : prev.estimated_cost,
                            service_category:
                              svc.category || prev.service_category,
                          }));
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a service (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATALOG.map((s) => (
                          <SelectItem key={s.label} value={s.label}>
                            {s.label}
                            {s.price > 0 ? ` — ₹${s.price}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                      Tip
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Select a category below to see specific fields for AC, TV,
                      Fridge, etc.
                    </p>
                  </div>
                </div>
              </div>

              {/* Redesigned Repair Case Form */}
              <div className="space-y-4 bg-muted/30 p-4 rounded-xl border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                    3
                  </span>
                  <h3 className="font-semibold text-sm">Repair Case Details</h3>
                </div>
                <RepairCaseForm data={formState} onChange={setFormState} />
              </div>
            </div>
            <DialogFooter className="border-t pt-4">
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateJob}
                className="w-full sm:w-auto px-8"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Job
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={(val) => {
            setEditOpen(val);
            if (!val) setSelectedJob(null);
          }}
        >
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job — {selectedJob?.job_id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Customer Mobile
                  </Label>
                  <Input
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Customer Name
                  </Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
              </div>

              <RepairCaseForm data={formState} onChange={setFormState} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-bold uppercase text-muted-foreground">
                    Technician
                  </Label>
                  <Select value={editTech || "none"} onValueChange={setEditTech}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select staff..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {staffMembers?.filter((s: any) => s.is_active).map((staff: any) => (
                        <SelectItem key={staff.id} value={staff.id}>
                          {staff.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={isEditing}
              >
                Cancel
              </Button>
              <Button onClick={handleEditJob} disabled={isEditing}>
                {isEditing ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment — {selectedJob?.job_id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">💵 Cash</SelectItem>
                    <SelectItem value="UPI/QR">📱 UPI/QR</SelectItem>
                    <SelectItem value="Due">📋 Due</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === "UPI/QR" && (
                <div>
                  <Select value={qrReceiver} onValueChange={setQrReceiver}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {qrReceivers.map((qr: string) => (
                        <SelectItem key={qr} value={qr}>
                          {qr}
                        </SelectItem>
                      ))}
                      <SelectItem value="Custom">Custom...</SelectItem>
                    </SelectContent>
                  </Select>
                  {qrReceiver === "Custom" && (
                    <Input
                      className="mt-2"
                      placeholder="Enter QR name"
                      value={customQr}
                      onChange={(e) => setCustomQr(e.target.value)}
                    />
                  )}

                  {/* Integrated UPI QR Preview */}
                  <div className="mt-4 p-4 border rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center gap-3">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Scan to Pay ₹{Number(paymentAmount).toLocaleString()}
                    </p>
                    <div className="bg-white p-3 rounded-xl shadow-md border-2 border-primary/10">
                      {settings?.upi_id ? (
                        <QRCodeSVG
                          value={`upi://pay?pa=${settings.upi_id}&pn=${encodeURIComponent(settings.shop_name || "Merchant")}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent("Job " + (selectedJob?.job_id || ""))}`}
                          size={140}
                          fgColor="#4f46e5"
                          includeMargin
                        />
                      ) : (
                        <div className="h-[140px] w-[140px] flex items-center justify-center text-xs text-muted-foreground text-center p-4">
                          UPI ID not set in settings
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <img
                        src="https://img.icons8.com/color/48/google-pay-india.png"
                        className="h-5 w-5"
                        alt="GPay"
                      />
                      <img
                        src="https://img.icons8.com/color/48/phonepe.png"
                        className="h-5 w-5"
                        alt="PhonePe"
                      />
                      <img
                        src="https://img.icons8.com/color/48/paytm.png"
                        className="h-5 w-5"
                        alt="Paytm"
                      />
                    </div>
                  </div>
                </div>
              )}
              {splitEnabled && (
                <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>
                      Admin Share ({settings?.admin_share_percent ?? 50}%)
                    </span>
                    <span className="font-semibold">
                      ₹
                      {(
                        ((parseFloat(paymentAmount) || 0) *
                          (settings?.admin_share_percent ?? 50)) /
                        100
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      Staff Share ({settings?.staff_share_percent ?? 50}%)
                    </span>
                    <span className="font-semibold">
                      ₹
                      {(
                        ((parseFloat(paymentAmount) || 0) *
                          (settings?.staff_share_percent ?? 50)) /
                        100
                      ).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handlePayment} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Confirm Payment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Return Job Dialog */}
        <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5 text-indigo-500" /> Return Job —{" "}
                {selectedJob?.job_id}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  This job will be marked as <b>Returned</b>. You can record a
                  nominal checking fee or diagnostic charge if applicable.
                </p>
              </div>
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Reason for Return
                </Label>
                <Select value={returnReason} onValueChange={setReturnReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unrepairable (Parts Unavailable)">
                      Unrepairable (Parts Unavailable)
                    </SelectItem>
                    <SelectItem value="Unrepairable (Chip-level failure)">
                      Unrepairable (Chip-level failure)
                    </SelectItem>
                    <SelectItem value="Customer Rejected Estimate">
                      Customer Rejected Estimate
                    </SelectItem>
                    <SelectItem value="Device Not Picking Up">
                      Device Not Picking Up
                    </SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {returnReason === "Other" && (
                <Textarea
                  placeholder="Enter custom reason..."
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              )}
              <div>
                <Label className="text-xs font-bold uppercase text-muted-foreground">
                  Service Charge / Diagnostic Fee (₹)
                </Label>
                <Input
                  type="number"
                  value={returnNominalCharge}
                  onChange={(e) => setReturnNominalCharge(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={handleReturn}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Confirm Return"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Job Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Job Details — {selectedJob?.job_id}</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-semibold">{selectedJob.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mobile</p>
                    <p className="font-semibold">
                      {selectedJob.customer_mobile}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Category</p>
                    <Badge variant="outline" className="uppercase text-[10px]">
                      {selectedJob.service_category || "General"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Device</p>
                    <p className="font-semibold">
                      {selectedJob.device_brand} {selectedJob.device_model}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={statusColors[selectedJob.status]}>
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="font-semibold">
                      ₹{Number(selectedJob.estimated_cost).toLocaleString()}
                    </p>
                  </div>
                  {selectedJob.rework_count > 0 && (
                    <div className="col-span-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded border border-purple-100 dark:border-purple-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-tighter flex items-center gap-1">
                        <RotateCcw className="h-3 w-3" /> Rework History
                      </span>
                      <Badge className="bg-purple-600">
                        {selectedJob.rework_count} Times
                      </Badge>
                    </div>
                  )}
                </div>

                {selectedJob.device_details &&
                  Object.keys(selectedJob.device_details).length > 0 && (
                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-2">
                        Specific Details
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(selectedJob.device_details).map(
                          ([key, val]: [string, any]) => (
                            <div key={key}>
                              <p className="text-[9px] text-muted-foreground uppercase">
                                {key.replace("_", " ")}
                              </p>
                              <p className="text-xs font-bold capitalize">
                                {val}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                {selectedJob.status === "Returned" &&
                  selectedJob.return_reason && (
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                      <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase mb-1">
                        Return Reason
                      </p>
                      <p className="text-sm font-medium">
                        {selectedJob.return_reason}
                      </p>
                    </div>
                  )}

                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Problem Description
                  </p>
                  <p className="text-sm p-3 bg-muted rounded-lg">
                    {selectedJob.problem_description}
                  </p>
                </div>
                {selectedJob.technician_name && (
                  <div>
                    <p className="text-xs text-muted-foreground">Technician</p>
                    <p className="font-medium">{selectedJob.technician_name}</p>
                  </div>
                )}
                {selectedJob.delivered_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Delivered/Returned At
                    </p>
                    <p className="font-medium text-success">
                      {new Date(selectedJob.delivered_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Clear Confirm */}
        <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" /> Move to
                Trash?
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              {clearType === "all"
                ? "All jobs will be moved to trash and job ID counter will reset to 1."
                : "All delivered jobs will be moved to trash."}
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setClearConfirmOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleClearJobs} disabled={isProcessing}>
                {isProcessing ? "Clearing..." : "Yes, Move to Trash"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Link Modal */}
        <PaymentLinkModal
          open={payLinkOpen}
          onOpenChange={setPayLinkOpen}
          job={selectedJob}
        />
      </div>
    </MainLayout>
  );
}
