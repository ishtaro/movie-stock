"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type AccountState = { error?: string } | null;

/**
 * 退会（SPEC.md F-02）: auth ユーザーを削除する。
 * profiles / viewing_records / user_achievements は FK の on delete cascade により
 * DB 内で原子的に削除される（途中失敗時はロールバック）。削除は即時【仮】（未決-3）。
 */
export async function deleteAccount(
  prev: AccountState,
  formData: FormData,
): Promise<AccountState> {
  void prev;
  void formData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return { error: "退会処理に失敗しました。時間をおいて再試行してください" };
  }

  await supabase.auth.signOut();
  redirect("/");
}
