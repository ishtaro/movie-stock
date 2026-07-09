import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { TmdbAttribution } from "@/components/tmdb-attribution";
import { createClient } from "@/lib/supabase/server";

/** 認証必須エリアの共通レイアウト（DESIGN.md §3） */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 未確認の解錠があればアチーブメントタブにドットを出す
  const { count } = await supabase
    .from("user_achievements")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("seen", false);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav hasUnseen={(count ?? 0) > 0} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-5 md:px-6 md:pt-8">
        {children}
      </main>
      <footer className="pt-10 pb-20 md:pb-8">
        <TmdbAttribution />
      </footer>
    </div>
  );
}
