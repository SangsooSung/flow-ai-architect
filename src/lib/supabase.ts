import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = 'https://dppjlzxdbsutmjcygitx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcGpsenhkYnN1dG1qY3lnaXR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTIyNDUsImV4cCI6MjA4Njk2ODI0NX0.Fk4jJevZOsxJ_rF87NKxsaO42RMrmJn7uQgYT-WRrPU';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Subscribe to real-time changes on a Supabase table.
 * Returns a cleanup function to unsubscribe.
 */
export function subscribeToTable<T extends Record<string, unknown>>(
  table: string,
  filter: string,
  callback: (payload: { new: T; old: T; eventType: string }) => void
) {
  const channel = supabase
    .channel(`realtime-${table}-${filter}`)
    .on<T>(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      (payload) => {
        callback({
          new: payload.new as T,
          old: payload.old as T,
          eventType: payload.eventType,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
