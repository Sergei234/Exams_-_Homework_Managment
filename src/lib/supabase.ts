import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ivhjevgoioimooclkqhb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xfPrzod6iAT5-VaELC_RJw_EPls27Gv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
