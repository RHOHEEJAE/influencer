"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { InfluencerRow } from "@/lib/types";

const COLORS = [
  "#0ea5e9",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#6366f1",
];

function fmtNum(n: number | null | undefined) {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function DashboardClient({ rows }: { rows: InfluencerRow[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">수집 데이터가 없습니다</h1>
        <p className="mt-4 text-slate-400">
          로컬에서{" "}
          <code className="rounded bg-slate-800 px-2 py-0.5 text-sm">
            python influencer_collector.py
          </code>
          를 실행해 Supabase에 적재한 뒤 새로고침하세요.
        </p>
      </div>
    );
  }

  const categories = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach((r) => m.set(r.promo_category_key, r.promo_category_label));
    return Array.from(m.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (cat !== "all" && r.promo_category_key !== cat) return false;
      if (!q.trim()) return true;
      const s = q.toLowerCase();
      return (
        (r.display_name?.toLowerCase().includes(s) ?? false) ||
        (r.username?.toLowerCase().includes(s) ?? false) ||
        (r.promo_category_label?.includes(q) ?? false)
      );
    });
  }, [rows, q, cat]);

  const byCategoryCount = useMemo(() => {
    const m = new Map<string, { name: string; count: number }>();
    rows.forEach((r) => {
      const prev = m.get(r.promo_category_key) ?? {
        name: r.promo_category_label,
        count: 0,
      };
      prev.count += 1;
      m.set(r.promo_category_key, prev);
    });
    return Array.from(m.values()).map((v) => ({
      name: v.name.length > 8 ? v.name.slice(0, 8) + "…" : v.name,
      fullName: v.name,
      count: v.count,
    }));
  }, [rows]);

  const byCategoryAvgSubs = useMemo(() => {
    const acc = new Map<
      string,
      { label: string; sum: number; n: number }
    >();
    rows.forEach((r) => {
      const subs = r.subscribers_count ?? 0;
      const cur = acc.get(r.promo_category_key) ?? {
        label: r.promo_category_label,
        sum: 0,
        n: 0,
      };
      cur.sum += subs;
      cur.n += 1;
      acc.set(r.promo_category_key, cur);
    });
    return Array.from(acc.values()).map((v) => ({
      name: v.label.length > 10 ? v.label.slice(0, 10) + "…" : v.label,
      avg: Math.round(v.sum / Math.max(v.n, 1)),
    }));
  }, [rows]);

  const totalChannels = rows.length;
  const totalSubs = rows.reduce((s, r) => s + (r.subscribers_count ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10 border-b border-slate-800 pb-8">
        <p className="text-sm font-medium uppercase tracking-widest text-sky-400">
          Hecto · Influencer Data
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          인플루언서 수집 대시보드
        </h1>
        <p className="mt-3 max-w-2xl text-slate-400">
          YouTube 카테고리별 수집 데이터입니다. 구독자 수·카테고리 분포를
          확인할 수 있습니다.
        </p>
      </header>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="총 채널 수" value={String(totalChannels)} />
        <StatCard
          title="합산 구독자(추정)"
          value={fmtNum(totalSubs)}
          sub="중복 채널 포함 시 합산"
        />
        <StatCard title="카테고리 수" value={String(categories.length)} />
        <StatCard
          title="표시 중"
          value={String(filtered.length)}
          sub="필터 적용 후"
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
          <h2 className="mb-4 text-lg font-semibold text-white">
            카테고리별 채널 수
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategoryCount}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {byCategoryCount.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                      stroke="transparent"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number, _n, p) => [
                    `${v}채널`,
                    (p?.payload as { fullName?: string })?.fullName ?? "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur">
          <h2 className="mb-4 text-lg font-semibold text-white">
            카테고리별 평균 구독자
          </h2>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byCategoryAvgSubs} layout="vertical" margin={{ left: 8 }}>
                <XAxis
                  type="number"
                  tickFormatter={fmtNum}
                  stroke="#64748b"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  stroke="#64748b"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  formatter={(v: number) => [fmtNum(v), "평균 구독자"]}
                />
                <Bar dataKey="avg" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterBtn active={cat === "all"} onClick={() => setCat("all")}>
            전체
          </FilterBtn>
          {categories.map(([key, label]) => (
            <FilterBtn
              key={key}
              active={cat === key}
              onClick={() => setCat(key)}
            >
              {label}
            </FilterBtn>
          ))}
        </div>
        <input
          type="search"
          placeholder="채널명·핸들 검색…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 sm:max-w-xs"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/30">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">채널명</th>
                <th className="px-4 py-3 font-medium">구독자</th>
                <th className="px-4 py-3 font-medium">평균 조회</th>
                <th className="px-4 py-3 font-medium">링크</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filtered.map((r) => (
                <tr
                  key={`${r.channel_id}-${r.promo_category_key}`}
                  className="transition hover:bg-slate-800/40"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                    <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-xs text-sky-300">
                      {r.promo_category_label}
                    </span>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-medium text-white">
                    {r.display_name ?? "—"}
                    {r.username ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">
                        @{r.username}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-200">
                    {fmtNum(r.subscribers_count)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-slate-400">
                    {fmtNum(r.avg_views)}
                  </td>
                  <td className="px-4 py-3">
                    {r.profile_url ? (
                      <a
                        href={r.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        YouTube
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 ? (
          <p className="p-8 text-center text-slate-500">조건에 맞는 데이터가 없습니다.</p>
        ) : null}
      </div>

      <footer className="mt-12 text-center text-xs text-slate-600">
        수집 스크립트: influencer_collector.py · 테이블: hecto_promo_influencers
      </footer>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-900/40 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub ? <p className="mt-1 text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
}

function FilterBtn({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
