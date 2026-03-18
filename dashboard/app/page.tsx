import DashboardClient from "@/components/DashboardClient";
import { fetchInfluencers } from "@/lib/supabase";

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
            <p className="font-medium text-slate-300">Vercel 설정 체크리스트</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5">
              <li>
                <strong className="text-slate-300">Project → Settings → Environment Variables</strong>
              </li>
              <li>
                이름은 <strong className="text-white">정확히</strong> (대소문자 동일):
                <ul className="mt-1 list-disc pl-4 font-mono text-xs text-sky-300">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY</li>
                </ul>
              </li>
              <li>
                URL은 <code className="rounded bg-slate-800 px-1">postgres://...</code> 가{" "}
                <strong className="text-amber-300">아닙니다</strong>. Supabase → Settings →
                API 의 <strong className="text-white">Project URL</strong> (
                https://xxxxx.supabase.co) 를 넣으세요.
              </li>
              <li>
                변수 저장 후{" "}
                <strong className="text-white">Redeploy</strong> 필수 (Deployments → 최신
                배포 ⋮ → Redeploy). 저장만 하면 기존 빌드에는 반영되지 않습니다.
              </li>
            </ol>
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
