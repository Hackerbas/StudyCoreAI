import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function clear() {
    console.log("Clearing books...");
    const { data, error } = await supabase.from('books').delete().neq('id', 0);
    if (error) console.error(error);
    else console.log("Cleared successfully", data);
}
clear();
