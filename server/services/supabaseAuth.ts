import { createClient } from "@supabase/supabase-js";
import { ENV } from "../_core/env";

const supabaseUrl = ENV.supabaseUrl;
const supabaseKey = ENV.supabaseKey;

export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export class SupabaseAuthService {
  /**
   * Send a password reset email via Supabase
   */
  async sendResetEmail(email: string): Promise<boolean> {
    if (!supabase) {
      console.warn("[SupabaseAuth] Client not initialized. Check ENV.");
      return false;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.VITE_AUTH_PORTAL_URL || 'http://localhost:3001'}/setup-password`,
    });

    if (error) {
      console.error("[SupabaseAuth] Failed to send reset email:", error.message);
      return false;
    }

    return true;
  }

  /**
   * Validate a user exists in Supabase Auth or invite them
   */
  async ensureUser(email: string, name?: string): Promise<void> {
    if (!supabase) return;

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    const existing = users?.find(u => u.email === email);
    if (!existing) {
      console.log(`[SupabaseAuth] Inviting new user: ${email}`);
      await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: name }
      });
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();
