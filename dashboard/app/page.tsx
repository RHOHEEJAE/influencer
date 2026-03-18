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
            <p className="font-medium text-slate-300">Vercel 설정 (택 1)</p>
            <ul className="mt-3 list-disc space-y-3 pl-5">
              <li>
                <strong className="text-emerald-300">간단:</strong>{" "}
                <code className="rounded bg-slate-800 px-1 text-xs">
                  SUPABASE_DATABASE_URL
                </code>{" "}
                에 Python 수집에 쓰는{" "}
                <code className="rounded bg-slate-800 px-1 text-xs">
                  postgresql://...
                </code>{" "}
                그대로 넣기 → Redeploy
              </li>
              <li>
                <strong className="text-sky-300">REST:</strong>{" "}
                <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> +{" "}
                <code className="text-xs">SUPABASE_SECRET_KEY</code> (신규{" "}
                <code className="text-xs">sb_secret_…</code>) 또는 구{" "}
                <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>
              </li>
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              변수 저장 후 반드시 Deployments → ⋮ → Redeploy
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
