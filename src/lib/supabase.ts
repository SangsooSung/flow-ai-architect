import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = 'https://dppjlzxdbsutmjcygitx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpsenhkYnN1dG1qY3lnaXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTIyNDUsImV4cCI6MjA4Njk2ODI0NX0.Fk4jJevZOsxJ_rF87NKxsaO42RMrmJn7uQgYT-WRrPU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);