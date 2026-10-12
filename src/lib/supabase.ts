import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ultqkgattanqwugtwxpj.supabase.co";
const supabaseAnonKey = "sb_publishable_J5WWDWv0FV9o1k1OHErbOQ_hr03oOoA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);