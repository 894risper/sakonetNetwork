import { useState, useEffect } from "react";
import { useSakonet } from "./store";
import {
  Home, Wallet, Users, Bell, ChevronRight, ChevronLeft, X, Check,
  Clock, ShieldCheck, TrendingUp, Send, FileText, Smartphone,
  CheckCircle2, Circle, Plus,
  Globe2, Loader2,
} from "lucide-react";

/* -----------------------------------------------------------------
   MKULIMA SACCO — member app, for David Kamau (member MK-07741).
   Now connected to the shared store via useSakonet().
----------------------------------------------------------------- */

const c = {
  green: "#0E4432",
  greenLight: "#1B6B4C",
  gold: "#C9A227",
  bg: "#F6F4EF",
  card: "#FFFFFF",
  sage: "#EEF1EA",
  text: "#16201B",
  muted: "#6B7368",
  border: "#E3E0D6",
  danger: "#B8452F",
  success: "#2E7D4F",
  sakonet: "#2F5D8A",
  sakonetBg: "#E9EFF6",
  sakonetBorder: "#C7D6E8",
};

const fontStack = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  .sora { font-family: 'Sora', sans-serif; }
  .inter { font-family: 'Inter', sans-serif; }

  /* Phone display: edge-to-edge on an actual phone-sized screen,
     the familiar bezel mockup once there's room for it. */
  .phone-shell {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }
  @media (min-width: 640px) {
    .phone-shell {
      width: 390px;
      height: 800px;
      border-radius: 40px;
      border: 10px solid #16201B;
      box-shadow: 0 30px 60px rgba(14,68,50,0.25);
    }
  }
`;

const fmt = (n) => "KES " + n.toLocaleString("en-KE");

function sakonetButtonLabel(status) {
  if (status === "pending_review") {
    return (<><Loader2 size={14} className="animate-spin" /> Awaiting Mkulima SACCO review…</>);
  }
  if (status === "verifying") {
    return (<><Loader2 size={14} className="animate-spin" /> Verifying with Sakonet…</>);
  }
  if (status === "verified") {
    return (<><Check size={14} /> Verified</>);
  }
  if (status === "returned") {
    return (<><X size={14} /> Returned by SACCO — edit and resend</>);
  }
  if (status === "failed") {
    return (<><X size={14} /> Failed</>);
  }
  return (<span>Submit</span>);
}

// Maps a persisted request's stage in the store to this screen's status.
function stageToExtStatus(stage) {
  if (stage === "submitted") return "pending_review";
  if (stage === "returned") return "returned";
  if (stage === "verifying" || stage === "verified") return "verifying";
  if (stage === "notified" || stage === "accepted" || stage === "locked") return "verified";
  if (stage === "rejected") return "failed";
  return "idle";
}

function guarantorStatusLabel(status) {
  if (status === "submitted") return "Awaiting Mkulima SACCO review";
  if (status === "verifying") return "Verifying";
  if (status === "delivered") return "Awaiting their response";
  if (status === "returned") return "Returned — needs resend";
  if (status === "rejected") return "Declined";
  return status;
}

// ---------- Data ----------
const member = {
  name: "David Kamau",
  memberNo: "MK-07741",
  savings: 50000,
  shares: 62000,
  eligibility: 3,
};

const loanProducts = [
  { id: "emergency", name: "Emergency Loan", rate: "1.0%/mo", max: 3, desc: "Fast cash for urgent needs, released within 24 hours.", term: "Up to 12 months" },
  { id: "school", name: "School Fees Loan", rate: "1.0%/mo", max: 3, desc: "Covers tuition, paid directly to the institution.", term: "Up to 24 months" },
  { id: "development", name: "Development Loan", rate: "1.0%/mo", max: 3, desc: "For land, construction, or business capital.", term: "Up to 48 months" },
  { id: "salary", name: "Salary Advance", rate: "1.0%/mo", max: 1, desc: "Short bridge against next month's salary.", term: "Up to 3 months" },
  {
    id: "boresha",
    name: "External Guaranteed Loan (Sakonet Boresha)",
    rate: "1.0%/mo",
    max: 3,
    desc: "Guaranteed through SAKONET by one or more members from any SACCO on the platform — including your own.",
    term: "Up to 36 months",
    sakonetOnly: true, // guarantors are picked straight from the SAKONET network, no "This SACCO / Another SACCO" toggle
  },
];

const members = [
  { name: "Otieno Kamau", memberNo: "MK-01123", shares: 91000 },
  { name: "Achieng Wafula", memberNo: "MK-02871", shares: 54000 },
  { name: "Kiplagat Ruto", memberNo: "MK-03390", shares: 120000 },
  { name: "Nyambura Kariuki", memberNo: "MK-04552", shares: 38000 },
  { name: "Mary Akinyi", memberNo: "MK-05521", shares: 44000 },
  { name: "Peter Mwenda", memberNo: "MK-06210", shares: 26000 },
  { name: "Faith Chebet", memberNo: "MK-08834", shares: 140000 },
  { name: "Grace Wambui", memberNo: "MK-01987", shares: 30000 },
];

const guaranteeRequestsInitial = [
  { id: 1, name: "Peter Mwenda", memberNo: "MK-06210", amount: 90000, product: "Emergency Loan", requested: "2 days ago", source: "local" },
  { id: 2, name: "Grace Wambui", memberNo: "MK-01987", amount: 60000, product: "School Fees Loan", requested: "5 hours ago", source: "local" },
];

const guaranteeing = [
  { id: "g1", name: "Kiplagat Ruto", amount: 90000, exposure: 90000, product: "Emergency Loan", cleared: "62%", source: "local" },
];

const notifIcon = (type) => {
  const map = {
    guarantor: <Users size={16} color={c.gold} />,
    sakonet: <Globe2 size={16} color={c.sakonet} />,
    sacco: <Globe2 size={16} color={c.sakonet} />,
    loan: <Wallet size={16} color={c.greenLight} />,
    repayment: <Clock size={16} color={c.danger} />,
    security: <ShieldCheck size={16} color={c.text} />,
    dividend: <TrendingUp size={16} color={c.success} />,
  };
  return map[type] || <Bell size={16} />;
};

// ---------- Small building blocks ----------
function TopBar({ title, onBack }) {
  return (
    <div className="flex items-center gap-2 px-5 pt-5 pb-3" style={{ background: c.bg }}>
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1 rounded-full" style={{ color: c.text }}>
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text }}>{title}</h1>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: c.sage, fg: c.text },
    pending: { bg: "#FBF0DA", fg: "#8A6512" },
    active: { bg: "#E4F0E8", fg: c.success },
    danger: { bg: "#F6E4E0", fg: c.danger },
  };
  const t = tones[tone];
  return (
    <span className="inter" style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
      {children}
    </span>
  );
}

function SakonetBadge({ label = "Sakonet" }) {
  return (
    <span
      className="inter flex items-center gap-1"
      style={{ background: c.sakonetBg, color: c.sakonet, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: `1px solid ${c.sakonetBorder}` }}
    >
      <Globe2 size={10.5} /> {label}
    </span>
  );
}

function StatusTag({ status }) {
  if (status === "accepted") return <span className="inter flex items-center gap-1" style={{ color: c.success, fontSize: 11.5, fontWeight: 600 }}><Check size={12} /> Secured</span>;
  if (status === "verifying") return <span className="inter flex items-center gap-1" style={{ color: c.sakonet, fontSize: 11.5, fontWeight: 600 }}><Loader2 size={12} className="animate-spin" /> Awaiting guarantor SACCO verification</span>;
  if (status === "delivered") return <span className="inter flex items-center gap-1" style={{ color: c.sakonet, fontSize: 11.5, fontWeight: 600 }}><Loader2 size={12} className="animate-spin" /> Awaiting response</span>;
  return <span className="inter" style={{ color: c.muted, fontSize: 11.5, fontWeight: 600 }}>Pending</span>;
}

function NavBar({ tab, setTab, unreadCount }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "guarantor", label: "Guarantor", icon: Users },
    { id: "notifications", label: "Alerts", icon: Bell },
  ];
  return (
    <div className="flex justify-around items-center px-2 pt-2" style={{ borderTop: `1px solid ${c.border}`, background: c.card, paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className="flex flex-col items-center gap-1 relative"
            style={{ padding: "4px 10px", color: active ? c.green : c.muted }}
          >
            <div className="relative">
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              {it.id === "notifications" && unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -6, width: 8, height: 8, borderRadius: 8, background: c.danger, border: `1.5px solid ${c.card}` }} />
              )}
            </div>
            <span className="inter" style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- HOME ----------
function HomeScreen({ goLoans, goGuarantor, goNotifications, onContinueLoan }) {
  const store = useSakonet();
  const myLoans = Object.values(store.state.loans).filter((l) => l.borrowerMemberNo === member.memberNo);
  return (
    <div className="px-5 pt-6 pb-6 overflow-y-auto" style={{ background: c.bg, flex: 1 }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="inter" style={{ fontSize: 13, color: c.muted }}>Good afternoon,</p>
          <p className="sora" style={{ fontSize: 18, fontWeight: 700, color: c.text }}>{member.name.split(" ")[0]}</p>
        </div>
        <button onClick={goNotifications} className="p-2 rounded-full" style={{ background: c.card, border: `1px solid ${c.border}` }}>
          <Bell size={18} color={c.text} />
        </button>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: c.green }}>
        <p className="inter" style={{ fontSize: 12, color: "#BFE0CE", marginBottom: 4 }}>Total savings & shares</p>
        <p className="sora" style={{ fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
          {fmt(member.savings + member.shares)}
        </p>
        <div className="flex gap-5 mt-4">
          <div>
            <p className="inter" style={{ fontSize: 11, color: "#BFE0CE" }}>Savings</p>
            <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{fmt(member.savings)}</p>
          </div>
          <div>
            <p className="inter" style={{ fontSize: 11, color: "#BFE0CE" }}>Shares</p>
            <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{fmt(member.shares)}</p>
          </div>
          <div>
            <p className="inter" style={{ fontSize: 11, color: "#BFE0CE" }}>Member No.</p>
            <p className="sora" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{member.memberNo}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { id: "apply", icon: Wallet, label: "Apply loan", action: goLoans },
          { id: "guarantor", icon: Users, label: "Guarantor", action: goGuarantor },
          { id: "transfer", icon: Send, label: "Transfer", action: () => {} },
          { id: "statement", icon: FileText, label: "Statement", action: () => {} },
        ].map((it) => (
          <button key={it.id} onClick={it.action} className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center rounded-2xl" style={{ width: 52, height: 52, background: c.card, border: `1px solid ${c.border}` }}>
              <it.icon size={19} color={c.green} />
            </div>
            <span className="inter" style={{ fontSize: 10.5, color: c.text, fontWeight: 500, textAlign: "center" }}>{it.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Your loans</h2>
        <button onClick={goLoans} className="inter flex items-center gap-0.5" style={{ fontSize: 12, color: c.greenLight, fontWeight: 600 }}>
          View all <ChevronRight size={13} />
        </button>
      </div>
      {myLoans.length === 0 && (
        <div className="rounded-2xl p-4 mb-3 text-center" style={{ background: c.sage, border: `1px solid ${c.border}` }}>
          <p className="inter" style={{ fontSize: 12, color: c.muted }}>You have no loans yet. Tap "Apply loan" to get started.</p>
        </div>
      )}
      {myLoans.slice(0, 1).map((loan) => {
        const guarantorCover = loan.guarantors?.filter((g) => (g.status === "accepted" || g.status === "secured")).reduce((s, g) => s + g.amount, 0) || 0;
        const savingsCover = Math.min(member.savings, loan.amount);
        const covered = Math.min(loan.amount, savingsCover + guarantorCover);
        const coverPct = Math.round((covered / loan.amount) * 100);
        const incomplete = loan.stage === "guarantors" && coverPct < 100;
        const status = loanStatusInfo(loan, coverPct);
        const progress = loanProgressInfo(loan, coverPct);
        return (
          <div key={loan.id} className="rounded-2xl p-4 mb-3" style={{ background: c.card, border: `1px solid ${c.border}` }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text }}>{loan.product}</p>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>{fmt(loan.amount)} requested</p>
              </div>
              <Pill tone={status.tone}>{status.label}</Pill>
            </div>
            {progress.showBar && (
              <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.sage }}>
                <div style={{ width: `${coverPct}%`, height: "100%", background: coverPct >= 100 ? c.success : c.gold }} />
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <p className="inter" style={{ fontSize: 11, color: c.muted }}>{progress.text}</p>
              {incomplete && (
                <button onClick={() => onContinueLoan?.(loan)} className="inter" style={{ fontSize: 11, color: c.green, fontWeight: 700 }}>
                  Continue →
                </button>
              )}
            </div>
          </div>
        );
      })}

    </div>
  );
}

// ---------- LOANS ----------
function LoansHome({ onApply, onOpenLoan, onContinueLoan }) {
  const store = useSakonet();
  const maxEligible = member.savings * member.eligibility;
  const myLoans = Object.values(store.state.loans).filter((l) => l.borrowerMemberNo === member.memberNo);

  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.bg, flex: 1 }}>
      <div className="rounded-2xl p-4 mb-4" style={{ background: c.sage, border: `1px solid ${c.border}` }}>
        <p className="inter" style={{ fontSize: 12, color: c.muted }}>You're eligible to borrow up to</p>
        <p className="sora" style={{ fontSize: 22, fontWeight: 700, color: c.green }}>{fmt(maxEligible)}</p>
        <p className="inter" style={{ fontSize: 11, color: c.muted }}>Based on 3x your savings, less any guarantee exposure</p>
      </div>

      <button
        onClick={onApply}
        className="w-full flex items-center justify-center gap-2 rounded-2xl mb-6"
        style={{ background: c.green, color: "#fff", padding: "13px 0" }}
      >
        <Plus size={17} />
        <span className="inter" style={{ fontWeight: 600, fontSize: 14 }}>Apply for a loan</span>
      </button>

      <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 10 }}>Your loans</h2>
      {myLoans.length === 0 && (
        <p className="inter" style={{ fontSize: 12.5, color: c.muted }}>You haven't applied for a loan yet.</p>
      )}
      <div className="flex flex-col gap-3">
        {myLoans.map((loan) => {
          const guarantorCover = loan.guarantors?.filter((g) => (g.status === "accepted" || g.status === "secured")).reduce((s, g) => s + g.amount, 0) || 0;
          const savingsCover = Math.min(member.savings, loan.amount);
          const covered = Math.min(loan.amount, savingsCover + guarantorCover);
          const coverPct = Math.round((covered / loan.amount) * 100);
          const incomplete = loan.stage === "guarantors" && coverPct < 100;
          const status = loanStatusInfo(loan, coverPct);
          const progress = loanProgressInfo(loan, coverPct);
          return (
            <div key={loan.id} className="rounded-2xl p-4 text-left" style={{ background: c.card, border: `1px solid ${c.border}` }}>
              <button onClick={() => onOpenLoan(loan)} className="w-full text-left">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text }}>{loan.product}</p>
                    <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>{loan.id} · {fmt(loan.amount)}</p>
                  </div>
                  <Pill tone={status.tone}>{status.label}</Pill>
                </div>
                {progress.showBar && (
                  <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.sage }}>
                    <div style={{ width: `${coverPct}%`, height: "100%", background: coverPct >= 100 ? c.success : c.gold }} />
                  </div>
                )}
                <p className="inter mt-2" style={{ fontSize: 11.5, color: c.muted }}>{progress.text}</p>
              </button>
              {incomplete && (
                <button
                  onClick={() => onContinueLoan?.(loan)}
                  className="w-full rounded-xl inter mt-3"
                  style={{ padding: "9px 0", fontSize: 12.5, fontWeight: 700, color: c.green, background: c.sage, border: `1px solid ${c.border}` }}
                >
                  Continue application
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function loanStageIndex(stage) {
  const map = { guarantors: 1, committee: 2, approved: 2, disbursed: 3, rejected: 1 };
  return map[stage] || 1;
}

// Single source of truth for the loan status pill so every screen (home,
// loans list, detail) agrees on what to show. The borrower only ever sees
// three states — Review, Secured, Disbursed — even though the backend
// tracks "committee" and "approved" as two separate internal stages once
// Beauty SACCO confirms the guarantee and it's with Mkulima SACCO.
function loanStatusInfo(loan, coverPct) {
  if (loan.stage === "rejected") return { tone: "danger", label: "Declined" };
  if (loan.stage === "disbursed") {
    if (loan.repayment === "arrears") return { tone: "danger", label: "In arrears" };
    if (loan.repayment === "repaid") return { tone: "neutral", label: "Repaid" };
    return { tone: "active", label: "Active" };
  }
  if (loan.stage === "approved" || loan.stage === "committee") return { tone: "active", label: "Secured" };
  if (loan.stage === "guarantors" && coverPct >= 100) return { tone: "pending", label: "Guarantors secured" };
  return { tone: "pending", label: "Under review" };
}

// Subtext + progress bar for a loan list card. Only the "guarantors" stage
// is actually about guarantor cover — once a loan has moved on to
// "Secured" (committee/approved) it's just waiting on Mkulima SACCO to
// disburse, so the guarantor-cover line is stale info and gets replaced.
function loanProgressInfo(loan, coverPct) {
  if (loan.stage === "disbursed") {
    const text = loan.repayment === "repaid" ? "Fully repaid" : loan.repayment === "arrears" ? "In arrears" : "Disbursed · repayment in progress";
    return { showBar: false, text };
  }
  if (loan.stage === "approved" || loan.stage === "committee") {
    return { showBar: false, text: "Secured — with Mkulima SACCO for disbursement" };
  }
  if (loan.stage === "rejected") {
    return { showBar: false, text: "A guarantor declined — add a new guarantor to continue" };
  }
  return { showBar: true, text: `${coverPct}% guarantor cover secured` };
}

function LoanDetail({ loan, onBack, onContinueLoan }) {
  const store = useSakonet();
  const { state } = store;
  
  // Get live loan data from store
  const liveLoan = state.loans[loan.id] || loan;
  const stages = ["Review", "Secured", "Disbursed"];
  const isDisbursed = liveLoan.stage === "disbursed";
  const currentStage = loanStageIndex(liveLoan.stage);
  const guarantors = liveLoan.guarantors || [];
  const guarantorCover = guarantors.filter((g) => (g.status === "accepted" || g.status === "secured")).reduce((s, g) => s + g.amount, 0);
  const savingsCover = Math.min(member.savings, liveLoan.amount);
  const covered = Math.min(liveLoan.amount, savingsCover + guarantorCover);
  const coverPct = Math.round((covered / liveLoan.amount) * 100);
  const incomplete = liveLoan.stage === "guarantors" && coverPct < 100;
  
  return (
    <div className="flex-1 flex flex-col" style={{ background: c.bg }}>
      <TopBar title={liveLoan.product} onBack={onBack} />
      <div className="px-5 overflow-y-auto flex-1 pb-4">
        <div className="rounded-2xl p-5 mb-5" style={{ background: c.green }}>
          <p className="inter" style={{ fontSize: 12, color: "#BFE0CE" }}>{isDisbursed ? "Outstanding balance" : "Amount requested"}</p>
          <p className="sora" style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{fmt(liveLoan.amount)}</p>
          <p className="inter" style={{ fontSize: 12, color: "#BFE0CE", marginTop: 6 }}>{liveLoan.id}{liveLoan.term ? ` · ${liveLoan.term} months` : ""}</p>
        </div>

        {incomplete && (
          <button
            onClick={() => onContinueLoan?.(liveLoan)}
            className="w-full rounded-2xl inter mb-5"
            style={{ padding: "12px 0", fontSize: 13.5, fontWeight: 700, color: "#fff", background: c.green }}
          >
            Continue application
          </button>
        )}

        <h3 className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text, marginBottom: 12 }}>Status</h3>
        <div className="mb-6">
          {stages.map((s, i) => {
            const done = i < currentStage;
            const isNow = i === currentStage - 1 && !isDisbursed;
            return (
              <div key={s} className="flex gap-3">
                <div className="flex flex-col items-center">
                  {done ? <CheckCircle2 size={18} color={c.success} /> : <Circle size={18} color={c.border} />}
                  {i < stages.length - 1 && <div style={{ width: 2, height: 26, background: done ? c.success : c.border }} />}
                </div>
                <div style={{ paddingBottom: 18 }}>
                  <p className="inter" style={{ fontSize: 13, fontWeight: isNow ? 700 : 500, color: done ? c.text : c.muted }}>{s}</p>
                  {isNow && <p className="inter" style={{ fontSize: 11, color: c.gold }}>In progress</p>}
                </div>
              </div>
            );
          })}
        </div>

        {(guarantors.length > 0 || savingsCover > 0) && (
          <>
            <h3 className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text, marginBottom: 10 }}>Your guarantors</h3>
            <div className="flex flex-col gap-2 mb-6">
              {savingsCover > 0 && (
                <div className="rounded-xl p-3" style={{ background: c.sage, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="inter" style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Your savings</p>
                    <StatusTag status="accepted" />
                  </div>
                  <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Covering {fmt(savingsCover)}</p>
                </div>
              )}
              {guarantors.map((g) => (
                <div key={g.name} className="rounded-xl p-3" style={{ background: g.type === "sakonet" || g.mode === "sakonet" ? c.sakonetBg : c.card, border: `1px solid ${g.type === "sakonet" || g.mode === "sakonet" ? c.sakonetBorder : c.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <p className="inter" style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{g.name}</p>
                      {(g.type === "sakonet" || g.mode === "sakonet") && <SakonetBadge label={g.sacco || "External"} />}
                    </div>
                    <StatusTag status={g.status === "delivered" ? "verifying" : g.status === "secured" ? "accepted" : g.status} />
                  </div>
                  <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Guaranteeing {fmt(g.amount)}</p>
                </div>
              ))}
            </div>
            {guarantors.some((g) => g.type === "sakonet" || g.mode === "sakonet") && (
              <p className="inter mb-6" style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5 }}>
                Mkulima SACCO doesn't contact external guarantors directly — SAKONET Network routes the request to the guarantor's SACCO, which verifies and notifies the member. After the member accepts, their SACCO sends the confirmation back through SAKONET Network, and Mkulima SACCO records the guarantee as secured.
              </p>
            )}
          </>
        )}

        {isDisbursed && liveLoan.repayment !== "repaid" && (
          <>
            <h3 className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text, marginBottom: 10 }}>Next repayment</h3>
            <div className="rounded-2xl p-4 flex items-center justify-between mb-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
              <div>
                <p className="sora" style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{fmt(liveLoan.nextAmount || 25000)}</p>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Due {liveLoan.nextDue || "1st of each month"}</p>
              </div>
              <button className="rounded-xl inter" style={{ background: c.green, color: "#fff", fontSize: 12.5, fontWeight: 600, padding: "9px 16px" }}>
                Pay now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- APPLY LOAN FLOW ----------
function StepProduct({ product, setProduct }) {
  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>Choose a loan product</h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>Pick the product that fits what you need the funds for.</p>
      <div className="flex flex-col gap-3">
        {loanProducts.map((p) => (
          <button
            key={p.id}
            onClick={() => setProduct(p)}
            className="rounded-2xl p-4 text-left"
            style={{ background: c.card, border: `1.5px solid ${product?.id === p.id ? c.green : c.border}` }}
          >
            <div className="flex justify-between items-center mb-1">
              <p className="sora" style={{ fontSize: 14.5, fontWeight: 700, color: c.text }}>{p.name}</p>
              <p className="inter" style={{ fontSize: 11.5, color: c.greenLight, fontWeight: 600 }}>{p.rate}</p>
            </div>
            <p className="inter" style={{ fontSize: 12, color: c.muted, marginBottom: 6 }}>{p.desc}</p>
            <p className="inter" style={{ fontSize: 11, color: c.muted }}>{p.term} · up to {p.max}x your savings</p>
          </button>
        ))}
      </div>
    </>
  );
}

function StepAmount({ amount, setAmount, months, setMonths, product, monthlyInterest, monthlyPayment }) {
  const cap = member.savings * (product?.max || 3);
  const min = 10000;
  const [draft, setDraft] = useState(amount ? String(amount) : "");

  useEffect(() => {
    setDraft(amount ? String(amount) : "");
  }, [amount]);

  const numericAmount = Number(draft.replace(/\D/g, "") || 0);
  const overEligible = numericAmount > cap;
  const belowMinimum = numericAmount > 0 && numericAmount < min;

  const commit = () => {
    const digits = draft.replace(/\D/g, "");
    const val = digits === "" ? 0 : Number(digits);
    setAmount(val);
  };

  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>How much do you need?</h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 20 }}>Eligible up to {fmt(cap)} for {product?.name}.</p>

      <div className="flex items-center justify-center rounded-2xl mb-2" style={{ border: `1.5px solid ${overEligible || belowMinimum ? c.danger : c.border}`, padding: "12px 16px", background: c.card }}>
        <span className="sora" style={{ fontSize: 22, fontWeight: 700, color: c.muted, marginRight: 8 }}>KES</span>
        <input
          type="text"
          inputMode="numeric"
          value={draft === "" ? "" : Number(draft.replace(/\D/g, "") || 0).toLocaleString("en-KE")}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "");
            setDraft(next);
            setAmount(next === "" ? 0 : Number(next));
          }}
          onBlur={commit}
          placeholder="0"
          className="sora"
          style={{ fontSize: 28, fontWeight: 700, color: overEligible || belowMinimum ? c.danger : c.green, border: "none", outline: "none", background: "transparent", width: "100%", textAlign: "center" }}
        />
      </div>

      {overEligible && (
        <div className="rounded-xl p-3 mb-3" style={{ background: "#F6E4E0", border: `1px solid #E9BDB4` }}>
          <p className="inter" style={{ fontSize: 12, color: c.danger, fontWeight: 700 }}>Amount exceeds your eligible limit.</p>
          <p className="inter" style={{ fontSize: 11.5, color: c.danger, marginTop: 2 }}>You can apply for a maximum of {fmt(cap)} for this loan product.</p>
        </div>
      )}
      {belowMinimum && !overEligible && (
        <p className="inter" style={{ fontSize: 11.5, color: c.danger, textAlign: "center", marginBottom: 8 }}>Minimum loan amount is {fmt(min)}.</p>
      )}

      <p className="inter" style={{ fontSize: 11, color: c.muted, textAlign: "center", marginBottom: 20 }}>
        Min {fmt(min)} · Max {fmt(cap)}
      </p>

      <p className="inter" style={{ fontSize: 12.5, fontWeight: 600, color: c.text, marginBottom: 8 }}>Repayment period</p>
      <div className="flex gap-2 mb-6">
        {[6, 12, 24, 36].map((m) => (
          <button key={m} onClick={() => setMonths(m)} className="flex-1 rounded-xl inter" style={{ padding: "9px 0", fontSize: 12.5, fontWeight: 600, background: months === m ? c.green : c.card, color: months === m ? "#fff" : c.text, border: `1px solid ${months === m ? c.green : c.border}` }}>
            {m}mo
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ background: c.sage }}>
        <div className="flex justify-between mb-2">
          <span className="inter" style={{ fontSize: 12.5, color: c.muted }}>Monthly interest ({product?.rate || "1.0%/mo"})</span>
          <span className="inter" style={{ fontSize: 12.5, fontWeight: 600, color: c.text }}>{fmt(Math.round(monthlyInterest))}</span>
        </div>
        <div className="flex justify-between">
          <span className="inter" style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Estimated monthly repayment</span>
          <span className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.green }}>{fmt(monthlyPayment)}</span>
        </div>
      </div>
    </>
  );
}

function GuarantorLocalPicker({ search, setSearch, filtered, guarantors, setGuarantors, loanId, store }) {
  return (
    <>
      <input
        placeholder="Search member by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="inter w-full rounded-xl mb-3"
        style={{ padding: "11px 14px", border: `1px solid ${c.border}`, fontSize: 13, background: c.card, outline: "none" }}
      />
      {search && (
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && <p className="inter" style={{ fontSize: 12, color: c.muted }}>No members found.</p>}
          {filtered.map((m) => (
            <button
              key={m.memberNo}
              onClick={() => {
                setGuarantors([...guarantors, { ...m, source: "local", status: "accepted" }]);
                setSearch("");
                if (loanId) {
                  store.addLocalGuarantor(loanId, { memberNo: m.memberNo, name: m.name, amount: m.shares });
                }
              }}
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ background: c.card, border: `1px solid ${c.border}` }}
            >
              <div className="text-left">
                <p className="inter" style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{m.name}</p>
                <p className="inter" style={{ fontSize: 11, color: c.muted }}>{m.memberNo} · shares {fmt(m.shares)}</p>
              </div>
              <Plus size={16} color={c.green} />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function GuarantorSakonetPicker({ extSacco, setExtSacco, extMemberNo, setExtMemberNo, extPhone, setExtPhone, extAmount, setExtAmount, extStatus, sendSakonetRequest, allSaccos = false }) {
  const store = useSakonet();
  const partnerSaccos = Object.values(store.state.saccos).filter((s) => s.code === "BTY");
  const preferredMembers = { BTY: "BT-3390", JEN: "JN-2004", BAR: "BR-3004", GT10: "GT-1001" };
  const selectedMember = extSacco ? (store.state.membersBySacco[extSacco.code] || []).find((m) => m.memberNo === preferredMembers[extSacco.code]) || (store.state.membersBySacco[extSacco.code] || [])[0] : null;
  const disabled = !extSacco || !extMemberNo || !extAmount;

  useEffect(() => {
    if (!extSacco) return;
    const demoMember = selectedMember;
    if (!demoMember) {
      setExtMemberNo("");
      setExtPhone("");
      return;
    }
    setExtMemberNo(demoMember.memberNo);
    setExtPhone(demoMember.phone || "");
  }, [extSacco?.code, selectedMember?.memberNo]);
  return (
    <div className="rounded-2xl p-4" style={{ background: c.sakonetBg, border: `1px solid ${c.sakonetBorder}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Globe2 size={15} color={c.sakonet} />
        <p className="inter" style={{ fontSize: 12.5, fontWeight: 700, color: c.sakonet }}>Via Sakonet — intersacco guarantorship</p>
      </div>
      <p className="inter" style={{ fontSize: 11.5, fontWeight: 600, color: c.text, marginBottom: 6 }}>
        {allSaccos ? "Guarantor's SACCO" : "Guarantor's SACCO"}
      </p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {partnerSaccos.map((s) => {
          const active = extSacco?.code === s.code;
          return (
            <button
              key={s.code}
              onClick={() => setExtSacco(s)}
              className="rounded-lg inter"
              style={{ padding: "7px 12px", fontSize: 12, fontWeight: 600, background: active ? c.sakonet : c.card, color: active ? "#fff" : c.text, border: `1px solid ${active ? c.sakonet : c.sakonetBorder}` }}
            >
              {s.name}
            </button>
          );
        })}
      </div>

      <input
        placeholder="Guarantor's member number"
        value={extMemberNo}
        onChange={(e) => setExtMemberNo(e.target.value)}
        className="inter w-full rounded-xl mb-2"
        style={{ padding: "10px 14px", border: `1px solid ${c.sakonetBorder}`, fontSize: 13, background: c.card, outline: "none" }}
      />
      <input
        placeholder="Guarantor's phone number"
        value={extPhone}
        onChange={(e) => setExtPhone(e.target.value)}
        className="inter w-full rounded-xl mb-3"
        style={{ padding: "10px 14px", border: `1px solid ${c.sakonetBorder}`, fontSize: 13, background: c.card, outline: "none" }}
      />

      <input
        placeholder="Guarantee amount (KES)"
        value={extAmount}
        inputMode="decimal"
        onChange={(e) => {
          let v = e.target.value.replace(/[^0-9.]/g, "");
          // allow only one decimal point
          const firstDot = v.indexOf(".");
          if (firstDot !== -1) {
            v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
          }
          setExtAmount(v);
        }}
        className="inter w-full rounded-xl mb-3"
        style={{ padding: "10px 14px", border: `1px solid ${c.sakonetBorder}`, fontSize: 13, background: c.card, outline: "none" }}
      />

      <button
        onClick={sendSakonetRequest}
        disabled={disabled || extStatus === "pending_review" || extStatus === "verifying"}
        className="w-full rounded-xl inter flex items-center justify-center gap-2"
        style={{
          padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#fff",
          background: disabled ? c.sakonetBorder : c.sakonet,
          opacity: (extStatus === "pending_review" || extStatus === "verifying") ? 0.85 : 1,
        }}
      >
        {sakonetButtonLabel(extStatus)}
      </button>
    </div>
  );
}

function StepGuarantors(props) {
  const { totalCover, totalNeededCover, coverPct, guarantors, setGuarantors, product, savingsCover } = props;
  const isBoresha = product?.sakonetOnly;
  const remaining = Math.max(0, totalNeededCover - totalCover);

  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>
        {isBoresha ? "Add guarantors via Sakonet Boresha" : "Add guarantors"}
      </h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>
        {isBoresha
          ? "Pick guarantors from any SACCO onboarded on the Sakonet platform, including your own. You can add as many as you need until the loan is fully covered."
          : "Select guarantors from Mkulima SACCO. External guarantors are available only for Sakonet Boresha loans."}
      </p>

      <div className="rounded-2xl p-4 mb-4" style={{ background: c.sage }}>
        <div className="flex justify-between mb-2">
          <span className="inter" style={{ fontSize: 12, color: c.muted }}>Cover secured</span>
          <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: coverPct >= 100 ? c.success : c.text }}>{fmt(totalCover)} of {fmt(totalNeededCover)}</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 7, background: "#fff" }}>
          <div style={{ width: `${coverPct}%`, height: "100%", background: coverPct >= 100 ? c.success : c.gold }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="inter" style={{ fontSize: 11.5, color: c.muted }}>Remaining amount to be guaranteed</span>
          <span className="inter" style={{ fontSize: 11.5, fontWeight: 700, color: remaining > 0 ? c.danger : c.success }}>
            {remaining > 0 ? fmt(remaining) : "Fully covered"}
          </span>
        </div>
      </div>

      {savingsCover > 0 && (
        <div className="rounded-xl p-3 mb-3 flex items-center justify-between" style={{ background: c.card, border: `1px solid ${c.border}` }}>
          <div>
            <p className="inter" style={{ fontSize: 13, fontWeight: 600, color: c.text }}>Your savings</p>
            <p className="inter" style={{ fontSize: 11, color: c.muted }}>Applied automatically</p>
          </div>
          <p className="inter" style={{ fontSize: 13, fontWeight: 700, color: c.success }}>{fmt(savingsCover)}</p>
        </div>
      )}

      {guarantors.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {guarantors.map((g) => (
            <div key={g.memberNo} className="rounded-xl p-3 flex items-center justify-between" style={{ background: c.card, border: `1px solid ${g.source === "sakonet" ? c.sakonetBorder : c.border}` }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="inter" style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{g.name}</p>
                  {g.source === "sakonet" && <SakonetBadge label={g.sacco} />}
                </div>
                <p className="inter" style={{ fontSize: 11, color: c.muted }}>
                  Covers up to {fmt(g.coverAmount ?? g.shares)}
                  {g.status && g.status !== "accepted" && (
                    <span style={{ color: g.status === "rejected" ? c.danger : c.gold, fontWeight: 600 }}> · {guarantorStatusLabel(g.status)}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setGuarantors(guarantors.filter((x) => x.memberNo !== g.memberNo))}>
                <X size={16} color={c.muted} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isBoresha ? (
        <GuarantorSakonetPicker {...props} allSaccos />
      ) : (
        <GuarantorLocalPicker {...props} />
      )}
    </>
  );
}

function StepReview({ product, amount, months, monthlyPayment, guarantors, coverPct, totalNeededCover, totalCover, savingsCover }) {
  const pendingCover = Math.max(0, totalNeededCover - totalCover);
  const rows = [
    ["Product", product?.name || "—"],
    ["Amount", fmt(amount)],
    ["Term", `${months} months`],
    ["Est. monthly repayment", fmt(monthlyPayment)],
    ["Your savings applied", fmt(savingsCover)],
    ["Secured cover", fmt(totalCover)],
    ["Pending guarantee cover", pendingCover > 0 ? fmt(pendingCover) : "None"],
    ["Guarantors", guarantors.length ? guarantors.map((g) => g.name).join(", ") : "None added"],
    ["Cover status", coverPct >= 100 ? "Fully covered" : `${coverPct}% secured`],
  ];
  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>Review & submit</h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>Check the details before sending this to your guarantors and the credit committee.</p>

      <div className="rounded-2xl p-4 mb-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.border}` }}>
            <span className="inter" style={{ fontSize: 12.5, color: c.muted }}>{k}</span>
            <span className="inter" style={{ fontSize: 12.5, fontWeight: 600, color: c.text, textAlign: "right", maxWidth: "60%" }}>{v}</span>
          </div>
        ))}
      </div>

    </>
  );
}

function ApplyLoan({ onClose, onSubmitted }) {
  const store = useSakonet();
  const [step, setStep] = useState(1);
  const [product, setProduct] = useState(null);
  const [amount, setAmount] = useState(150000);
  const [months, setMonths] = useState(12);
  const [guarantors, setGuarantors] = useState([]);
  const [loanId, setLoanId] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [extSacco, setExtSacco] = useState(null);
  const [extMemberNo, setExtMemberNo] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [extAmount, setExtAmount] = useState("");
  const [extStatus, setExtStatus] = useState("idle");

  // Demo shortcut: once Sakonet Boresha is selected, preselect a real
  // onboarded demo SACCO and its demo guarantor. The presenter only needs
  // to enter the guarantee amount; the SACCO/member details are already on
  // the SACCO record and are displayed as read-only.
  useEffect(() => {
    if (!product?.sakonetOnly || extSacco) return;
    const demoSacco = store.state.saccos.BTY;
    if (demoSacco?.onboarded && demoSacco.status === "active") setExtSacco(demoSacco);
  }, [product?.id, extSacco, store.state.saccos.BTY]);

  // A toast from an earlier step (e.g. "Sent to Mkulima SACCO for review")
  // shouldn't still be sitting on screen once the borrower has moved on —
  // it was overlapping the Review step's submit button like a stray
  // second button. Clear it whenever the step changes.
  useEffect(() => {
    setToast(null);
  }, [step]);

  const eligibleAmount = product ? member.savings * product.max : 0;
  const amountExceedsEligibility = Boolean(product) && Number(amount) > eligibleAmount;
  const amountBelowMinimum = Boolean(product) && Number(amount) > 0 && Number(amount) < 10000;
  const rate = product ? Number.parseFloat(product.rate) / 100 : 0.01;
  const monthlyInterest = amount * rate;
  const monthlyPayment = Math.round(amount / months + monthlyInterest);
  // Cover starts with the borrower's own savings (same rule the store
  // uses in LOAN/CHECK_COVERAGE), then adds guarantors who have actually
  // confirmed. Requests still in flight show up in the list below so the
  // borrower can see what's pending, but they don't count as cover yet.
  const totalNeededCover = amount;
  const savingsCover = Math.min(member.savings, totalNeededCover);
  const guarantorCover = guarantors
    .filter((g) => (g.status === "accepted" || g.status === "secured"))
    .reduce((s, g) => s + Math.min(g.coverAmount ?? g.shares, amount), 0);
  const totalCover = Math.min(totalNeededCover, savingsCover + guarantorCover);
  const coverPct = Math.min(100, Math.round((totalCover / totalNeededCover) * 100));

  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) && !guarantors.some((g) => g.memberNo === m.memberNo));

  const getCurrentLoan = () =>
    Object.values(store.state.loans).find(l => l.borrowerMemberNo === "MK-07741" && l.stage === "guarantors");

  // Polls the store for a request's stage and updates just that one
  // guarantor's row in the list — used both right after submitting and
  // when resuming any in-flight requests on mount. Deliberately doesn't
  // touch the "add a guarantor" form fields, so the borrower is free to
  // start adding another guarantor while this one is still in flight.
  const watchRequest = (requestId, guarantorSaccoCode) => {
    let attempts = 0;
    const maxAttempts = 600; // generous — the first hold is a manual SACCO review, not an automatic step

    const interval = setInterval(() => {
      const req = store.state.requests[requestId];

      if (!req) {
        attempts++;
        if (attempts > maxAttempts) clearInterval(interval);
        return;
      }

      if (req.stage === "submitted") return; // waiting on Mkulima SACCO admin — no timeout while this holds

      if (req.stage === "returned") {
        clearInterval(interval);
        setGuarantors(prev => prev.map(g =>
          g.memberNo === req.guarantorMemberNo ? { ...g, status: "returned" } : g
        ));
        setToast(`Mkulima SACCO returned the request for ${req.guarantorName || req.guarantorMemberNo} — update the details and resend.`);
        setTimeout(() => setToast(null), 3500);
        return;
      }

      if (req.stage === "notified") {
        // Deliberately doesn't clearInterval here — the guarantor SACCO
        // still has to confirm the member's decision before this settles,
        // so polling needs to keep running to catch that later stage.
        const guarantorMember = store.state.membersBySacco[guarantorSaccoCode]?.find(m => m.memberNo === req.guarantorMemberNo);
        setGuarantors(prev => prev.some(g => g.memberNo === req.guarantorMemberNo)
          ? prev.map(g => g.memberNo === req.guarantorMemberNo ? { ...g, status: "delivered" } : g)
          : [...prev, {
              memberNo: req.guarantorMemberNo,
              name: guarantorMember?.name || req.guarantorName,
              sacco: store.state.saccos[guarantorSaccoCode]?.name || guarantorSaccoCode,
              coverAmount: req.amount,
              source: "sakonet",
              status: "delivered",
            }]);
      }

      if (req.stage === "sacco_confirmed_accepted" || req.stage === "locked" || req.stage === "accepted") {
        clearInterval(interval);

        setGuarantors(prev => prev.map(g =>
          g.memberNo === req.guarantorMemberNo ? { ...g, status: "secured", coverAmount: req.amount } : g
        ));

        setToast(`${req.guarantorName || "Your guarantor"}'s guarantee is secured.`);
        setTimeout(() => setToast(null), 3000);
      }

      if (req.stage === "rejected") {
        clearInterval(interval);
        setGuarantors(prev => prev.map(g =>
          g.memberNo === req.guarantorMemberNo ? { ...g, status: "rejected" } : g
        ));
        setToast(`${req.guarantorName || "The guarantor"} declined the request.`);
        setTimeout(() => setToast(null), 3500);
      }

      attempts++;
      if (attempts > maxAttempts) clearInterval(interval);
    }, 500);
  };

  // Resume in-progress work if the borrower left this screen mid-flow —
  // the store already persists to localStorage, so on remount we just
  // need to rehydrate the local UI from it instead of starting blank.
  useEffect(() => {
    const currentLoan = getCurrentLoan();
    if (!currentLoan) return;

    setLoanId(currentLoan.id);
    setProduct((p) => p ?? loanProducts.find((prod) => prod.name === currentLoan.product) ?? null);
    setAmount(currentLoan.amount);
    setMonths(currentLoan.term);
    // The loan already exists at this stage, so jump straight to the
    // Guarantors step instead of making the borrower click back through
    // Product and Amount, which are already decided.
    setStep(3);

    const restored = (currentLoan.guarantors || []).map((g) => {
      if (g.mode === "sakonet") {
        return {
          memberNo: g.memberNo, name: g.name,
          sacco: store.state.saccos[g.sacco]?.name || g.sacco,
          coverAmount: g.amount, source: "sakonet", status: g.status,
        };
      }
      const localMember = members.find(m => m.memberNo === g.memberNo);
      return { memberNo: g.memberNo, name: g.name, shares: localMember?.shares ?? g.amount, source: "local", status: g.status };
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (restored.length) setGuarantors(restored);

    // Resume watching every guarantor request still in flight for this
    // loan — not just one — so nothing silently stops updating just
    // because the borrower had more than one request out at a time.
    const inFlightRequests = Object.values(store.state.requests).filter(
      (r) => r.loanId === currentLoan.id && ["submitted", "returned", "network_routed", "sacco_verified", "notified", "member_responded", "awaiting_sacco_confirmation"].includes(r.stage)
    );
    inFlightRequests.forEach((r) => watchRequest(r.id, r.guarantorSacco));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendSakonetRequest = () => {
    if (!extSacco || !extMemberNo || !extAmount) return;

    setToast(null);

    const currentLoan = getCurrentLoan();
    if (!currentLoan) {
      setToast("No active loan found. Please apply for a loan first.");
      return;
    }

    // A guarantor from the borrower's own SACCO never has to travel over
    // Sakonet — accept them immediately, the same as the local picker,
    // instead of running them through the cross-SACCO relay and its
    // multi-step wait.
    if (extSacco.code === "MKU") {
      if (extMemberNo === member.memberNo) {
        setToast("You can't guarantee your own loan.");
        return;
      }
      const localMember = store.state.membersBySacco.MKU?.find((m) => m.memberNo === extMemberNo);
      if (!localMember) {
        setToast("No member found with that number at Mkulima SACCO.");
        return;
      }
      store.addLocalGuarantor(currentLoan.id, { memberNo: extMemberNo, name: localMember.name, amount: Number(extAmount) });
      setGuarantors(prev => prev.some(g => g.memberNo === extMemberNo) ? prev : [...prev, {
        memberNo: extMemberNo,
        name: localMember.name,
        shares: localMember.shares,
        coverAmount: Number(extAmount),
        source: "local",
        status: "accepted",
      }]);
      setToast(`${localMember.name} added as guarantor.`);
      setTimeout(() => setToast(null), 2500);
      setExtSacco(null);
      setExtMemberNo("");
      setExtPhone("");
      setExtAmount("");
      setExtStatus("idle");
      return;
    }

    const result = store.sendGuarantorRequest({
      loanId: currentLoan.id,
      guarantorSaccoCode: extSacco.code,
      guarantorMemberNo: extMemberNo,
      amount: Number(extAmount)
    });

    if (!result.ok) {
      setToast(result.error || "Failed to send request.");
      return;
    }

    // Reflect this pledge right away — it already exists on the loan in
    // the store (sendGuarantorRequest adds it there), so the Review step
    // shouldn't show "None added" while it's in flight. It won't count
    // toward cover until its status becomes "accepted".
    const guarantorMember = store.state.membersBySacco[extSacco.code]?.find(m => m.memberNo === extMemberNo);
    setGuarantors(prev => prev.some(g => g.memberNo === extMemberNo) ? prev : [...prev, {
      memberNo: extMemberNo,
      name: guarantorMember?.name || extMemberNo,
      sacco: extSacco.name,
      coverAmount: Number(extAmount),
      source: "sakonet",
      status: "submitted",
    }]);

    setToast("Sent to Mkulima SACCO for review.");
    setTimeout(() => setToast(null), 2500);
    watchRequest(result.requestId, extSacco.code);

    // Clear the form right away — its progress now lives in the
    // guarantors list above, not on this button — so another guarantor
    // (from this SACCO or another) can be queued up immediately.
    setExtSacco(null);
    setExtMemberNo("");
    setExtPhone("");
    setExtAmount("");
    setExtStatus("idle");
  };

  const steps = ["Product", "Amount", "Guarantors", "Review"];

  const stepProps = {
    product, setProduct, amount, setAmount, months, setMonths, monthlyInterest, monthlyPayment,
    guarantors, setGuarantors, search, setSearch, filtered,
    extSacco, setExtSacco, extMemberNo, setExtMemberNo,
    extPhone, setExtPhone, extAmount, setExtAmount, extStatus, sendSakonetRequest,
    totalCover, totalNeededCover, coverPct, savingsCover, loanId, store,
  };

  const stepComponents = { 1: StepProduct, 2: StepAmount, 3: StepGuarantors, 4: StepReview };
  const CurrentStep = stepComponents[step];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: c.bg, zIndex: 20 }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={step === 1 ? onClose : () => setStep(step - 1)} className="p-1 -ml-1">
          <ChevronLeft size={22} color={c.text} />
        </button>
        <p className="inter" style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>Step {step} of 4 — {steps[step - 1]}</p>
        <button onClick={onClose} className="p-1 -mr-1"><X size={19} color={c.muted} /></button>
      </div>

      <div className="flex gap-1.5 px-5 mb-5">
        {steps.map((label) => (
          <div key={label} className="flex-1 rounded-full" style={{ height: 3, background: steps.indexOf(label) < step ? c.green : c.border }} />
        ))}
      </div>

      <div className="px-5 overflow-y-auto flex-1 pb-4">
        <CurrentStep {...stepProps} />
      </div>

      {step < 4 && (
      <div className="px-5 pb-6 pt-3" style={{ borderTop: `1px solid ${c.border}`, background: c.bg }}>
        <button
          disabled={
            (step === 1 && !product) ||
            (step === 2 && (!product || amountExceedsEligibility || amountBelowMinimum || Number(amount) <= 0))
          }
          onClick={() => {
            if (step === 2 && amountExceedsEligibility) {
              setToast(`Amount exceeds your eligible limit of ${fmt(eligibleAmount)}.`);
              setTimeout(() => setToast(null), 3000);
              return;
            }
            // The loan needs to exist for real (in the shared store) before
            // guarantors can be attached to it — create it once, the first
            // time the borrower leaves the amount step.
            if (step === 2 && !loanId) {
              const existing = getCurrentLoan();
              const id = existing
                ? existing.id
                : store.createLoan({
                    borrowerMemberNo: member.memberNo,
                    borrowerSacco: "MKU",
                    product: product.name,
                    amount,
                    term: months,
                    purpose: "",
                  });
              setLoanId(id);
            }
            setStep(step + 1);
          }}
          className="w-full rounded-2xl inter"
          style={{ padding: "13px 0", fontSize: 14, fontWeight: 600, background: ((step === 1 && !product) || (step === 2 && (!product || amountExceedsEligibility || amountBelowMinimum || Number(amount) <= 0))) ? c.border : c.green, color: "#fff", opacity: ((step === 1 && !product) || (step === 2 && (!product || amountExceedsEligibility || amountBelowMinimum || Number(amount) <= 0))) ? 0.7 : 1 }}
        >
          Continue
        </button>
      </div>
      )}

      {toast && (
        <div className="absolute left-5 right-5 mx-auto rounded-xl px-4 py-3 flex items-center gap-2" style={{ bottom: 80, background: c.success, maxWidth: 420 }}>
          <Check size={15} color="#fff" />
          <span className="inter" style={{ fontSize: 12.5, color: "#fff", fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ---------- GUARANTOR ----------
function GuarantorScreen({ requests, setRequests }) {
  const [expanded, setExpanded] = useState(null);
  const [toast, setToast] = useState(null);

  const respond = (id, decision) => {
    const req = requests.find((r) => r.id === id);
    setRequests(requests.filter((r) => r.id !== id));
    setExpanded(null);
    setToast(`${decision === "approve" ? "Approved" : "Declined"} guarantee for ${req.name}`);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <div className="px-5 pb-4 overflow-y-auto relative" style={{ background: c.bg, flex: 1 }}>
      <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 10 }}>
        Pending requests {requests.length > 0 && <span style={{ color: c.gold }}>({requests.length})</span>}
      </h2>

      {requests.length === 0 && (
        <div className="rounded-2xl p-5 text-center mb-6" style={{ background: c.sage }}>
          <CheckCircle2 size={22} color={c.success} style={{ margin: "0 auto 6px" }} />
          <p className="inter" style={{ fontSize: 12.5, color: c.muted }}>No pending guarantor requests.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {requests.map((r) => {
          const isSakonet = r.source === "sakonet";
          return (
          <div key={r.id} className="rounded-2xl p-4" style={{ background: c.card, border: `1px solid ${isSakonet ? c.sakonetBorder : c.border}` }}>
            <button className="w-full flex items-center justify-between" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="inter" style={{ fontSize: 13.5, fontWeight: 700, color: c.text }}>{r.name}</p>
                  {isSakonet && <SakonetBadge label={r.borrowerSacco} />}
                </div>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>{r.product} · {fmt(r.amount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone="pending">{r.requested}</Pill>
                <ChevronRight size={16} color={c.muted} style={{ transform: expanded === r.id ? "rotate(90deg)" : "none" }} />
              </div>
            </button>

            {expanded === r.id && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${c.border}` }}>
                {isSakonet ? (
                  <>
                    <div className="flex justify-between mb-2">
                      <span className="inter" style={{ fontSize: 12, color: c.muted }}>Borrower's SACCO</span>
                      <span className="inter" style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{r.borrowerSacco}</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="inter" style={{ fontSize: 12, color: c.muted }}>Loan term</span>
                      <span className="inter" style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{r.term}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between mb-2">
                    <span className="inter" style={{ fontSize: 12, color: c.muted }}>Member No.</span>
                    <span className="inter" style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{r.memberNo}</span>
                  </div>
                )}
                <div className="flex justify-between mb-2">
                  <span className="inter" style={{ fontSize: 12, color: c.muted }}>Your exposure if approved</span>
                  <span className="inter" style={{ fontSize: 12, fontWeight: 600, color: c.text }}>{fmt(r.amount)}</span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="inter" style={{ fontSize: 12, color: c.muted }}>Your available guarantee capacity</span>
                  <span className="inter" style={{ fontSize: 12, fontWeight: 600, color: c.success }}>{fmt(member.shares)}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => respond(r.id, "decline")} className="flex-1 rounded-xl inter" style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, background: c.card, color: c.danger, border: `1px solid ${c.danger}` }}>
                    Decline
                  </button>
                  <button onClick={() => respond(r.id, "approve")} className="flex-1 rounded-xl inter" style={{ padding: "10px 0", fontSize: 13, fontWeight: 600, background: isSakonet ? c.sakonet : c.green, color: "#fff" }}>
                    Approve
                  </button>
                </div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 10 }}>Loans you're guaranteeing</h2>
      <div className="flex flex-col gap-3">
        {guaranteeing.map((g) => {
          const isSakonet = g.source === "sakonet";
          return (
          <div key={g.id} className="rounded-2xl p-4" style={{ background: c.card, border: `1px solid ${isSakonet ? c.sakonetBorder : c.border}` }}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="inter" style={{ fontSize: 13, fontWeight: 700, color: c.text }}>{g.name}</p>
                  {isSakonet && <SakonetBadge label={g.borrowerSacco} />}
                </div>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>{g.product} · your exposure {fmt(g.exposure)}</p>
              </div>
              <Pill>{g.cleared} cleared</Pill>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.sage }}>
              <div style={{ width: g.cleared, height: "100%", background: isSakonet ? c.sakonet : c.gold }} />
            </div>
          </div>
          );
        })}
      </div>

      {toast && (
        <div className="absolute left-5 right-5 mx-auto rounded-xl px-4 py-3 flex items-center gap-2" style={{ bottom: 12, background: c.text, maxWidth: 420 }}>
          <Check size={15} color="#fff" />
          <span className="inter" style={{ fontSize: 12.5, color: "#fff", fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ---------- NOTIFICATIONS ----------
function NotificationsScreen() {
  const store = useSakonet();
  const items = store.state.notifications[member.memberNo] || [];
  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.bg, flex: 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Recent</h2>
        <button onClick={() => store.markRead(member.memberNo)} className="inter" style={{ fontSize: 12, color: c.greenLight, fontWeight: 600 }}>
          Mark all read
        </button>
      </div>
      {items.length === 0 && <p className="inter" style={{ fontSize: 12.5, color: c.muted }}>Nothing here yet.</p>}
      <div className="flex flex-col gap-2">
        {items.map((n) => (
          <div
            key={n.id}
            className="rounded-2xl p-4 flex gap-3 text-left"
            style={{ background: n.unread ? c.sage : c.card, border: `1px solid ${c.border}` }}
          >
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#fff" }}>
              {notifIcon(n.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="inter" style={{ fontSize: 13, fontWeight: n.unread ? 700 : 600, color: c.text }}>{n.title}</p>
                {n.unread && <span style={{ width: 7, height: 7, borderRadius: 7, background: c.gold, flexShrink: 0, marginLeft: 6, marginTop: 4 }} />}
              </div>
              <p className="inter" style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{n.body}</p>
              <p className="inter" style={{ fontSize: 10.5, color: c.muted, marginTop: 6 }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- APP SHELL ----------
export default function MkulimaMemberApp() {
  const store = useSakonet();
  const [tab, setTab] = useState("home");
  const [loanView, setLoanView] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [applying, setApplying] = useState(false);
  const [requests, setRequests] = useState(guaranteeRequestsInitial);
  const unreadCount = (store.state.notifications[member.memberNo] || []).filter((n) => n.unread).length;

  const openLoan = (loan) => { setSelectedLoan(loan); setLoanView("detail"); };

  return (
    <div className="flex items-center justify-center w-full" style={{ minHeight: "100dvh", background: "#DCE3DA", fontFamily: "Inter, sans-serif" }}>
      <style>{fontStack}</style>
      <div className="phone-shell relative flex flex-col overflow-hidden" style={{ background: c.bg }}>

        <div className="flex items-center justify-between px-6 pt-3 pb-1" style={{ background: c.bg }}>
          <span className="sora" style={{ fontSize: 13, fontWeight: 700, color: c.text }}>9:41</span>
          <div className="flex items-center gap-1">
            <Smartphone size={13} color={c.text} />
          </div>
        </div>

        {tab === "home" && (
          <HomeScreen
            goLoans={() => setTab("loans")}
            goGuarantor={() => setTab("guarantor")}
            goNotifications={() => setTab("notifications")}
            onContinueLoan={() => setApplying(true)}
          />
        )}

        {tab === "loans" && loanView !== "detail" && (
          <LoansHome onApply={() => setApplying(true)} onOpenLoan={openLoan} onContinueLoan={() => setApplying(true)} />
        )}
        {tab === "loans" && loanView === "detail" && (
          <LoanDetail loan={selectedLoan} onBack={() => setLoanView(null)} onContinueLoan={() => setApplying(true)} />
        )}

        {tab === "guarantor" && <GuarantorScreen requests={requests} setRequests={setRequests} />}
        {tab === "notifications" && <NotificationsScreen />}

        <NavBar tab={tab} setTab={(t) => { setTab(t); setLoanView(null); }} unreadCount={unreadCount} />

        {applying && (
          <ApplyLoan
            onClose={() => setApplying(false)}
            onSubmitted={(submittedLoanId) => {
              setApplying(false);
              setTab("loans");
              setSelectedLoan({ id: submittedLoanId });
              setLoanView("detail");
            }}
          />
        )}
      </div>
    </div>
  );
}