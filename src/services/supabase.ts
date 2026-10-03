// Single shared client so login sessions are consistent across the whole app.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { supabase as sharedClient } from "@/integrations/supabase/client";

export const supabase = sharedClient as unknown as SupabaseClient<Database>;
