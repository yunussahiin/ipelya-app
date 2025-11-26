/**
 * Supabase Client
 * 
 * Bu dosya shared supabase client'ı export eder.
 * React Native için AsyncStorage kullanılır.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);
