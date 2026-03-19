"use client";

import { useEffect, useState } from "react";
import DashboardClient from "@/components/DashboardClient";
import type { InfluencerRow } from "@/lib/types";

export default function HomePage() {
  const [data, setData] = useState<InfluencerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/influencers")
      .then((res) => res.json())
      .then((body: { data?: InfluencerRow[]; error?: string | null }) => {
        if (body.error) setError(body.error);
        else setData(body.data ?? []);
      })
      .catch((e) => setError(e?.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
        <p>데이터 불러오는 중…</p>
      </div>
    );
  }

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
          <p className="mt-6 text-xs text-slate-500">
            Vercel → 해당 배포 → **Functions** 탭에서 `/api/influencers` 로그를 확인해 보세요.
          </p>
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        응답이 없습니다.
      </div>
    );
  }

  return <DashboardClient rows={data} />;
}
