import { useState, useEffect, useRef } from "react";
import { useSakonet } from "./store";
import SakonetChatbot from "./SakonetChatbot";
import { SaccoSupport, OperatorSupport } from "./support";
import {
  LayoutGrid, Building2, GitBranch, ShieldCheck, ScrollText, Plus, Wallet,
  ChevronRight, ArrowLeft, Lock, Unlock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Landmark, Bell, X, Users, ArrowUpRight, ArrowDownLeft, TrendingUp,
  BookOpen, Percent, Layers, FileCheck2,
  Sparkles, MessageCircle, Send, LogOut, LifeBuoy,
} from "lucide-react";

/* -----------------------------------------------------------------
   SAKONET — network operator console.
   SAKONET is the integration layer connecting Mkulima SACCO and
   Beauty SACCO. The onboarding flow below is kept as a demo beat —
   it always targets Beauty SACCO (already active on the network),
   so "onboarding" walks through verification and then hands off
   straight to Beauty's SACCO login instead of creating a duplicate.
----------------------------------------------------------------- */

const c = {
  ink: "#12202E",
  paper: "#EEF1F5",
  panel: "#FFFFFF",
  line: "#DCE2EA",
  primary: "#2F5D8A",
  primaryDeep: "#1F4368",
  primarySoft: "#E4EBF3",
  gold: "#B8862E",
  goldSoft: "#F3E9CE",
  success: "#2E7D4F",
  successSoft: "#E3EFE6",
  danger: "#A6402A",
  dangerSoft: "#F3E1DB",
  muted: "#69707C",
  mono: "#3C4552",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Public+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
  .disp { font-family: 'Space Grotesk', sans-serif; }
  .body { font-family: 'Public Sans', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }
`;

const kes = (n) => "KES " + Number(n).toLocaleString("en-KE");

// ---------- Small building blocks ----------
function Pill({ tone = "neutral", children }) {
  const tones = {
    neutral: { bg: c.primarySoft, fg: c.primary },
    pending: { bg: c.goldSoft, fg: "#7A5C16" },
    active: { bg: c.successSoft, fg: c.success },
    danger: { bg: c.dangerSoft, fg: c.danger },
  };
  const t = tones[tone];
  return (
    <span className="body" style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

function KpiCard({ label, value, icon: Icon, tone }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="body" style={{ fontSize: 11.5, color: c.muted, fontWeight: 600 }}>{label}</span>
        <Icon size={16} color={tone || c.primary} />
      </div>
      <p className="disp mono" style={{ fontSize: 22, fontWeight: 700, color: c.ink }}>{value}</p>
    </div>
  );
}

function FloatBar({ total, locked }) {
  const pct = total > 0 ? Math.round((locked / total) * 100) : 0;
  return (
    <div className="rounded-full overflow-hidden" style={{ height: 7, background: c.paper }}>
      <div style={{ width: `${pct}%`, height: "100%", background: c.gold }} />
    </div>
  );
}

function StageChip({ stage }) {
  const map = {
    submitted: { tone: "neutral", label: "Awaiting Mkulima review", icon: ScrollText },
    network_routed: { tone: "pending", label: "With guarantor SACCO", icon: Loader2, spin: true },
    sacco_verified: { tone: "pending", label: "Verified by guarantor SACCO", icon: CheckCircle2 },
    notified: { tone: "pending", label: "Sent to member by SACCO", icon: Loader2, spin: true },
    member_responded: { tone: "pending", label: "Decision at guarantor SACCO", icon: ScrollText },
    awaiting_sacco_confirmation: { tone: "pending", label: "Guarantor SACCO confirming acceptance", icon: Loader2, spin: true },
    sacco_confirmed_accepted: { tone: "active", label: "Confirmation delivered", icon: CheckCircle2 },
    sacco_confirmed_declined: { tone: "danger", label: "SACCO confirmed decline", icon: XCircle },
    sacco_confirmation_received: { tone: "active", label: "Confirmed with borrower SACCO", icon: CheckCircle2 },
    sacco_confirmation_received_declined: { tone: "danger", label: "Decline confirmed with borrower SACCO", icon: XCircle },
    sacco_received_confirmation: { tone: "active", label: "Guarantee secured", icon: Lock },
    member_notified_by_mkulima: { tone: "active", label: "Guarantee secured", icon: Lock },
    sacco_rejected: { tone: "danger", label: "Rejected by guarantor SACCO", icon: XCircle },
    accepted: { tone: "active", label: "Accepted", icon: CheckCircle2 },
    rejected: { tone: "danger", label: "Rejected", icon: XCircle },
    declined: { tone: "danger", label: "Declined by SACCO staff", icon: XCircle },
    locked: { tone: "active", label: "Float committed", icon: Lock },
  };
  const s = map[stage] || map.submitted;
  const Icon = s.icon;
  return (
    <Pill tone={s.tone}>
      <span className="flex items-center gap-1">
        <Icon size={11} className={s.spin ? "animate-spin" : ""} /> {s.label}
      </span>
    </Pill>
  );
}

/* ================= CLF TOP-UP FORECAST ================= */
// Read-only view of getClfForecast() from the store. Sits in a side
// column so it never crowds the main content.
const pctText = (x) => `${Math.round(x * 100)}%`;

function timingText(f) {
  if (f.weeksToThreshold === 0) return "Already above the danger line";
  if (f.weeksToThreshold === null) return "No crossing projected";
  return `In about ${f.weeksToThreshold} week${f.weeksToThreshold === 1 ? "" : "s"}`;
}

function ForecastCard({ saccoCode, full = false }) {
  const { state, getClfForecast } = useSakonet();
  const [open, setOpen] = useState(false);
  const f = getClfForecast(saccoCode);
  const name = state.saccos[saccoCode]?.name || saccoCode;

  if (!f.ready) {
    return (
      <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <p className="body" style={{ fontSize: 12, fontWeight: 700, color: c.ink }}>{name}</p>
        <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 4 }}>{f.reason}</p>
      </div>
    );
  }

  const needs = f.suggestedTopUp > 0;
  const tone = needs ? c.danger : c.success;
  const showMore = full || open;
  const low = Math.max(0, f.suggestedTopUp - f.uncertainty);
  const high = f.suggestedTopUp + f.uncertainty;

  return (
    <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="body" style={{ fontSize: 12, fontWeight: 700, color: c.ink }}>{name}</span>
        <Pill tone={needs ? "danger" : "active"}>{needs ? "Top-up suggested" : "No top-up needed"}</Pill>
      </div>

      <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Suggested top-up</p>
      <p className="mono" style={{ fontSize: 19, fontWeight: 700, color: tone, marginTop: 2 }}>{kes(f.suggestedTopUp)}</p>

      <div className="flex items-center gap-1.5 mt-2">
        <Sparkles size={12} color={c.primary} />
        <span className="body" style={{ fontSize: 11.5, color: c.ink, fontWeight: 600 }}>{timingText(f)}</span>
      </div>

      <div className="mt-3">
        <div className="relative rounded-full" style={{ height: 7, background: c.paper }}>
          <div className="rounded-full" style={{ width: pctText(f.predictedRatio), height: "100%", background: tone }} />
          <div style={{ position: "absolute", left: pctText(f.dangerRatio), top: -3, width: 2, height: 13, background: c.ink }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="body" style={{ fontSize: 10.5, color: c.muted }}>Forecast committed {pctText(f.predictedRatio)}</span>
          <span className="body" style={{ fontSize: 10.5, color: c.muted }}>Danger {pctText(f.dangerRatio)}</span>
        </div>
      </div>

      {showMore && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${c.line}` }}>
          <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Uncertainty range</p>
          <p className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: c.ink, marginTop: 2 }}>
            {needs ? `${kes(low)} – ${kes(high)}` : `± ${kes(f.uncertainty)} on projected committed float`}
          </p>
          <p className="body" style={{ fontSize: 10.5, color: c.muted, marginTop: 10 }}>Key factors</p>
          <ul className="flex flex-col gap-1.5 mt-1" style={{ paddingLeft: 14, listStyle: "disc" }}>
            {f.factors.map((t) => (
              <li key={t} className="body" style={{ fontSize: 11, color: c.ink, lineHeight: 1.45 }}>{t}</li>
            ))}
          </ul>
          <p className="body" style={{ fontSize: 10, color: c.muted, marginTop: 10, lineHeight: 1.4 }}>
            Estimate from {f.snapshots} float snapshots ({f.modelUsed === "trend" ? "trend model" : "moving-average baseline"}). Early history is simulated until real float movements build up.
          </p>
        </div>
      )}

      {!full && (
        <button onClick={() => setOpen(!open)} className="body flex items-center gap-1 mt-3" style={{ fontSize: 11.5, color: c.primary, fontWeight: 700 }}>
          {open ? "Show less" : "Details"} <ChevronRight size={12} style={{ transform: open ? "rotate(90deg)" : "none" }} />
        </button>
      )}
    </div>
  );
}

// Projection chart: recorded committed-float ratio, the forecast point,
// an uncertainty band that widens from the last snapshot, and the
// danger / target lines the top-up logic works against.
function ForecastChart({ saccoCode }) {
  const { state, getClfForecast } = useSakonet();
  const f = getClfForecast(saccoCode);
  const sacco = state.saccos[saccoCode];
  if (!f.ready || !sacco) return null;

  const history = (state.floatHistory?.[saccoCode] || [])
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-13)
    .map((h) => (h.totalFloat > 0 ? h.locked / h.totalFloat : 0));

  const W = 400, H = 180, L = 34, R = 14, T = 12, B = 26;
  const n = history.length;
  const xAt = (i) => L + (i / n) * (W - L - R);
  const yAt = (v) => T + (1 - Math.max(0, Math.min(1, v))) * (H - T - B);
  const band = sacco.totalFloat > 0 ? f.uncertainty / sacco.totalFloat : 0;
  const lastX = xAt(n - 1), lastY = yAt(history[n - 1]);
  const projX = xAt(n), projY = yAt(f.predictedRatio);
  const line = history.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" ");
  const needs = f.suggestedTopUp > 0;
  const tone = needs ? c.danger : c.success;

  return (
    <div className="rounded-xl p-3" style={{ background: c.paper }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={yAt(g)} y2={yAt(g)} stroke={c.line} strokeWidth="1" />
            <text x={L - 6} y={yAt(g) + 3} textAnchor="end" fontSize="9" fill={c.muted}>{Math.round(g * 100)}%</text>
          </g>
        ))}
        <line x1={L} x2={W - R} y1={yAt(f.dangerRatio)} y2={yAt(f.dangerRatio)} stroke={c.danger} strokeWidth="1.2" strokeDasharray="5 4" />
        <line x1={L} x2={W - R} y1={yAt(f.targetRatio)} y2={yAt(f.targetRatio)} stroke={c.gold} strokeWidth="1.2" strokeDasharray="2 3" />
        <polygon
          points={`${lastX},${lastY} ${projX},${yAt(f.predictedRatio + band)} ${projX},${yAt(f.predictedRatio - band)}`}
          fill={tone} opacity="0.16"
        />
        <polyline points={line} fill="none" stroke={c.primary} strokeWidth="2" strokeLinejoin="round" />
        <line x1={lastX} y1={lastY} x2={projX} y2={projY} stroke={tone} strokeWidth="2" strokeDasharray="4 3" />
        <circle cx={lastX} cy={lastY} r="3" fill={c.primary} />
        <circle cx={projX} cy={projY} r="4.5" fill={c.panel} stroke={tone} strokeWidth="2" />
        <text x={L} y={H - 8} fontSize="9" fill={c.muted}>{n - 1} snapshots ago</text>
        <text x={lastX} y={H - 8} textAnchor="middle" fontSize="9" fill={c.muted}>Now</text>
        <text x={W - R} y={H - 8} textAnchor="end" fontSize="9" fill={tone} fontWeight="700">Forecast</text>
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {[
          ["Recorded", c.primary], ["Forecast + range", tone], ["Danger line", c.danger], ["Target buffer", c.gold],
        ].map(([label, color]) => (
          <span key={label} className="body flex items-center gap-1" style={{ fontSize: 10, color: c.muted }}>
            <span style={{ width: 10, height: 3, background: color, display: "inline-block", borderRadius: 2 }} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

function Pager({ page, pages, total, size, onPage, noun = "rows" }) {
  const start = total === 0 ? 0 : page * size + 1;
  const end = Math.min((page + 1) * size, total);
  const btn = (disabled) => ({ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: c.panel, color: disabled ? c.line : c.primary, border: `1px solid ${c.line}` });
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${c.line}`, background: c.paper }}>
      <span className="body" style={{ fontSize: 11.5, color: c.muted }}>
        {total === 0 ? `0 ${noun}` : `Showing ${start}–${end} of ${total} ${noun}`}
      </span>
      <div className="flex items-center gap-2">
        <button onClick={() => onPage(Math.max(0, page - 1))} disabled={page === 0} className="body rounded-lg" style={btn(page === 0)}>Previous</button>
        <span className="body" style={{ fontSize: 11.5, color: c.muted }}>Page {page + 1} of {pages}</span>
        <button onClick={() => onPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1} className="body rounded-lg" style={btn(page >= pages - 1)}>Next</button>
      </div>
    </div>
  );
}

/* ================= PREDICTIVE ANALYSIS PAGE ================= */
// Built for a network that grows: a sortable, searchable, paged table
// with the riskiest SACCOs first, and one SACCO's full chart on demand
// rather than a chart per SACCO.
const RISK_META = {
  top: { label: "Top-up suggested", tone: "danger", order: 0 },
  watch: { label: "Watch", tone: "pending", order: 1 },
  ok: { label: "Healthy", tone: "active", order: 2 },
  na: { label: "Building history", tone: "neutral", order: 3 },
};
const WATCH_WITHIN_WEEKS = 8;

function riskOf(f) {
  if (!f.ready) return "na";
  if (f.suggestedTopUp > 0) return "top";
  if (f.weeksToThreshold !== null && f.weeksToThreshold <= WATCH_WITHIN_WEEKS) return "watch";
  return "ok";
}

function PredictiveView() {
  const { state, getClfForecast } = useSakonet();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const PAGE = 10;

  const items = Object.values(state.saccos)
    .filter((sc) => sc.onboarded === true)
    .map((sacco) => {
      const f = getClfForecast(sacco.code);
      return { sacco, f, risk: riskOf(f) };
    })
    .sort((a, b) => RISK_META[a.risk].order - RISK_META[b.risk].order || (b.f.predictedRatio || 0) - (a.f.predictedRatio || 0));

  if (selected && state.saccos[selected]) {
    const sacco = state.saccos[selected];
    return (
      <div>
        <button onClick={() => setSelected(null)} className="body flex items-center gap-1 mb-4" style={{ fontSize: 12.5, color: c.muted, fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to all SACCOs
        </button>
        <h3 className="disp mb-3" style={{ fontSize: 18, fontWeight: 700, color: c.ink }}>{sacco.name}</h3>
        <div className="grid grid-cols-2 gap-5 items-start">
          <ForecastChart saccoCode={selected} />
          <ForecastCard saccoCode={selected} full />
        </div>
      </div>
    );
  }

  const counts = {
    all: items.length,
    top: items.filter((i) => i.risk === "top").length,
    watch: items.filter((i) => i.risk === "watch").length,
    ok: items.filter((i) => i.risk === "ok" || i.risk === "na").length,
  };
  const totalTopUp = items.reduce((sum, i) => sum + (i.f.ready ? i.f.suggestedTopUp : 0), 0);
  const readyItems = items.filter((i) => i.f.ready);
  const avgForecast = readyItems.length ? readyItems.reduce((sum, i) => sum + i.f.predictedRatio, 0) / readyItems.length : 0;

  const q = query.trim().toLowerCase();
  const rows = items.filter((i) => {
    if (filter === "top" && i.risk !== "top") return false;
    if (filter === "watch" && i.risk !== "watch") return false;
    if (filter === "ok" && !(i.risk === "ok" || i.risk === "na")) return false;
    return !q || `${i.sacco.name} ${i.sacco.code}`.toLowerCase().includes(q);
  });
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * PAGE, (cur + 1) * PAGE);
  const th = { textAlign: "left", padding: "10px 14px", fontWeight: 700, color: c.muted, fontSize: 11.5, whiteSpace: "nowrap" };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-5" style={{ background: c.primaryDeep, color: "#fff" }}>
        <p className="body flex items-center gap-1.5" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .7, color: "#AEC3DA" }}>
          <Sparkles size={12} /> PREDICTIVE ANALYSIS
        </p>
        <h1 className="disp" style={{ fontSize: 25, fontWeight: 700, marginTop: 5 }}>CLF top-up forecast</h1>
        <p className="body" style={{ fontSize: 12, color: "#D8E3EF", lineHeight: 1.5, marginTop: 4, maxWidth: 640 }}>
          Projects each SACCO's committed-float ratio one step ahead and suggests a top-up when it would cross the danger line. SACCOs most likely to need cover are listed first.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Need a top-up" value={counts.top} icon={AlertTriangle} tone={c.danger} />
        <KpiCard label="On watch" value={counts.watch} icon={TrendingUp} tone={c.gold} />
        <KpiCard label="Suggested top-ups (total)" value={kes(totalTopUp)} icon={Landmark} />
        <KpiCard label="Avg. forecast committed" value={`${Math.round(avgForecast * 100)}%`} icon={Sparkles} />
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {[["all", "All"], ["top", "Top-up suggested"], ["watch", "Watch"], ["ok", "Healthy"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilter(id); setPage(0); }}
              className="body rounded-full"
              style={{ padding: "6px 13px", fontSize: 12, fontWeight: 700, background: filter === id ? c.primaryDeep : c.panel, color: filter === id ? "#fff" : c.muted, border: `1px solid ${filter === id ? c.primaryDeep : c.line}` }}
            >
              {label} · {counts[id]}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search SACCO name or code"
          className="body rounded-lg"
          style={{ padding: "8px 12px", fontSize: 12.5, border: `1px solid ${c.line}`, outline: "none", width: 260, background: c.panel }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}`, background: c.panel }}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 820 }}>
            <thead>
              <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
                {["SACCO", "Committed now", "Forecast", "Timing", "Suggested top-up", "Status", ""].map((h) => (
                  <th key={h} style={{ ...th, textAlign: h === "Suggested top-up" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: c.muted }}>No SACCOs match your search or filter.</td></tr>
              )}
              {visible.map(({ sacco, f, risk }, i) => (
                <tr key={sacco.code} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontWeight: 700, color: c.ink }}>{sacco.name}</span>
                    <br /><span className="mono" style={{ fontSize: 10.5, color: c.muted }}>{sacco.code}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }} className="mono">{f.ready ? pctText(f.currentRatio) : "—"}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 700, color: risk === "top" ? c.danger : c.ink }} className="mono">{f.ready ? pctText(f.predictedRatio) : "—"}</td>
                  <td style={{ padding: "11px 14px", color: c.muted }}>{f.ready ? timingText(f) : "—"}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontWeight: 700, color: c.ink }} className="mono">{f.ready ? kes(f.suggestedTopUp) : "—"}</td>
                  <td style={{ padding: "11px 14px" }}><Pill tone={RISK_META[risk].tone}>{RISK_META[risk].label}</Pill></td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={() => setSelected(sacco.code)} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>View <ChevronRight size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pager page={cur} pages={pages} total={rows.length} size={PAGE} onPage={setPage} noun="SACCOs" />
      </div>
    </div>
  );
}

/* ================= SIDEBAR ================= */
function Sidebar({ nav, setNav }) {
  const items = [
    { id: "dashboard", label: "Network dashboard", icon: LayoutGrid },
    { id: "saccos", label: "SACCOs & float", icon: Building2 },
    { id: "requests", label: "Guarantee requests", icon: GitBranch },
    { id: "loans", label: "Loans management", icon: Wallet },
    { id: "guarantees", label: "Guarantees & claims", icon: ShieldCheck },
    { id: "predictive", label: "Predictive analysis", icon: Sparkles },
    { id: "support", label: "Customer service", icon: LifeBuoy },
    { id: "loan-product", label: "Boresha loan product", icon: BookOpen },
  ];
  return (
    <div className="flex flex-col" style={{ width: 246, background: c.primaryDeep, flexShrink: 0 }}>
      <div className="px-5 pt-6 pb-5">
        <p className="disp" style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>Sakonet Operator</p>
        <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA", fontWeight: 600, letterSpacing: 0.4 }}>NETWORK MANAGEMENT CONSOLE</p>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {items.map((it) => {
          const active = nav === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setNav(it.id)}
              className="flex items-center gap-3 rounded-lg body"
              style={{ padding: "9px 12px", fontSize: 13, fontWeight: 500, color: active ? "#fff" : "#B7C7D8", background: active ? "rgba(255,255,255,0.09)" : "transparent" }}
            >
              <Icon size={16} /> {it.label}
            </button>
          );
        })}
      </div>
      <div className="mt-auto px-5 pb-6">
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}>
          <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA" }}>Core rule</p>
          <p className="body" style={{ fontSize: 11.5, color: "#fff", lineHeight: 1.4, marginTop: 2 }}>Sakonet talks only to SACCOs. Each SACCO talks only to its own members.</p>
        </div>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */
function DashboardView({ setNav }) {
  const store = useSakonet();
  const { state } = store;
  const saccos = Object.values(state.saccos).filter((s) => s.onboarded === true);
  const totalFloat = saccos.reduce((s, x) => s + x.totalFloat, 0);
  const lockedFloat = saccos.reduce((s, x) => s + x.locked, 0);
  const availableFloat = totalFloat - lockedFloat;
  const guarantees = Object.values(state.guarantees);
  const activeGuarantees = guarantees.filter((g) => g.status === "performing").length;
  const claims = Object.values(state.claims);
  const settledVolume = claims.filter((cl) => cl.status === "settled").reduce((s, cl) => s + cl.amount, 0);
  const openTickets = Object.values(state.tickets || {}).filter((t) => t.status === "open" || t.status === "in_progress").length;
  const requests = Object.values(state.requests);
  const pendingRequests = requests.filter((r) => !["member_notified_by_mkulima", "rejected"].includes(r.stage)).length;
  const needingTopUp = saccos.filter((sc) => {
    const f = store.getClfForecast(sc.code);
    return f.ready && f.suggestedTopUp > 0;
  }).length;
  const topSaccos = saccos.slice().sort((a, b) => (b.totalFloat ? b.locked / b.totalFloat : 0) - (a.totalFloat ? a.locked / a.totalFloat : 0)).slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="SACCOs on network" value={saccos.length} icon={Building2} />
        <KpiCard label="Total network float" value={kes(totalFloat)} icon={Landmark} />
        <KpiCard label="Committed float" value={kes(lockedFloat)} icon={Lock} tone={c.gold} />
        <KpiCard label="Available float" value={kes(availableFloat)} icon={Unlock} tone={c.success} />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Active guarantees" value={activeGuarantees} icon={ShieldCheck} />
        <KpiCard label="Guarantees claimed" value={claims.length} icon={AlertTriangle} tone={c.danger} />
        <KpiCard label="Settled volume" value={kes(settledVolume)} icon={CheckCircle2} tone={c.success} />
        <KpiCard label="Open support tickets" value={openTickets} icon={LifeBuoy} tone={c.gold} />
      </div>

      <button
        onClick={() => setNav("predictive")}
        className="rounded-2xl p-4 flex items-center justify-between gap-4 text-left"
        style={{ background: c.panel, border: `1px solid ${c.line}` }}
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: c.primarySoft }}>
            <Sparkles size={17} color={c.primary} />
          </span>
          <span>
            <span className="disp block" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Predictive analysis</span>
            <span className="body block" style={{ fontSize: 12, color: needingTopUp > 0 ? c.danger : c.success, fontWeight: 600, marginTop: 2 }}>
              {needingTopUp} of {saccos.length} SACCOs forecast to need a top-up
            </span>
          </span>
        </span>
        <span className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>Open <ChevronRight size={13} /></span>
      </button>

      <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>SACCO float positions{saccos.length > 5 ? " · highest commitment" : ""}</h3>
          <button onClick={() => setNav("saccos")} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>
            Manage <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {topSaccos.map((s) => (
            <div key={s.code}>
              <div className="flex justify-between mb-1">
                <span className="body" style={{ fontSize: 12.5, fontWeight: 600, color: c.ink }}>{s.name}</span>
                <span className="mono" style={{ fontSize: 11.5, color: c.muted }}>{kes(s.locked)} committed / {kes(s.totalFloat)}</span>
              </div>
              <FloatBar total={s.totalFloat} locked={s.locked} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-4" style={{ background: c.primarySoft, border: `1px solid #C7D6E8` }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Network setup</h3>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>SAKONET is the network layer connecting Mkulima SACCO and Beauty SACCO — routing guarantee requests and confirmations between them without either SACCO's members ever contacting the other SACCO directly.</p>
          </div>
          <Pill tone="neutral">2 network SACCOs</Pill>
        </div>
      </div>

      {requests.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: c.primarySoft, border: `1px solid #C7D6E8` }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.primaryDeep }}>Live requests</h3>
            <span className="body" style={{ fontSize: 12, color: c.muted }}>{pendingRequests} pending</span>
          </div>
          {requests.filter(r => r.stage !== "member_notified_by_mkulima" && r.stage !== "rejected").slice(0, 2).map((r) => {
            const borrowerSacco = state.saccos[r.borrowerSacco]?.name || r.borrowerSacco;
            const guarantorSacco = state.saccos[r.guarantorSacco]?.name || r.guarantorSacco;
            return (
              <div key={r.id} className="mt-3">
                <p className="body" style={{ fontSize: 12.5, color: c.ink }}>
                  {r.borrowerName || "Member"} at {borrowerSacco} needs {r.guarantorName || "Member"} at {guarantorSacco} to cover {kes(r.amount)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StageChip stage={r.stage} />
                  <button onClick={() => setNav("requests")} className="body flex items-center gap-1" style={{ fontSize: 11.5, color: c.primary, fontWeight: 700 }}>
                    View <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= SACCOS & FLOAT ================= */
// Onboarding demo beat. Always walks through verifying Beauty SACCO's
// details — the form is pre-filled with Beauty's real record. Since
// Beauty is already active on the network, "submitting" doesn't create
// a new SACCO; it confirms the existing one and hands off to its login.
function OnboardModal({ onClose, onOpenNetwork }) {
  const store = useSakonet();
  const beauty = store.state.saccos.BTY;
  const [form] = useState({
    name: beauty.name,
    reg: beauty.registrationNo,
    contact: beauty.contact,
    email: beauty.email,
    phone: beauty.phone,
  });
  const [checks, setChecks] = useState([]);
  const [done, setDone] = useState(false);

  const steps = ["SACCO details verified", "Registration number verified", "Integration endpoint tested", "Network agreement confirmed", "Existing KES 1,000,000 float confirmed"];

  const runVerification = () => {
    setChecks([]);
    setDone(false);
    steps.forEach((s, i) => {
      setTimeout(() => setChecks((prev) => [...prev, s]), (i + 1) * 450);
    });
    setTimeout(() => setDone(true), (steps.length + 1) * 450);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(18,32,46,0.55)", zIndex: 30 }}>
      <div className="rounded-2xl p-6" style={{ background: c.panel, width: 480, maxHeight: "85vh", overflowY: "auto" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>Add SACCO to Sakonet</h3>
          <button onClick={onClose}><X size={18} color={c.muted} /></button>
        </div>

        {!checks.length && !done && (
          <div className="flex flex-col gap-3">
            {[
              ["SACCO name", form.name],
              ["Registration number", form.reg],
              ["Contact person", form.contact],
              ["Email", form.email],
              ["Phone", form.phone],
            ].map(([label, value]) => (
              <div key={label}>
                <p className="body" style={{ fontSize: 11.5, fontWeight: 600, color: c.muted, marginBottom: 4 }}>{label}</p>
                <input value={value} readOnly className="body w-full rounded-lg" style={{ padding: "9px 12px", fontSize: 13, border: `1px solid ${c.line}`, outline: "none", background: c.paper, color: c.ink }} />
              </div>
            ))}
            <div className="rounded-xl p-3 mt-1" style={{ background: c.goldSoft }}>
              <p className="body" style={{ fontSize: 12, fontWeight: 700, color: "#7A5C16" }}>Guarantee float: {kes(beauty.totalFloat)}</p>
              <p className="body" style={{ fontSize: 11, color: "#7A5C16", marginTop: 2 }}>Backs every guarantee this SACCO's members make across the network.</p>
            </div>
            <button
              onClick={runVerification}
              className="w-full rounded-xl body mt-2"
              style={{ padding: "11px 0", fontSize: 13.5, fontWeight: 700, background: c.primary, color: "#fff" }}
            >
              Submit onboarding request
            </button>
          </div>
        )}

        {checks.length > 0 && (
          <div className="flex flex-col gap-2">
            {steps.map((s) => (
              <div key={s} className="flex items-center gap-2">
                {checks.includes(s) ? <CheckCircle2 size={15} color={c.success} /> : <Loader2 size={15} color={c.muted} className="animate-spin" />}
                <span className="body" style={{ fontSize: 12.5, color: c.ink }}>{s}</span>
              </div>
            ))}
            {done && (
              <div className="rounded-xl p-4 mt-3" style={{ background: c.successSoft, border: `1px solid #BBD8C4` }}>
                <p className="body" style={{ fontSize: 12, fontWeight: 700, color: c.success }}>{beauty.name} already exists on SAKONET</p>
                <p className="body" style={{ fontSize: 11.5, color: c.ink, marginTop: 5 }}>{beauty.name} · {beauty.code}</p>
                <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Network PIN</p>
                <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: c.primaryDeep, letterSpacing: 3 }}>{beauty.networkPin}</p>
                <p className="body" style={{ fontSize: 10.5, color: c.muted, marginTop: 4 }}>This SACCO is already active and integrated on SAKONET — proceed straight to its network login.</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={onClose} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: c.paper, color: c.ink, border: `1px solid ${c.line}` }}>Done</button>
                  <button onClick={() => onOpenNetwork(beauty.code)} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: c.primaryDeep, color: "#fff" }}>Continue to SACCO login</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SaccoDetail({ sacco, onBack }) {
  const store = useSakonet();
  const { state, authenticateSaccoApi } = store;
  const available = sacco.totalFloat - sacco.locked;
  const [pin, setPin] = useState("");
  const [apiResult, setApiResult] = useState(null);

  const testApiAccess = () => {
    const result = authenticateSaccoApi(sacco.code, pin);
    setApiResult(result.ok ? { ok: true, message: "API authentication accepted. SACCO can access SAKONET through the network API." } : { ok: false, message: result.error });
  };

  const saccoRequests = Object.values(state.requests).filter(
    r => r.guarantorSacco === sacco.code || r.borrowerSacco === sacco.code
  );

  return (
    <div>
      <button onClick={onBack} className="body flex items-center gap-1 mb-4" style={{ fontSize: 12.5, color: c.muted, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to SACCOs
      </button>
      <div className="rounded-2xl p-5 mb-5" style={{ background: c.primaryDeep }}>
        <p className="body" style={{ fontSize: 12, color: "#AEC3DA" }}>{sacco.code} · contact {sacco.contact}</p>
        <p className="disp" style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 4 }}>{sacco.name}</p>
        <p className="body" style={{ fontSize: 11.5, color: "#AEC3DA", marginTop: 2 }}>Onboarded {sacco.joined} · {sacco.registrationNo || "registered"}</p>
        <div className="rounded-xl p-3 mt-4" style={{ background: "rgba(255,255,255,0.08)" }}>
          <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA" }}>SACCO network PIN</p>
          <p className="mono" style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: 3, marginTop: 2 }}>{sacco.networkPin || "Not issued"}</p>
          <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA", marginTop: 2 }}>Used by the authorised SACCO system to authenticate network traffic.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-5">
        <KpiCard label="Total float" value={kes(sacco.totalFloat)} icon={Landmark} />
        <KpiCard label="Committed" value={kes(sacco.locked)} icon={Lock} tone={c.gold} />
        <KpiCard label="Available" value={kes(available)} icon={Unlock} tone={c.success} />
      </div>

      <div className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>SAKONET Network API access</h3>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>The SACCO receives API access only. It authenticates every network call with its SACCO code and network PIN.</p>
          </div>
          <Pill tone="active">API enabled</Pill>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: c.paper }}>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Endpoint</p>
            <p className="mono" style={{ fontSize: 12, fontWeight: 600, color: c.ink, marginTop: 4 }}>{sacco.apiEndpoint || "/api/v1/sakonet"}</p>
          </div>
          <div className="rounded-xl p-3" style={{ background: c.paper }}>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Authentication</p>
            <p className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: c.ink, marginTop: 4 }}>{sacco.apiAuth || "X-SACCO-CODE + X-SACCO-PIN"}</p>
          </div>
        </div>
        <div className="rounded-xl p-4 mt-3" style={{ background: c.primarySoft, border: `1px solid #C7D6E8` }}>
          <p className="body" style={{ fontSize: 11.5, fontWeight: 700, color: c.primaryDeep }}>Test SACCO API authentication</p>
          <div className="flex gap-2 mt-2">
            <input value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" maxLength={6} type="password" placeholder="Enter network PIN" className="body flex-1 rounded-lg" style={{ padding: "9px 11px", fontSize: 12.5, border: `1px solid ${c.line}`, outline: "none" }} />
            <button onClick={testApiAccess} disabled={pin.length !== 6} className="rounded-lg body" style={{ padding: "9px 14px", fontSize: 12, fontWeight: 700, background: pin.length === 6 ? c.primary : c.line, color: "#fff" }}>Authenticate</button>
          </div>
          {apiResult && <p className="body" style={{ fontSize: 11.5, fontWeight: 600, color: apiResult.ok ? c.success : c.danger, marginTop: 8 }}>{apiResult.message}</p>}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <h3 className="disp" style={{ fontSize: 14.5, fontWeight: 700, color: c.ink, marginBottom: 10 }}>Related requests</h3>
        {saccoRequests.length === 0 && <p className="body" style={{ fontSize: 12, color: c.muted }}>No requests involving this SACCO yet.</p>}
        <div className="flex flex-col gap-2">
          {saccoRequests.map((r) => (
            <div key={r.id} className="rounded-xl p-3 flex items-center justify-between" style={{ background: c.paper }}>
              <span className="body" style={{ fontSize: 12, color: c.ink }}>{r.id} — {kes(r.amount)}</span>
              <StageChip stage={r.stage} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SaccosView({ onOnboard }) {
  const store = useSakonet();
  const { state, getClfForecast } = store;
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 10;
  const saccos = Object.values(state.saccos).filter((s) => s.onboarded === true);

  if (selected) return <SaccoDetail sacco={selected} onBack={() => setSelected(null)} />;

  const q = query.trim().toLowerCase();
  const rows = saccos.filter((s) => !q || `${s.name} ${s.code} ${s.contact}`.toLowerCase().includes(q));
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * PAGE, (cur + 1) * PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search SACCO name, code or contact"
          className="body rounded-lg"
          style={{ padding: "8px 12px", fontSize: 12.5, border: `1px solid ${c.line}`, outline: "none", width: 300, background: c.panel }}
        />
        <div className="flex items-center gap-2">
          <div className="rounded-xl px-3 py-2" style={{ background: c.successSoft, border: `1px solid #BBD8C4` }}>
            <p className="body" style={{ fontSize: 11.5, color: c.success, fontWeight: 700 }}>{saccos.length} SACCOs on network</p>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Network</p>
          </div>
          <button onClick={onOnboard} className="body rounded-xl flex items-center gap-1" style={{ padding: "9px 13px", fontSize: 12, fontWeight: 700, background: c.primaryDeep, color: "#fff" }}>
            <Plus size={14} /> Add new SACCO
          </button>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}`, background: c.panel }}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
                {["SACCO", "Contact", "Total float", "Committed", "Available", "Forecast", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: c.muted, fontSize: 11.5, whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr><td colSpan={8} style={{ padding: "32px 14px", textAlign: "center", color: c.muted }}>No SACCOs match your search.</td></tr>
              )}
              {visible.map((s, i) => {
                const risk = riskOf(getClfForecast(s.code));
                return (
                  <tr key={s.code} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                    <td style={{ padding: "11px 14px", fontWeight: 700, color: c.ink }}>{s.name}</td>
                    <td style={{ padding: "11px 14px", color: c.muted }}>{s.contact}</td>
                    <td style={{ padding: "11px 14px", color: c.ink }} className="mono">{kes(s.totalFloat)}</td>
                    <td style={{ padding: "11px 14px", color: c.gold }} className="mono">{kes(s.locked)}</td>
                    <td style={{ padding: "11px 14px", color: c.success }} className="mono">{kes(s.totalFloat - s.locked)}</td>
                    <td style={{ padding: "11px 14px" }}><Pill tone={RISK_META[risk].tone}>{RISK_META[risk].label}</Pill></td>
                    <td style={{ padding: "11px 14px" }}><Pill tone="active">Active</Pill></td>
                    <td style={{ padding: "11px 14px" }}>
                      <button onClick={() => setSelected(s)} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>Open <ChevronRight size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pager page={cur} pages={pages} total={rows.length} size={PAGE} onPage={setPage} noun="SACCOs" />
      </div>
    </div>
  );
}

/* ================= GUARANTEE REQUESTS ================= */
const REQ_SECURED = ["member_notified_by_mkulima", "sacco_received_confirmation"];
const REQ_DECLINED = ["rejected", "declined", "sacco_rejected", "sacco_confirmed_declined", "sacco_confirmation_received_declined"];
const REQ_PAGE_SIZE = 10;

// Request ids are GR-<base36 time>-<random>, so the submission time can
// be recovered without storing an extra field.
function requestDate(id) {
  const ms = parseInt(String(id).split("-")[1] || "", 36);
  const d = new Date(ms);
  return Number.isFinite(ms) && d.getFullYear() > 2000 ? d : null;
}

function requestGroup(stage) {
  if (REQ_SECURED.includes(stage)) return "secured";
  if (REQ_DECLINED.includes(stage)) return "declined";
  return "progress";
}

function RequestsTable({ saccoCode = null }) {
  const store = useSakonet();
  const { state } = store;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  const all = Object.values(state.requests)
    .filter((r) => !saccoCode || r.borrowerSacco === saccoCode || r.guarantorSacco === saccoCode)
    .map((r) => ({ ...r, _date: requestDate(r.id) }))
    .sort((a, b) => (b._date?.getTime() || 0) - (a._date?.getTime() || 0));

  const counts = {
    all: all.length,
    progress: all.filter((r) => requestGroup(r.stage) === "progress").length,
    secured: all.filter((r) => requestGroup(r.stage) === "secured").length,
    declined: all.filter((r) => requestGroup(r.stage) === "declined").length,
  };

  const q = query.trim().toLowerCase();
  const rows = all.filter((r) => {
    if (filter !== "all" && requestGroup(r.stage) !== filter) return false;
    if (!q) return true;
    return [r.id, r.loanId, r.borrowerName, r.guarantorName, r.borrowerMemberNo, r.guarantorMemberNo,
      state.saccos[r.borrowerSacco]?.name, state.saccos[r.guarantorSacco]?.name]
      .some((v) => String(v || "").toLowerCase().includes(q));
  });

  const pages = Math.max(1, Math.ceil(rows.length / REQ_PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const visible = rows.slice(cur * REQ_PAGE_SIZE, (cur + 1) * REQ_PAGE_SIZE);
  const totalValue = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const filters = [
    ["all", "All"], ["progress", "In progress"], ["secured", "Secured"], ["declined", "Declined"],
  ];
  const th = { textAlign: "left", padding: "10px 14px", fontWeight: 700, color: c.muted, fontSize: 11.5, whiteSpace: "nowrap" };
  const td = { padding: "11px 14px", verticalAlign: "top" };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          {filters.map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setFilter(id); setPage(0); }}
              className="body rounded-full"
              style={{ padding: "6px 13px", fontSize: 12, fontWeight: 700, background: filter === id ? c.primaryDeep : c.panel, color: filter === id ? "#fff" : c.muted, border: `1px solid ${filter === id ? c.primaryDeep : c.line}` }}
            >
              {label} · {counts[id]}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(0); }}
          placeholder="Search ID, member, SACCO or loan"
          className="body rounded-lg"
          style={{ padding: "8px 12px", fontSize: 12.5, border: `1px solid ${c.line}`, outline: "none", width: 280, background: c.panel }}
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}`, background: c.panel }}>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
                {["Submitted", "Request", "Borrower", "Guarantor", "Loan", "Amount", "Status"].map((h) => (
                  <th key={h} style={{ ...th, textAlign: h === "Amount" ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "32px 14px", textAlign: "center", color: c.muted }}>
                    {all.length === 0 ? "No guarantee requests yet. Submit one from the Mkulima Member App." : "No requests match your search or filter."}
                  </td>
                </tr>
              )}
              {visible.map((r, i) => {
                const borrowerSacco = state.saccos[r.borrowerSacco]?.name || r.borrowerSacco;
                const guarantorSacco = state.saccos[r.guarantorSacco]?.name || r.guarantorSacco;
                const loan = state.loans[r.loanId];
                return (
                  <tr key={r.id} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                    <td style={td} className="mono">
                      <span style={{ fontSize: 11.5, color: c.ink }}>{r._date ? r._date.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</span>
                      <br />
                      <span style={{ fontSize: 10.5, color: c.muted }}>{r._date ? r._date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false }) : ""}</span>
                    </td>
                    <td style={td} className="mono"><span style={{ fontSize: 11.5, color: c.ink, fontWeight: 600 }}>{r.id}</span></td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: c.ink }}>{r.borrowerName || "Member"}</span>
                      <br /><span style={{ fontSize: 11, color: c.muted }}>{borrowerSacco} · {r.borrowerMemberNo}</span>
                    </td>
                    <td style={td}>
                      <span style={{ fontWeight: 700, color: c.ink }}>{r.guarantorName || "Member"}</span>
                      <br /><span style={{ fontSize: 11, color: c.muted }}>{guarantorSacco} · {r.guarantorMemberNo}</span>
                    </td>
                    <td style={td}>
                      <span style={{ color: c.ink }}>{loan?.product || r.product || "Loan"}</span>
                      <br /><span className="mono" style={{ fontSize: 10.5, color: c.muted }}>{r.loanId}</span>
                    </td>
                    <td style={{ ...td, textAlign: "right" }} className="mono"><span style={{ fontWeight: 700, color: c.ink }}>{kes(r.amount)}</span></td>
                    <td style={td}>
                      <StageChip stage={r.stage} />
                      {r.declineReason && <p className="body" style={{ fontSize: 10.5, color: c.danger, marginTop: 5, maxWidth: 220 }}>{r.declineReason}</p>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: `1px solid ${c.line}`, background: c.paper }}>
          <span className="body" style={{ fontSize: 11.5, color: c.muted }}>
            {rows.length === 0 ? "0 requests" : `Showing ${cur * REQ_PAGE_SIZE + 1}–${Math.min((cur + 1) * REQ_PAGE_SIZE, rows.length)} of ${rows.length}`} · <span className="mono">{kes(totalValue)}</span> requested
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, cur - 1))}
              disabled={cur === 0}
              className="body rounded-lg"
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: c.panel, color: cur === 0 ? c.line : c.primary, border: `1px solid ${c.line}` }}
            >
              Previous
            </button>
            <span className="body" style={{ fontSize: 11.5, color: c.muted }}>Page {cur + 1} of {pages}</span>
            <button
              onClick={() => setPage(Math.min(pages - 1, cur + 1))}
              disabled={cur >= pages - 1}
              className="body rounded-lg"
              style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, background: c.panel, color: cur >= pages - 1 ? c.line : c.primary, border: `1px solid ${c.line}` }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequestsView() {
  return <RequestsTable />;
}

/* ================= LOANS MANAGEMENT ================= */
function LoansManagementView() {
  const store = useSakonet();
  const { state, simulateDefault, simulateRepaid, settleClaim } = store;
  const [openId, setOpenId] = useState(null);

  // SAKONET only cares about loans that carry at least one external
  // (mode: "sakonet") guarantor — a purely local loan never touches
  // the network and has no business showing up in this console.
  const loans = Object.values(state.loans)
    .filter((loan) => (loan.guarantors || []).some((g) => g.mode === "sakonet"))
    .sort((a, b) => String(b.id).localeCompare(String(a.id)));

  const stageLabel = {
    guarantors: "Guarantee cover",
    committee: "Credit committee",
    approved: "Approved for disbursement",
    disbursed: "Disbursed",
    arrears: "In arrears / claim",
    repaid: "Fully repaid",
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-5" style={{ background: c.primaryDeep, color: "#fff" }}>
        <p className="body" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .7, color: "#AEC3DA" }}>NETWORK MANAGEMENT SYSTEM</p>
        <h1 className="disp" style={{ fontSize: 25, fontWeight: 700, marginTop: 5 }}>Loan lifecycle control</h1>
        <p className="body" style={{ fontSize: 12, color: "#D8E3EF", lineHeight: 1.5, marginTop: 4 }}>
          Network-wide visibility from external loan application, SACCO review and guarantor acceptance through disbursement, repayment, default and guarantee settlement. Repayment and default can also be simulated directly here, the same as from the borrower's own SACCO staff dashboard — committed float is released back to the guarantor SACCO automatically on full repayment, and claimed on default.
        </p>
      </div>

      {loans.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: c.panel, border: `1px solid ${c.line}` }}><p className="body" style={{ fontSize: 13, color: c.muted }}>No loans with cross-SACCO guarantees have entered the network yet.</p></div>}

      {loans.map((loan) => {
        const borrowerSacco = state.saccos[loan.borrowerSacco]?.name || loan.borrowerSacco;
        const externalGuarantors = (loan.guarantors || []).filter((g) => g.mode === "sakonet");
        // The amount SAKONET actually cares about: the total being
        // guaranteed externally, not the loan's full principal (which
        // is the borrower SACCO's own business).
        const externalGuaranteeAmount = externalGuarantors.reduce((sum, g) => sum + Number(g.amount || 0), 0);
        const loanRequests = Object.values(state.requests).filter((r) => r.loanId === loan.id);
        const guarantees = Object.values(state.guarantees).filter((g) => g.loanId === loan.id);
        const claims = Object.values(state.claims).filter((cl) => guarantees.some((g) => g.id === cl.guaranteeId));
        const pendingClaims = claims.filter((cl) => cl.status === "pending");
        const open = openId === loan.id;
        const isDisbursed = loan.stage === "disbursed";
        const canSimulate = isDisbursed && loan.repayment !== "arrears" && loan.repayment !== "repaid";

        return (
          <div key={loan.id} className="rounded-2xl overflow-hidden" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <button onClick={() => setOpenId(open ? null : loan.id)} className="w-full text-left p-5" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{loan.id}</p>
                  <h2 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink, marginTop: 2 }}>{loan.borrowerMemberNo} · {loan.product || "Loan"}</h2>
                  <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>{borrowerSacco} · {kes(externalGuaranteeAmount)} guaranteed · {loan.term || "—"} months</p>
                </div>
                <div className="flex items-center gap-3">
                  <Pill tone={loan.repayment === "arrears" ? "danger" : loan.repayment === "repaid" ? "active" : loan.stage === "disbursed" ? "active" : "pending"}>{stageLabel[loan.stage] || loan.stage}</Pill>
                  <ChevronRight size={16} style={{ transform: open ? "rotate(90deg)" : "none" }} color={c.muted} />
                </div>
              </div>
            </button>

            {open && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-4 gap-3">
                  <KpiCard label="Guaranteed externally" value={kes(externalGuaranteeAmount)} icon={Landmark} />
                  <KpiCard label="Guarantees" value={externalGuarantors.length} icon={ShieldCheck} />
                  <KpiCard label="Requests" value={loanRequests.length} icon={GitBranch} />
                  <KpiCard label="Claims" value={claims.length} icon={AlertTriangle} tone={c.danger} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <section className="rounded-xl p-4" style={{ background: c.paper }}>
                    <h3 className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Guarantee coverage</h3>
                    <div className="flex flex-col gap-2 mt-3">
                      {externalGuarantors.length === 0 && <p className="body" style={{ fontSize: 11.5, color: c.muted }}>No external guarantors recorded.</p>}
                      {externalGuarantors.map((g) => {
                        const req = loanRequests.find((r) => r.guarantorMemberNo === g.memberNo);
                        return <div key={g.memberNo} className="rounded-lg p-3" style={{ background: c.panel }}>
                          <div className="flex justify-between gap-3"><p className="body" style={{ fontSize: 12, fontWeight: 700 }}>{g.name} · {state.saccos[g.sacco]?.name || g.sacco}</p><Pill tone={["rejected","declined"].includes(g.status) ? "danger" : g.status === "secured" || g.status === "accepted" ? "active" : "pending"}>{g.status}</Pill></div>
                          <p className="body" style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>{kes(g.amount)}</p>
                          {req?.declineReason && <p className="body" style={{ fontSize: 11, color: c.danger, marginTop: 5 }}><strong>Decline reason:</strong> {req.declineReason}</p>}
                        </div>;
                      })}
                    </div>
                  </section>

                  <section className="rounded-xl p-4" style={{ background: c.paper }}>
                    <h3 className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Lifecycle status</h3>
                    <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>
                      {isDisbursed
                        ? "Simulate the loan's outcome below. On full repayment, committed float is released back to each guarantor SACCO. On default, guarantees are claimed against the guarantor SACCO's float."
                        : "Repayment and default simulation become available once the loan is disbursed."}
                    </p>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center justify-between rounded-lg p-2.5" style={{ background: c.panel }}>
                        <span className="body" style={{ fontSize: 11.5, color: c.muted }}>Owning SACCO</span>
                        <span className="body" style={{ fontSize: 12, fontWeight: 700, color: c.ink }}>{borrowerSacco}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg p-2.5" style={{ background: c.panel }}>
                        <span className="body" style={{ fontSize: 11.5, color: c.muted }}>Stage</span>
                        <Pill tone={loan.stage === "disbursed" ? "active" : loan.repayment === "arrears" ? "danger" : "pending"}>{stageLabel[loan.stage] || loan.stage}</Pill>
                      </div>
                      {loan.repayment && (
                        <div className="flex items-center justify-between rounded-lg p-2.5" style={{ background: c.panel }}>
                          <span className="body" style={{ fontSize: 11.5, color: c.muted }}>Repayment</span>
                          <span className="body" style={{ fontSize: 12, fontWeight: 700, color: loan.repayment === "arrears" ? c.danger : c.success }}>{loan.repayment}</span>
                        </div>
                      )}

                      {canSimulate && (
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => simulateDefault(loan.id)}
                            className="flex-1 rounded-lg body"
                            style={{ padding: "9px 0", fontSize: 12, fontWeight: 700, background: c.panel, color: c.danger, border: `1px solid ${c.danger}` }}
                          >
                            Simulate default
                          </button>
                          <button
                            onClick={() => simulateRepaid(loan.id)}
                            className="flex-1 rounded-lg body"
                            style={{ padding: "9px 0", fontSize: 12, fontWeight: 700, background: c.panel, color: c.success, border: `1px solid ${c.success}` }}
                          >
                            Simulate full repayment
                          </button>
                        </div>
                      )}

                      {pendingClaims.map((cl) => {
                        const guarantee = guarantees.find((g) => g.id === cl.guaranteeId);
                        const guarantorSaccoName = guarantee ? (state.saccos[guarantee.guarantorSacco]?.name || guarantee.guarantorSacco) : "";
                        return (
                          <div key={cl.id} className="rounded-lg p-2.5" style={{ background: c.dangerSoft }}>
                            <div className="flex items-center justify-between">
                              <span className="body" style={{ fontSize: 11.5, color: c.danger, fontWeight: 700 }}>{cl.id} — pending settlement</span>
                              <span className="body" style={{ fontSize: 11, color: c.danger }}>{kes(cl.amount)}</span>
                            </div>
                            {guarantee && (
                              <button
                                onClick={() => settleClaim(guarantee.id)}
                                className="rounded-lg body mt-2"
                                style={{ padding: "7px 12px", fontSize: 11.5, fontWeight: 700, background: c.danger, color: "#fff" }}
                              >
                                Settle from {guarantorSaccoName}'s float
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ================= GUARANTEES & CLAIMS ================= */
function GuaranteeCard({ guarantee }) {
  const store = useSakonet();
  const { state } = store;
  const saccos = Object.values(state.saccos);

  const statusMap = {
    performing: { tone: "active", label: "Performing" },
    released: { tone: "active", label: "Released" },
    claimed: { tone: "danger", label: "Guarantee called" },
    settled: { tone: "danger", label: "Settled" },
  };
  const s = statusMap[guarantee.status] || statusMap.performing;
  const guarantorSaccoName = saccos.find(s => s.code === guarantee.guarantorSacco)?.name || guarantee.guarantorSacco;
  const borrowerSaccoName = saccos.find(s => s.code === guarantee.borrowerSacco)?.name || guarantee.borrowerSacco;

  let statusMessage = null;
  if (guarantee.status === "released") {
    statusMessage = <p className="body mt-3" style={{ fontSize: 11.5, color: c.success }}>Float released back to {guarantorSaccoName}'s available balance.</p>;
  } else if (guarantee.status === "settled") {
    statusMessage = <p className="body mt-3" style={{ fontSize: 11.5, color: c.danger }}>{kes(guarantee.amount)} transferred from {guarantorSaccoName}'s float to {borrowerSaccoName}.</p>;
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{guarantee.id}</p>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{guarantee.borrowerName || "Member"} — {guarantee.loanId}</p>
        </div>
        <Pill tone={s.tone}>{s.label}</Pill>
      </div>
      <p className="body" style={{ fontSize: 12, color: c.muted }}>
        {guarantee.guarantorName} at {guarantorSaccoName} guarantees {kes(guarantee.amount)}
      </p>
      {guarantee.status === "performing" && (
        <p className="body mt-3" style={{ fontSize: 11.5, color: c.muted }}>
          Performing. Repayment or default is recorded by {borrowerSaccoName}'s own staff dashboard.
        </p>
      )}
      {guarantee.status === "claimed" && (
        <div className="rounded-lg p-2.5 mt-3" style={{ background: c.dangerSoft }}>
          <p className="body" style={{ fontSize: 11.5, color: c.danger, fontWeight: 700 }}>Claim pending settlement</p>
          <p className="body" style={{ fontSize: 11, color: c.danger, marginTop: 2 }}>Settled by {guarantorSaccoName} from its own float — not from this console.</p>
        </div>
      )}
      {statusMessage}
    </div>
  );
}

function GuaranteesView() {
  const store = useSakonet();
  const { state } = store;
  const guarantees = Object.values(state.guarantees);

  if (guarantees.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <ShieldCheck size={20} color={c.muted} style={{ margin: "0 auto 8px" }} />
        <p className="body" style={{ fontSize: 12.5, color: c.muted }}>No active guarantees yet. Submit a request from the Mkulima Member App.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4">
      {guarantees.map((g) => <GuaranteeCard key={g.id} guarantee={g} />)}
    </div>
  );
}

/* ================= BORESHA LOAN PRODUCT ================= */
// Reference view of the Boresha product spec — static content, no
// store dependency, so the operator has the product rules on hand
// while working requests, loans and float elsewhere in the console.
const BORESHA_CLASSES = [
  { name: "Boresha 1", range: "20,000 – 50,000", term: "12–36 mo", guarantors: "1", tenure: "3 months", savings: "7,000" },
  { name: "Boresha 2", range: "50,001 – 150,000", term: "12–48 mo", guarantors: "1–2", tenure: "6 months", savings: "17,000" },
  { name: "Boresha 3", range: "150,001 – 300,000", term: "24–60 mo", guarantors: "1–2", tenure: "12 months", savings: "51,000" },
  { name: "Boresha 4", range: "300,001 – 500,000", term: "36–72 mo", guarantors: "2", tenure: "24 months", savings: "101,000" },
];

const BORROWER_RULES = [
  { label: "Membership tenure", value: "3 / 6 / 12 / 24 months, by class" },
  { label: "Minimum core savings", value: "7,000 / 17,000 / 51,000 / 101,000, by class" },
  { label: "Borrowing ceiling", value: "Up to 3× savings — governs actual access within the class range, not just the class floor" },
  { label: "Guarantor gap", value: "Loan amount minus the borrower's free savings" },
  { label: "Salary rule", value: "Repayment cannot exceed one-third of gross pay for payroll-deduction borrowers" },
  { label: "Documentation", value: "ID/KRA PIN, 3 months' payslips or 6 months' bank statements, clean CRB clearance" },
  { label: "Turnaround", value: "3–7 working days once the guarantor is verified" },
];

const GUARANTOR_RULES = [
  { label: "Standing", value: "Active member, 6+ months, zero contribution arrears" },
  { label: "Clean record", value: "Not in default, not attached to a delinquent borrower" },
  { label: "Capacity", value: "Guarantee exposure capped at the guarantor's own savings balance — no multiplier" },
  { label: "Spread limit", value: "No more than 20 loans guaranteed concurrently" },
  { label: "On acceptance", value: "The guarantor's SACCO locks the guaranteed amount against their capacity, released on repayment" },
];

function RuleList({ title, icon: Icon, rules }) {
  return (
    <section className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={16} color={c.primary} />
        <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>{title}</h3>
      </div>
      <div className="flex flex-col">
        {rules.map((r, i) => (
          <div key={r.label} className="flex items-start gap-4 py-3" style={{ borderTop: i === 0 ? "none" : `1px solid ${c.line}` }}>
            <span className="body" style={{ fontSize: 12, fontWeight: 700, color: c.ink, width: 150, flexShrink: 0 }}>{r.label}</span>
            <span className="body" style={{ fontSize: 12.5, color: c.muted, lineHeight: 1.5 }}>{r.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function LoanProductView() {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-5" style={{ background: c.primaryDeep, color: "#fff" }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="body" style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: .7, color: "#AEC3DA" }}>PRODUCT SPEC</p>
            <h1 className="disp" style={{ fontSize: 25, fontWeight: 700, marginTop: 5 }}>SAKONET Boresha</h1>
            <p className="body" style={{ fontSize: 12, color: "#D8E3EF", lineHeight: 1.5, marginTop: 4, maxWidth: 560 }}>
              A four-class guarantee loan product. One guarantor closes the gap where their capacity allows; a second only joins where it doesn't — so higher classes lean on more cover, never on a bigger multiplier.
            </p>
          </div>
          <div className="rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.09)", flexShrink: 0 }}>
            <Percent size={16} color="#AEC3DA" />
            <div>
              <p className="mono" style={{ fontSize: 17, fontWeight: 700, color: "#fff" }}>12% p.a.</p>
              <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA" }}>Reducing balance · 1%/mo · flat across classes</p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Layers size={16} color={c.primary} />
          <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>The four classes</h3>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {BORESHA_CLASSES.map((cls) => (
            <div key={cls.name} className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
              <div className="flex items-center justify-between mb-3">
                <span className="disp" style={{ fontSize: 14.5, fontWeight: 700, color: c.ink }}>{cls.name}</span>
                <Pill tone={cls.guarantors === "2" ? "danger" : cls.guarantors === "1" ? "active" : "pending"}>
                  {cls.guarantors} guarantor{cls.guarantors === "1" ? "" : "s"}
                </Pill>
              </div>
              <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>{kes(0).slice(0, 0)}{cls.range}</p>
              <p className="body" style={{ fontSize: 10.5, color: c.muted, marginTop: 1 }}>KES loan range</p>
              <div className="flex flex-col gap-1.5 mt-3 pt-3" style={{ borderTop: `1px solid ${c.line}` }}>
                <div className="flex justify-between">
                  <span className="body" style={{ fontSize: 11, color: c.muted }}>Term</span>
                  <span className="body" style={{ fontSize: 11.5, fontWeight: 600, color: c.ink }}>{cls.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body" style={{ fontSize: 11, color: c.muted }}>Tenure needed</span>
                  <span className="body" style={{ fontSize: 11.5, fontWeight: 600, color: c.ink }}>{cls.tenure}</span>
                </div>
                <div className="flex justify-between">
                  <span className="body" style={{ fontSize: 11, color: c.muted }}>Min. savings</span>
                  <span className="mono" style={{ fontSize: 11.5, fontWeight: 600, color: c.ink }}>{cls.savings}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-5">
        <RuleList title="Borrower eligibility" icon={FileCheck2} rules={BORROWER_RULES} />
        <RuleList title="Guarantor eligibility" icon={ShieldCheck} rules={GUARANTOR_RULES} />
      </div>
    </div>
  );
}

/* ================= SACCO NETWORK MANAGEMENT ================= */
function SaccoNetworkAnalysis({ saccoCode }) {
  const store = useSakonet();
  const { state } = store;
  const touching = Object.values(state.requests).filter((r) => r.borrowerSacco === saccoCode || r.guarantorSacco === saccoCode);
  const outgoing = touching.filter((r) => r.borrowerSacco === saccoCode);
  const incoming = touching.filter((r) => r.guarantorSacco === saccoCode);
  const pending = touching.filter((r) => !["member_notified_by_mkulima", "sacco_received_confirmation", "sacco_confirmation_received", "rejected", "sacco_confirmed_declined"].includes(r.stage));
  const accepted = touching.filter((r) => ["sacco_confirmed_accepted", "sacco_confirmation_received", "sacco_received_confirmation", "member_notified_by_mkulima", "accepted", "locked"].includes(r.stage));
  const declined = touching.filter((r) => ["rejected", "sacco_confirmed_declined", "sacco_confirmation_received_declined", "declined", "sacco_rejected"].includes(r.stage));
  const outgoingValue = outgoing.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const incomingValue = incoming.reduce((sum, r) => sum + Number(r.amount || 0), 0);
  const sacco = state.saccos[saccoCode];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard label="Requests touching SACCO" value={touching.length} icon={GitBranch} />
        <KpiCard label="Outgoing guarantee requests" value={outgoing.length} icon={ArrowUpRight} tone={c.primary} />
        <KpiCard label="Incoming guarantee requests" value={incoming.length} icon={ArrowDownLeft} tone={c.gold} />
        <KpiCard label="Active cross-SACCO guarantees" value={Object.values(state.guarantees).filter((g) => g.status === "performing" && (g.borrowerSacco === saccoCode || g.guarantorSacco === saccoCode)).length} icon={ShieldCheck} tone={c.success} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <KpiCard label="Committed float" value={kes(sacco.locked)} icon={Lock} tone={c.gold} />
        <KpiCard label="Uncommitted float" value={kes(sacco.totalFloat - sacco.locked)} icon={Unlock} tone={c.success} />
      </div>

      <section className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>Guarantee request analysis</h2>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>A management view of every SAKONET request that enters or leaves this SACCO.</p>
          </div>
          <TrendingUp size={18} color={c.primary} />
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            ["Pending / in transit", pending.length, c.gold],
            ["Accepted / secured", accepted.length, c.success],
            ["Declined", declined.length, c.danger],
            ["Request value", kes(outgoingValue + incomingValue), c.primary],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-xl p-3" style={{ background: c.paper }}>
              <p className="body" style={{ fontSize: 10.5, color: c.muted }}>{label}</p>
              <p className="mono" style={{ fontSize: 17, fontWeight: 700, color, marginTop: 5 }}>{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>Cross-SACCO borrowers & guarantees</h2>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>Shows members of this SACCO borrowing at their SACCO while guarantees move across the network.</p>
          </div>
          <Users size={18} color={c.primary} />
        </div>
        <div className="flex flex-col gap-2">
          {Object.values(state.loans)
            .filter((loan) => loan.borrowerSacco === saccoCode && (loan.guarantors || []).some((g) => g.mode === "sakonet" && g.sacco !== saccoCode))
            .map((loan) => {
              const borrowerName = state.membersBySacco[saccoCode]?.find((m) => m.memberNo === loan.borrowerMemberNo)?.name || loan.borrowerMemberNo;
              const external = (loan.guarantors || []).filter((g) => g.mode === "sakonet" && g.sacco !== saccoCode);
              return (
                <div key={loan.id} className="rounded-xl p-3 flex items-center justify-between gap-4" style={{ background: c.paper }}>
                  <div>
                    <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink }}>{borrowerName}</p>
                    <p className="body" style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{loan.product} · {loan.id}</p>
                  </div>
                  <div className="text-right">
                    {external.map((g) => <p key={g.memberNo} className="body" style={{ fontSize: 11.5, color: c.primary, fontWeight: 700 }}>{g.name} · {state.saccos[g.sacco]?.name || g.sacco} · {kes(g.amount)}</p>)}
                  </div>
                </div>
              );
            })}
          {Object.values(state.loans).filter((loan) => loan.borrowerSacco === saccoCode && (loan.guarantors || []).some((g) => g.mode === "sakonet" && g.sacco !== saccoCode)).length === 0 && (
            <p className="body" style={{ fontSize: 12, color: c.muted }}>No cross-SACCO borrower records yet.</p>
          )}
        </div>
      </section>
    </>
  );
}

/* ================= SACCO ASSISTANT ================= */
// A read-only helper for SACCO staff. Answers are built from the live
// SAKONET data this SACCO can already see — float, forecast, requests and
// guarantees — with simple keyword routing. It cannot approve, decline
// or move anything.
const LIVE_STATUSES = ["performing", "claimed"];

function assistantReply(question, { state, saccoCode, forecast }) {
  const text = question.toLowerCase().trim();
  const has = (...words) => words.some((w) => text.includes(w));
  const sacco = state.saccos[saccoCode];
  const reqs = Object.values(state.requests).filter((r) => r.borrowerSacco === saccoCode || r.guarantorSacco === saccoCode);
  const nameOf = (code) => state.saccos[code]?.name || code;
  const stageText = (stage) => String(stage).replace(/_/g, " ");

  if (/^(hi|hello|hey|help)\b/.test(text) || has("what can you", "what do you")) {
    return `Hello! I can tell you about ${sacco.name}'s float, whether the forecast says you'll need a top-up, your pending or declined guarantee requests, and the guarantees you give and receive. I only read data — I can't approve or decline anything.`;
  }

  if (has("declin", "reject", "refus")) {
    const declined = reqs.filter((r) => requestGroup(r.stage) === "declined");
    if (declined.length === 0) return "No declined guarantee requests involve your SACCO right now.";
    return `${declined.length} declined request${declined.length > 1 ? "s" : ""}:\n` + declined.slice(0, 4).map((r) => `• ${r.id} — ${kes(r.amount)}, ${r.borrowerName || "member"} → ${r.guarantorName || "member"}. ${r.declineReason ? `Reason: ${r.declineReason}` : "No reason recorded."}`).join("\n");
  }

  if (has("top-up", "top up", "topup", "forecast", "predict", "shortfall", "need more", "danger")) {
    if (!forecast.ready) return "There isn't enough float history yet to forecast reliably.";
    const now = Math.round(forecast.currentRatio * 100);
    const next = Math.round(forecast.predictedRatio * 100);
    const line = forecast.suggestedTopUp > 0
      ? `Yes — a top-up of about ${kes(forecast.suggestedTopUp)} (±${kes(forecast.uncertainty)}) is suggested. ${timingText(forecast)}.`
      : `No top-up is suggested right now. The forecast stays below the ${Math.round(forecast.dangerRatio * 100)}% danger line.`;
    return `${line}\nCommitted float is ${now}% today and is forecast at ${next}%. ${forecast.factors[3] || ""}\nOpen "Predictive analysis" in the sidebar for the chart.`;
  }

  if (has("float", "balance", "available", "committed", "locked", "liquidity")) {
    const pct = sacco.totalFloat > 0 ? Math.round((sacco.locked / sacco.totalFloat) * 100) : 0;
    return `Total float ${kes(sacco.totalFloat)}. Committed ${kes(sacco.locked)} (${pct}%), available ${kes(sacco.totalFloat - sacco.locked)}.`;
  }

  if (has("pending", "transit", "awaiting", "request", "status", "progress")) {
    if (reqs.length === 0) return "No guarantee requests involve your SACCO yet.";
    const progress = reqs.filter((r) => requestGroup(r.stage) === "progress");
    const secured = reqs.filter((r) => requestGroup(r.stage) === "secured").length;
    const declined = reqs.filter((r) => requestGroup(r.stage) === "declined").length;
    let out = `${reqs.length} request${reqs.length > 1 ? "s" : ""} in total: ${progress.length} in progress, ${secured} secured, ${declined} declined.`;
    if (progress.length) out += "\n" + progress.slice(0, 3).map((r) => `• ${r.id} — ${kes(r.amount)}, ${nameOf(r.borrowerSacco)} → ${nameOf(r.guarantorSacco)} (${stageText(r.stage)})`).join("\n");
    return out;
  }

  if (has("guarantee", "guarantor", "exposure", "claim", "default", "arrears")) {
    const all = Object.values(state.guarantees).filter((g) => g.borrowerSacco === saccoCode || g.guarantorSacco === saccoCode);
    const given = all.filter((g) => g.guarantorSacco === saccoCode && LIVE_STATUSES.includes(g.status));
    const received = all.filter((g) => g.borrowerSacco === saccoCode && LIVE_STATUSES.includes(g.status));
    const sum = (list) => list.reduce((t, g) => t + Number(g.amount || 0), 0);
    const claimed = all.filter((g) => g.status === "claimed").length;
    if (all.length === 0) return "There are no guarantees involving your SACCO yet.";
    return `Live guarantees your members give: ${given.length} totalling ${kes(sum(given))}. Live guarantees your borrowers receive: ${received.length} totalling ${kes(sum(received))}.${claimed ? ` ${claimed} guarantee${claimed > 1 ? "s are" : " is"} currently claimed.` : ""}`;
  }

  return "I can help with your float, top-up forecast, guarantee requests (pending or declined) and guarantees. Try one of the suggestions below.";
}

function SaccoAssistant({ saccoCode }) {
  const { state, getClfForecast } = useSakonet();
  const sacco = state.saccos[saccoCode];
  const [messages, setMessages] = useState([
    { from: "bot", text: `Hi, I'm the SAKONET assistant for ${sacco.name}. Ask me about your float, top-up forecast, requests or guarantees.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const suggestions = [
    "What's my float position?",
    "Do I need a top-up?",
    "Any pending requests?",
    "Show declined requests",
    "Summarise my guarantees",
  ];

  const ask = (question) => {
    const q = question.trim();
    if (!q || typing) return;
    setMessages((m) => [...m, { from: "me", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const reply = assistantReply(q, { state, saccoCode, forecast: getClfForecast(saccoCode) });
      setMessages((m) => [...m, { from: "bot", text: reply }]);
      setTyping(false);
    }, 450);
  };

  return (
    <div className="rounded-2xl flex flex-col" style={{ background: c.panel, border: `1px solid ${c.line}`, height: "calc(100vh - 170px)", minHeight: 420 }}>
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${c.line}` }}>
        <span className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: c.primarySoft }}>
          <MessageCircle size={18} color={c.primary} />
        </span>
        <div>
          <p className="disp" style={{ fontSize: 14.5, fontWeight: 700, color: c.ink }}>SAKONET assistant</p>
          <p className="body" style={{ fontSize: 11, color: c.muted }}>Answers come from your live network data · read-only</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {messages.map((m, i) => (
          <div key={i} className="flex" style={{ justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
            <div
              className="body"
              style={{
                maxWidth: "78%", whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.5, padding: "10px 13px", borderRadius: 14,
                background: m.from === "me" ? c.primary : c.paper, color: m.from === "me" ? "#fff" : c.ink,
                borderBottomRightRadius: m.from === "me" ? 4 : 14, borderBottomLeftRadius: m.from === "me" ? 14 : 4,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && <p className="body" style={{ fontSize: 11.5, color: c.muted }}>Assistant is typing…</p>}
        <div ref={endRef} />
      </div>

      <div className="px-5 pt-3 flex flex-wrap gap-2" style={{ borderTop: `1px solid ${c.line}` }}>
        {suggestions.map((sg) => (
          <button key={sg} onClick={() => ask(sg)} className="body rounded-full" style={{ padding: "5px 11px", fontSize: 11.5, fontWeight: 600, background: c.primarySoft, color: c.primary }}>
            {sg}
          </button>
        ))}
      </div>
      <div className="flex gap-2 p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") ask(input); }}
          placeholder="Ask about your float, forecast, requests…"
          className="body flex-1 rounded-xl"
          style={{ padding: "10px 13px", fontSize: 13, border: `1px solid ${c.line}`, outline: "none" }}
        />
        <button onClick={() => ask(input)} disabled={!input.trim() || typing} className="rounded-xl body flex items-center gap-1" style={{ padding: "10px 16px", fontSize: 12.5, fontWeight: 700, background: input.trim() && !typing ? c.primary : c.line, color: "#fff" }}>
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
}

function SaccoSidebar({ sacco, tab, setTab, onBack, onLogout }) {
  const items = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "requests", label: "Guarantee requests", icon: GitBranch },
    { id: "forecast", label: "Predictive analysis", icon: Sparkles },
    { id: "assistant", label: "Assistant", icon: MessageCircle },
    { id: "support", label: "Support", icon: LifeBuoy },
  ];
  return (
    <div className="flex flex-col" style={{ width: 246, background: c.primaryDeep, flexShrink: 0 }}>
      <div className="px-5 pt-6 pb-5">
        <p className="disp" style={{ fontSize: 19, fontWeight: 700, color: "#fff" }}>{sacco.name}</p>
        <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA", fontWeight: 600, letterSpacing: 0.4 }}>SAKONET NETWORK · READ ONLY</p>
      </div>
      <div className="flex flex-col gap-0.5 px-3">
        {items.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="flex items-center gap-3 rounded-lg body"
              style={{ padding: "9px 12px", fontSize: 13, fontWeight: 500, color: active ? "#fff" : "#B7C7D8", background: active ? "rgba(255,255,255,0.09)" : "transparent" }}
            >
              <Icon size={16} /> {it.label}
            </button>
          );
        })}
      </div>
      <div className="mt-auto px-5 pb-6 flex flex-col gap-3">
        <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.07)" }}>
          <p className="body" style={{ fontSize: 10.5, color: "#AEC3DA" }}>Available float</p>
          <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginTop: 2 }}>{kes(sacco.totalFloat - sacco.locked)}</p>
        </div>
        <button onClick={onBack} className="body flex items-center gap-2" style={{ fontSize: 12, color: "#B7C7D8", fontWeight: 600 }}>
          <ArrowLeft size={14} /> Back to SACCO dashboard
        </button>
        <button onClick={onLogout} className="body flex items-center gap-2" style={{ fontSize: 12, color: "#B7C7D8", fontWeight: 600 }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </div>
  );
}

/* ================= SACCO NETWORK LOGIN ================= */
// Login state lives in the shared store (state.sessionAuth), not local
// useState — once a SACCO logs in, it stays logged in across navigation
// and page refresh (store persists to localStorage) until an explicit
// logout via logoutSaccoNetwork.
export function SaccoNetworkLogin({ saccoCode, autoOpen = false }) {
  const store = useSakonet();
  const { state, loginSaccoNetwork } = store;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);
  const sacco = state.saccos[saccoCode];
  const loggedIn = autoOpen || Boolean(state.sessionAuth?.[saccoCode]);

  if (!sacco) return <div className="min-h-screen flex items-center justify-center body">SACCO not found on SAKONET Network.</div>;

  const login = () => {
    if (!sacco.onboarded || sacco.status !== "active") {
      setError("This SACCO is not active on SAKONET yet.");
      return;
    }
    const result = loginSaccoNetwork(sacco.code, pin);
    if (!result.ok) { setError(result.error); return; }
    setError("");
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
        <style>{fonts}</style>
        <div className="rounded-2xl p-7" style={{ width: 430, background: c.panel, border: `1px solid ${c.line}`, boxShadow: "0 18px 50px rgba(0,0,0,.08)" }}>
          <p className="body" style={{ fontSize: 11, color: c.primary, fontWeight: 800, letterSpacing: .6 }}>SAKONET NETWORK ACCESS</p>
          <h1 className="disp" style={{ fontSize: 27, fontWeight: 700, color: c.ink, marginTop: 6 }}>{sacco.name}</h1>
          <p className="body" style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, marginTop: 5 }}>Read-only SACCO network workspace, showing the requests, guarantees, borrowers and float this SACCO can see through SAKONET.</p>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" placeholder="6-digit network PIN" className="body w-full rounded-xl mt-5" style={{ padding: "12px", fontSize: 13, border: `1px solid ${c.line}` }} />
          {error && <p className="body" style={{ color: c.danger, fontSize: 12, marginTop: 8 }}>{error}</p>}
          <p className="body" style={{ color: c.muted, fontSize: 11, marginTop: 8 }}>Network PIN: <strong>{sacco.networkPin}</strong></p>
          <button onClick={login} className="w-full rounded-xl body mt-4" style={{ padding: "12px 0", background: c.primary, color: "#fff", fontWeight: 700 }}>Open network workspace</button>
        </div>
      </div>
    );
  }

  const staffDashboardPath = saccoCode === "BTY" ? "/beauty/staff" : "/mkulima/staff";
  const goToDashboard = () => {
    window.history.pushState({}, "", staffDashboardPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  const titles = {
    overview: "Network overview",
    requests: "Guarantee requests",
    forecast: "Predictive analysis",
    assistant: "Assistant",
    support: "Support",
  };
  const forecast = store.getClfForecast(saccoCode);
  const needsTopUp = forecast.ready && forecast.suggestedTopUp > 0;

  return (
    <div className="min-h-screen w-full flex" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
      <style>{fonts}</style>
      <SaccoSidebar sacco={sacco} tab={tab} setTab={setTab} onBack={goToDashboard} onLogout={() => store.logoutSaccoNetwork(saccoCode)} />

      {/* Beauty-only floating chatbot */}
      {saccoCode === "BTY" && (
        chatOpen ? (
          <SakonetChatbot sacco={sacco.name} onClose={() => setChatOpen(false)} />
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed flex items-center gap-2 rounded-full shadow-lg body"
            style={{
              bottom: 20,
              right: 20,
              zIndex: 40,
              padding: "12px 18px",
              background: c.primaryDeep,
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <MessageCircle size={17} /> Ask SAKONET
          </button>
        )
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${c.line}` }}>
          <div>
            <p className="body" style={{ fontSize: 10.5, color: c.primary, fontWeight: 800, letterSpacing: .7 }}>SAKONET NETWORK · READ ONLY</p>
            <h2 className="disp" style={{ fontSize: 21, fontWeight: 700, color: c.ink }}>{titles[tab]}</h2>
          </div>
          <div className="rounded-xl px-4 py-2.5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Available float</p>
            <p className="mono" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>{kes(sacco.totalFloat - sacco.locked)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tab === "overview" && (
            <>
              <button
                onClick={() => setTab("forecast")}
                className="w-full rounded-2xl p-4 mb-5 flex items-center justify-between gap-4 text-left"
                style={{ background: c.panel, border: `1px solid ${c.line}` }}
              >
                <span className="flex items-center gap-3">
                  <span className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: c.primarySoft }}>
                    <Sparkles size={17} color={c.primary} />
                  </span>
                  <span>
                    <span className="disp block" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Predictive analysis</span>
                    <span className="body block" style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: needsTopUp ? c.danger : c.success }}>
                      {!forecast.ready ? "Building float history" : needsTopUp ? `Top-up of about ${kes(forecast.suggestedTopUp)} suggested · ${timingText(forecast)}` : "No top-up needed right now"}
                    </span>
                  </span>
                </span>
                <span className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>Open <ChevronRight size={13} /></span>
              </button>
              <SaccoNetworkAnalysis saccoCode={saccoCode} />
            </>
          )}

          {tab === "requests" && <RequestsTable saccoCode={saccoCode} />}

          {tab === "forecast" && (
            <div className="grid grid-cols-2 gap-5 items-start">
              <ForecastChart saccoCode={saccoCode} />
              <ForecastCard saccoCode={saccoCode} full />
            </div>
          )}

          {tab === "assistant" && <SaccoAssistant saccoCode={saccoCode} />}
          {tab === "support" && <SaccoSupport saccoCode={saccoCode} />}
        </div>
      </div>
    </div>
  );
}

/* ================= SAKONET OPERATOR CONSOLE ================= */
export default function SakonetOperatorConsole() {
  const [nav, setNav] = useState("dashboard");
  const [showOnboard, setShowOnboard] = useState(false);

  const getTitle = () => {
    const titles = {
      dashboard: "Network dashboard",
      saccos: "SACCOs & float",
      requests: "Guarantee requests",
      loans: "Loans management",
      guarantees: "Guarantees & claims",
      predictive: "Predictive analysis",
      support: "Customer service",
      "loan-product": "Boresha loan product",
    };
    return titles[nav] || "SAKONET Network";
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
      <style>{fonts}</style>
      <Sidebar nav={nav} setNav={setNav} />

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${c.line}` }}>
          <h2 className="disp" style={{ fontSize: 21, fontWeight: 700, color: c.ink }}>
            {getTitle()}
          </h2>
          <button className="p-2 rounded-full" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <Bell size={16} color={c.ink} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {nav === "dashboard" && <DashboardView setNav={setNav} />}
          {nav === "saccos" && <SaccosView onOnboard={() => setShowOnboard(true)} />}
          {nav === "requests" && <RequestsView />}
          {nav === "loans" && <LoansManagementView />}
          {nav === "guarantees" && <GuaranteesView />}
          {nav === "predictive" && <PredictiveView />}
          {nav === "support" && <OperatorSupport />}
          {nav === "loan-product" && <LoanProductView />}
        </div>
      </div>

      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onOpenNetwork={(code) => {
            setShowOnboard(false);
            window.history.pushState({}, "", `/sacco/network/${code}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        />
      )}
    </div>
  );
}