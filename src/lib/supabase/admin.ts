import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role クライアント。退会処理（auth ユーザー削除）専用。
 * RLS をバイパスするため、用途を追加する場合は必ずレビューを通すこと。
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
