import DashboardClient from "@/components/DashboardClient";
import { fetchInfluencers } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page() {
  const { data, error } = await fetchInfluencers();

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="max-w-lg rounded-2xl border border-amber-900/50 bg-amber-950/30 p-8 text-center">
          <h1 className="text-xl font-semibold text-amber-200">
            데이터를 불러올 수 없습니다
          </h1>
          <p className="mt-4 text-sm text-amber-100/80">{error}</p>
          <ul className="mt-6 list-disc space-y-2 pl-5 text-left text-sm text-slate-400">
            <li>
              Vercel 환경 변수:{" "}
              <code className="rounded bg-slate-800 px-1">
                NEXT_PUBLIC_SUPABASE_URL
              </code>
              ,{" "}
              <code className="rounded bg-slate-800 px-1">
                SUPABASE_SERVICE_ROLE_KEY
              </code>
            </li>
            <li>
              Supabase SQL Editor에서{" "}
              <code className="rounded bg-slate-800 px-1">supabase_schema.sql</code>{" "}
              실행 후 Python으로 수집 실행
            </li>
            <li>
              anon 키만 쓸 경우 테이블에{" "}
              <code className="rounded bg-slate-800 px-1">SELECT</code> RLS 정책
              필요
            </li>
          </ul>
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
