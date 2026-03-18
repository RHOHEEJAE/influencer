import DashboardClient from "@/components/DashboardClient";
import { fetchInfluencers } from "@/lib/fetch-influencers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const { data, error } = await fetchInfluencers();

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="max-w-xl rounded-2xl border border-amber-900/50 bg-amber-950/30 p-8">
          <h1 className="text-xl font-semibold text-amber-200">
            데이터를 불러올 수 없습니다
          </h1>
          <pre className="mt-4 whitespace-pre-wrap break-words text-left text-sm leading-relaxed text-amber-100/90">
            {error}
          </pre>
          <div className="mt-8 border-t border-amber-900/40 pt-6 text-left text-sm text-slate-400">
            <p className="font-medium text-slate-300">PostgreSQL 직접 연결 실패</p>
            <p className="mt-2 text-xs">
              풀러(6543) 연결·테이블 존재·비밀번호를 확인하세요. 연결 문자열을 바꾸려면
              Vercel에 <code className="rounded bg-slate-800 px-1">SUPABASE_DATABASE_URL</code>{" "}
              한 개만 넣어도 됩니다.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        데이터가 없습니다.
      </div>
    );
  }

  return <DashboardClient rows={data} />;
}
