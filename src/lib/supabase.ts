import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://hnomdgqyuxupyyslrefp.supabase.co";
const supabasePublishableKey = "sb_publishable_DNv4w0K4r7jmpj-p6AqXsQ_OG-tOt85";

export const supabase = createClient(supabaseUrl, supabasePublishableKey);
