import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchMovies } from "@/lib/tmdb";

/** TMDb 検索のサーバー側プロキシ（API キーをクライアントに露出しない） */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    // 空・空白のみでは API を呼ばない（SPEC.md F-03 例外系）
    return NextResponse.json(
      { error: "検索語を入力してください" },
      { status: 400 },
    );
  }

  try {
    const results = await searchMovies(q);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json(
      { error: "作品情報の取得に失敗しました。時間をおいて再試行してください" },
      { status: 502 },
    );
  }
}
