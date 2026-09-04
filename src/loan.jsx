import { useState } from "react";
import {
  Home, Wallet, Users, Bell, ChevronRight, ChevronLeft, X, Check,
  Clock, ShieldCheck, TrendingUp, Send, FileText, Smartphone,
  AlertCircle, CheckCircle2, Circle, Plus,
  Globe2, Loader2,
} from "lucide-react";

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
  // Sakonet (intersacco guarantorship network) gets its own color family,
  // deliberately outside the green/gold local palette, so any cross-SACCO
  // figure is instantly recognizable as coming from an external source.
  sakonet: "#2F5D8A",
  sakonetBg: "#E9EFF6",
  sakonetBorder: "#C7D6E8",
};

const fontStack = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
  .sora { font-family: 'Sora', sans-serif; }
  .inter { font-family: 'Inter', sans-serif; }
`;

const fmt = (n) => "KES " + n.toLocaleString("en-KE");

function sakonetButtonLabel(status) {
  if (status === "verifying") {
    return (<><Loader2 size={14} className="animate-spin" /> Verifying with Sakonet…</>);
  }
  if (status === "verified") {
    return (<><Check size={14} /> Verified</>);
  }
  return (<span>Send request via Sakonet</span>);
}

// ---------- Mock data ----------
const member = {
  name: "Wanjiku Mwangi",
  memberNo: "SC-08421",
  savings: 486200,
  shares: 62000,
  eligibility: 3, // multiplier of savings
};

const loanProducts = [
  { id: "emergency", name: "Emergency Loan", rate: "1.0%/mo", max: 3, desc: "Fast cash for urgent needs, released within 24 hours.", term: "Up to 12 months" },
  { id: "school", name: "School Fees Loan", rate: "1.0%/mo", max: 3, desc: "Covers tuition, paid directly to the institution.", term: "Up to 24 months" },
  { id: "development", name: "Development Loan", rate: "1.2%/mo", max: 3, desc: "For land, construction, or business capital.", term: "Up to 48 months" },
  { id: "salary", name: "Salary Advance", rate: "0.8%/mo", max: 1, desc: "Short bridge against next month's salary.", term: "Up to 3 months" },
];

const members = [
  { name: "Otieno Kamau", memberNo: "SC-01123", shares: 91000 },
  { name: "Achieng Wafula", memberNo: "SC-02871", shares: 54000 },
  { name: "Kiplagat Ruto", memberNo: "SC-03390", shares: 120000 },
  { name: "Nyambura Kariuki", memberNo: "SC-04552", shares: 38000 },
];

// SACCOs reachable through the Sakonet network (this member's own SACCO,
// "SACCO A", is never listed here — Sakonet only connects OTHER SACCOs).
const partnerSaccos = [
  { code: "SACCO-B", name: "SACCO B" },
  { code: "SACCO-C", name: "SACCO C" },
  { code: "SACCO-D", name: "SACCO D" },
];

const activeLoans = [
  { id: 1, product: "Development Loan", principal: 350000, balance: 214000, nextDue: "12 Sep 2026", nextAmount: 14800, status: "active" },
  { id: 2, product: "Emergency Loan", principal: 40000, balance: 40000, status: "pending", stage: 1 },
];

// Incoming guarantor requests. "source" distinguishes requests that
// originated inside this SACCO from ones relayed by Sakonet on behalf of
// a member's own SACCO (Sakonet never talks to the member directly —
// SACCO A always forwarded this to us, then we notify our member).
const guaranteeRequestsInitial = [
  { id: 1, name: "Otieno Kamau", memberNo: "SC-01123", amount: 180000, product: "Development Loan", requested: "2 days ago", source: "local" },
  { id: 2, name: "Nyambura Kariuki", memberNo: "SC-04552", amount: 60000, product: "School Fees Loan", requested: "5 hours ago", source: "local" },
  { id: 3, name: "John Kamau", borrowerSacco: "SACCO A", amount: 300000, product: "Development Loan", term: "48 months", requested: "1 hour ago", source: "sakonet" },
];

const guaranteeing = [
  { id: "g1", name: "Achieng Wafula", amount: 90000, exposure: 90000, product: "Emergency Loan", cleared: "62%", source: "local" },
  { id: "g2", name: "Peter Mwenda", borrowerSacco: "SACCO C", amount: 120000, exposure: 120000, product: "Business Loan", cleared: "30%", source: "sakonet" },
];

const notificationsData = [
  { id: 1, type: "guarantor", title: "New guarantor request", body: "Nyambura Kariuki listed you as guarantor for KES 60,000.", time: "5h ago", unread: true },
  { id: 2, type: "sakonet", title: "External guarantor request via Sakonet", body: "John Kamau of SACCO A requested you as guarantor for KES 300,000.", time: "1h ago", unread: true },
  { id: 3, type: "loan", title: "Loan disbursed", body: "Your Development Loan of KES 350,000 has been disbursed to your FOSA account.", time: "1d ago", unread: true },
  { id: 4, type: "repayment", title: "Repayment due in 3 days", body: "KES 14,800 due on your Development Loan, 12 Sep 2026.", time: "1d ago", unread: false },
  { id: 5, type: "sakonet", title: "Guarantee verified via Sakonet", body: "Your guarantee for a SACCO C member has been confirmed and recorded.", time: "2d ago", unread: false },
  { id: 6, type: "guarantor", title: "Guarantor request", body: "Otieno Kamau listed you as guarantor for KES 180,000.", time: "2d ago", unread: false },
  { id: 7, type: "sakonet", title: "Guarantee alert via Sakonet", body: "A loan guaranteed for a SACCO C member has entered arrears.", time: "3d ago", unread: false },
  { id: 8, type: "security", title: "New device login", body: "Your account was accessed from a new device in Nairobi.", time: "4d ago", unread: false },
  { id: 9, type: "dividend", title: "Dividends declared", body: "2025 dividends of KES 21,340 have been credited to your account.", time: "1w ago", unread: false },
];

const notifIcon = (type) => {
  const map = {
    guarantor: <Users size={16} color={c.gold} />,
    sakonet: <Globe2 size={16} color={c.sakonet} />,
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
function HomeScreen({ goLoans, goGuarantor, goNotifications }) {
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
      {activeLoans.slice(0, 1).map((loan) => (
        <div key={loan.id} className="rounded-2xl p-4 mb-3" style={{ background: c.card, border: `1px solid ${c.border}` }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text }}>{loan.product}</p>
              <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Balance {fmt(loan.balance)}</p>
            </div>
            <Pill tone="active">Active</Pill>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.sage }}>
            <div style={{ width: `${100 - (loan.balance / loan.principal) * 100}%`, height: "100%", background: c.gold }} />
          </div>
          <p className="inter mt-2" style={{ fontSize: 11, color: c.muted }}>Next: {fmt(loan.nextAmount)} due {loan.nextDue}</p>
        </div>
      ))}

      <div className="flex items-center justify-between mb-2 mt-3">
        <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Needs your action</h2>
      </div>
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: "#FBF0DA", border: "1px solid #EBD9A9" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-full" style={{ width: 36, height: 36, background: "#fff" }}>
            <Users size={16} color="#8A6512" />
          </div>
          <div>
            <p className="inter" style={{ fontSize: 12.5, fontWeight: 600, color: c.text }}>2 guarantor requests pending</p>
            <p className="inter" style={{ fontSize: 11, color: c.muted }}>Review and respond</p>
          </div>
        </div>
        <button onClick={goGuarantor}><ChevronRight size={17} color={c.text} /></button>
      </div>
    </div>
  );
}

// ---------- LOANS ----------
function LoansHome({ onApply, onOpenLoan }) {
  const maxEligible = member.savings * member.eligibility;
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
      <div className="flex flex-col gap-3">
        {activeLoans.map((loan) => (
          <button
            key={loan.id}
            onClick={() => onOpenLoan(loan)}
            className="rounded-2xl p-4 text-left"
            style={{ background: c.card, border: `1px solid ${c.border}` }}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text }}>{loan.product}</p>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Principal {fmt(loan.principal)}</p>
              </div>
              {loan.status === "active" ? <Pill tone="active">Active</Pill> : <Pill tone="pending">In review</Pill>}
            </div>
            {loan.status === "active" ? (
              <>
                <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.sage }}>
                  <div style={{ width: `${100 - (loan.balance / loan.principal) * 100}%`, height: "100%", background: c.gold }} />
                </div>
                <p className="inter mt-2" style={{ fontSize: 11, color: c.muted }}>Balance {fmt(loan.balance)} · Next due {loan.nextDue}</p>
              </>
            ) : (
              <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Awaiting guarantor approval</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function LoanDetail({ loan, onBack }) {
  const stages = ["Submitted", "Guarantors approved", "Committee review", "Approved", "Disbursed"];
  const currentStage = loan.status === "active" ? 5 : loan.stage || 1;
  return (
    <div className="flex-1 flex flex-col" style={{ background: c.bg }}>
      <TopBar title={loan.product} onBack={onBack} />
      <div className="px-5 overflow-y-auto flex-1 pb-4">
        <div className="rounded-2xl p-5 mb-5" style={{ background: c.green }}>
          <p className="inter" style={{ fontSize: 12, color: "#BFE0CE" }}>{loan.status === "active" ? "Outstanding balance" : "Amount requested"}</p>
          <p className="sora" style={{ fontSize: 26, fontWeight: 700, color: "#fff" }}>{fmt(loan.balance)}</p>
          <p className="inter" style={{ fontSize: 12, color: "#BFE0CE", marginTop: 6 }}>of {fmt(loan.principal)} principal</p>
        </div>

        <h3 className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text, marginBottom: 12 }}>Status</h3>
        <div className="mb-6">
          {stages.map((s, i) => {
            const done = i < currentStage;
            const isNow = i === currentStage - 1 && loan.status !== "active";
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

        {loan.status === "active" && (
          <>
            <h3 className="sora" style={{ fontSize: 13.5, fontWeight: 700, color: c.text, marginBottom: 10 }}>Next repayment</h3>
            <div className="rounded-2xl p-4 flex items-center justify-between mb-4" style={{ background: c.card, border: `1px solid ${c.border}` }}>
              <div>
                <p className="sora" style={{ fontSize: 16, fontWeight: 700, color: c.text }}>{fmt(loan.nextAmount)}</p>
                <p className="inter" style={{ fontSize: 11.5, color: c.muted }}>Due {loan.nextDue}</p>
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
// --- ApplyLoan steps, each extracted into its own component so ApplyLoan
// itself stays a simple dispatcher (keeps cognitive complexity low). ---

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
  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>How much do you need?</h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 20 }}>Eligible up to {fmt(cap)} for {product?.name}.</p>

      <p className="sora" style={{ fontSize: 30, fontWeight: 700, color: c.green, textAlign: "center", marginBottom: 10 }}>{fmt(amount)}</p>
      <input
        type="range" min={10000} max={cap} step={5000}
        value={amount} onChange={(e) => setAmount(Number(e.target.value))}
        className="w-full mb-6" style={{ accentColor: c.green }}
      />

      <p className="inter" style={{ fontSize: 12.5, fontWeight: 600, color: c.text, marginBottom: 8 }}>Repayment period</p>
      <div className="flex gap-2 mb-6">
        {[6, 12, 24, 36].map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            className="flex-1 rounded-xl inter"
            style={{ padding: "9px 0", fontSize: 12.5, fontWeight: 600, background: months === m ? c.green : c.card, color: months === m ? "#fff" : c.text, border: `1px solid ${months === m ? c.green : c.border}` }}
          >
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

function GuarantorLocalPicker({ search, setSearch, filtered, guarantors, setGuarantors }) {
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
              onClick={() => { setGuarantors([...guarantors, { ...m, source: "local" }]); setSearch(""); }}
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

function GuarantorSakonetPicker({ extSacco, setExtSacco, extMemberNo, setExtMemberNo, extPhone, setExtPhone, extAmount, setExtAmount, extStatus, sendSakonetRequest }) {
  const disabled = !extSacco || !extMemberNo || !extAmount;
  return (
    <div className="rounded-2xl p-4" style={{ background: c.sakonetBg, border: `1px solid ${c.sakonetBorder}` }}>
      <div className="flex items-center gap-2 mb-3">
        <Globe2 size={15} color={c.sakonet} />
        <p className="inter" style={{ fontSize: 12.5, fontWeight: 700, color: c.sakonet }}>Via Sakonet — intersacco guarantorship</p>
      </div>
      <p className="inter" style={{ fontSize: 11.5, color: c.muted, marginBottom: 12 }}>
        We'll send this to Sakonet, which verifies the member with their own SACCO before anything is confirmed here.
      </p>

      <p className="inter" style={{ fontSize: 11.5, fontWeight: 600, color: c.text, marginBottom: 6 }}>Guarantor's SACCO</p>
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
        className="inter w-full rounded-xl mb-2"
        style={{ padding: "10px 14px", border: `1px solid ${c.sakonetBorder}`, fontSize: 13, background: c.card, outline: "none" }}
      />
      <input
        placeholder="Guarantee amount (KES)"
        value={extAmount}
        onChange={(e) => setExtAmount(e.target.value.replace(/\D/g, ""))}
        className="inter w-full rounded-xl mb-3"
        style={{ padding: "10px 14px", border: `1px solid ${c.sakonetBorder}`, fontSize: 13, background: c.card, outline: "none" }}
      />

      <button
        onClick={sendSakonetRequest}
        disabled={disabled || extStatus === "verifying"}
        className="w-full rounded-xl inter flex items-center justify-center gap-2"
        style={{
          padding: "10px 0", fontSize: 13, fontWeight: 600, color: "#fff",
          background: disabled ? c.sakonetBorder : c.sakonet,
          opacity: extStatus === "verifying" ? 0.85 : 1,
        }}
      >
        {sakonetButtonLabel(extStatus)}
      </button>
      <p className="inter" style={{ fontSize: 10.5, color: c.muted, marginTop: 8, textAlign: "center" }}>
        Sakonet notifies the guarantor's own SACCO — never the guarantor directly. They'll accept or reject from their SACCO's app.
      </p>
    </div>
  );
}

function StepGuarantors(props) {
  const { totalCover, totalNeededCover, coverPct, guarantors, setGuarantors, guarantorMode, setGuarantorMode } = props;
  return (
    <>
      <h2 className="sora" style={{ fontSize: 19, fontWeight: 700, color: c.text, marginBottom: 4 }}>Add guarantors</h2>
      <p className="inter" style={{ fontSize: 12.5, color: c.muted, marginBottom: 16 }}>Your loan must be fully covered by your shares plus guarantors' shares.</p>

      <div className="rounded-2xl p-4 mb-4" style={{ background: c.sage }}>
        <div className="flex justify-between mb-2">
          <span className="inter" style={{ fontSize: 12, color: c.muted }}>Cover secured</span>
          <span className="inter" style={{ fontSize: 12, fontWeight: 700, color: coverPct >= 100 ? c.success : c.text }}>{fmt(totalCover)} of {fmt(totalNeededCover)}</span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 7, background: "#fff" }}>
          <div style={{ width: `${coverPct}%`, height: "100%", background: coverPct >= 100 ? c.success : c.gold }} />
        </div>
      </div>

      {guarantors.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {guarantors.map((g) => (
            <div key={g.memberNo} className="rounded-xl p-3 flex items-center justify-between" style={{ background: c.card, border: `1px solid ${g.source === "sakonet" ? c.sakonetBorder : c.border}` }}>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="inter" style={{ fontSize: 13, fontWeight: 600, color: c.text }}>{g.name}</p>
                  {g.source === "sakonet" && <SakonetBadge label={g.sacco} />}
                </div>
                <p className="inter" style={{ fontSize: 11, color: c.muted }}>Covers up to {fmt(g.coverAmount ?? g.shares)}</p>
              </div>
              <button onClick={() => setGuarantors(guarantors.filter((x) => x.memberNo !== g.memberNo))}>
                <X size={16} color={c.muted} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex rounded-xl mb-4 p-1" style={{ background: c.sage }}>
        {[
          { id: "local", label: "This SACCO" },
          { id: "sakonet", label: "Another SACCO" },
        ].map((opt) => {
          const isActive = guarantorMode === opt.id;
          let labelColor = c.muted;
          if (isActive) labelColor = opt.id === "sakonet" ? c.sakonet : c.green;
          return (
            <button
              key={opt.id}
              onClick={() => setGuarantorMode(opt.id)}
              className="flex-1 rounded-lg inter"
              style={{ padding: "8px 0", fontSize: 12.5, fontWeight: 600, background: isActive ? c.card : "transparent", color: labelColor }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {guarantorMode === "local" && <GuarantorLocalPicker {...props} />}
      {guarantorMode === "sakonet" && <GuarantorSakonetPicker {...props} />}
    </>
  );
}

function StepReview({ product, amount, months, monthlyPayment, guarantors, coverPct, totalNeededCover, totalCover }) {
  const rows = [
    ["Product", product?.name || "—"],
    ["Amount", fmt(amount)],
    ["Term", `${months} months`],
    ["Est. monthly repayment", fmt(monthlyPayment)],
    ["Guarantors", guarantors.length ? guarantors.map((g) => g.name).join(", ") : "None added"],
    ["Cover status", coverPct >= 100 ? "Fully covered" : `${coverPct}% covered`],
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

      {coverPct < 100 && (
        <div className="rounded-xl p-3 mb-4 flex gap-2" style={{ background: "#F6E4E0" }}>
          <AlertCircle size={16} color={c.danger} style={{ flexShrink: 0, marginTop: 1 }} />
          <p className="inter" style={{ fontSize: 12, color: c.danger }}>Add more guarantor cover before submitting — you're short by {fmt(totalNeededCover - totalCover)}.</p>
        </div>
      )}
    </>
  );
}

function ApplyLoan({ onClose }) {
  const [step, setStep] = useState(1);
  const [product, setProduct] = useState(null);
  const [amount, setAmount] = useState(150000);
  const [months, setMonths] = useState(12);
  const [guarantors, setGuarantors] = useState([]);
  const [search, setSearch] = useState("");

  // Guarantor sub-flow: "local" (within this SACCO) or "sakonet" (another
  // SACCO, reached only through the Sakonet network — Sakonet verifies
  // with that member's own SACCO, it never trusts details typed here).
  const [guarantorMode, setGuarantorMode] = useState("local");
  const [extSacco, setExtSacco] = useState(null);
  const [extMemberNo, setExtMemberNo] = useState("");
  const [extPhone, setExtPhone] = useState("");
  const [extAmount, setExtAmount] = useState("");
  const [extStatus, setExtStatus] = useState("idle"); // idle | verifying | verified | failed

  const rate = product ? Number.parseFloat(product.rate) / 100 : 0.01;
  const monthlyInterest = amount * rate;
  const monthlyPayment = Math.round(amount / months + monthlyInterest);
  const totalNeededCover = amount;
  const totalCover = guarantors.reduce((s, g) => s + Math.min(g.coverAmount ?? g.shares, amount), 0) + member.shares;
  const coverPct = Math.min(100, Math.round((totalCover / totalNeededCover) * 100));

  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) && !guarantors.some((g) => g.memberNo === m.memberNo));

  const sendSakonetRequest = () => {
    if (!extSacco || !extMemberNo || !extAmount) return;
    setExtStatus("verifying");
    // Simulates: SACCO A -> Sakonet -> partner SACCO's own verification
    // (member exists, active, eligible, has capacity) -> result back to SACCO A.
    setTimeout(() => {
      setExtStatus("verified");
      setGuarantors((g) => [
        ...g,
        {
          memberNo: extMemberNo,
          name: `Member ${extMemberNo}`,
          sacco: extSacco.name,
          coverAmount: Number(extAmount),
          source: "sakonet",
        },
      ]);
      setTimeout(() => {
        setExtStatus("idle");
        setExtSacco(null); setExtMemberNo(""); setExtPhone(""); setExtAmount("");
        setGuarantorMode("local");
      }, 900);
    }, 1400);
  };

  const steps = ["Product", "Amount", "Guarantors", "Review"];

  const stepProps = {
    product, setProduct, amount, setAmount, months, setMonths, monthlyInterest, monthlyPayment,
    guarantors, setGuarantors, search, setSearch, filtered,
    guarantorMode, setGuarantorMode, extSacco, setExtSacco, extMemberNo, setExtMemberNo,
    extPhone, setExtPhone, extAmount, setExtAmount, extStatus, sendSakonetRequest,
    totalCover, totalNeededCover, coverPct,
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

      <div className="px-5 pb-6 pt-3" style={{ borderTop: `1px solid ${c.border}`, background: c.bg }}>
        {step < 4 ? (
          <button
            disabled={step === 1 && !product}
            onClick={() => setStep(step + 1)}
            className="w-full rounded-2xl inter"
            style={{ padding: "13px 0", fontSize: 14, fontWeight: 600, background: step === 1 && !product ? c.border : c.green, color: "#fff", opacity: step === 1 && !product ? 0.7 : 1 }}
          >
            Continue
          </button>
        ) : (
          <button
            disabled={coverPct < 100}
            onClick={onClose}
            className="w-full rounded-2xl inter"
            style={{ padding: "13px 0", fontSize: 14, fontWeight: 600, background: coverPct < 100 ? c.border : c.green, color: "#fff" }}
          >
            Submit application
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- GUARANTOR ----------
function GuarantorScreen() {
  const [requests, setRequests] = useState(guaranteeRequestsInitial);
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
                    <div className="rounded-xl p-3 mb-3 flex gap-2" style={{ background: c.sakonetBg }}>
                      <Globe2 size={14} color={c.sakonet} style={{ flexShrink: 0, marginTop: 1 }} />
                      <p className="inter" style={{ fontSize: 11.5, color: c.sakonet }}>
                        Relayed by Sakonet on behalf of {r.borrowerSacco}. Your response goes back through Sakonet to {r.borrowerSacco} — they never contact you directly.
                      </p>
                    </div>
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
        <div className="absolute left-5 right-5 rounded-xl px-4 py-3 flex items-center gap-2" style={{ bottom: 12, background: c.text }}>
          <Check size={15} color="#fff" />
          <span className="inter" style={{ fontSize: 12.5, color: "#fff", fontWeight: 500 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}

// ---------- NOTIFICATIONS ----------
function NotificationsScreen() {
  const [items, setItems] = useState(notificationsData);
  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.bg, flex: 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="sora" style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Recent</h2>
        <button onClick={() => setItems(items.map((i) => ({ ...i, unread: false })))} className="inter" style={{ fontSize: 12, color: c.greenLight, fontWeight: 600 }}>
          Mark all read
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((n) => (
          <button
            key={n.id}
            onClick={() => setItems(items.map((i) => (i.id === n.id ? { ...i, unread: false } : i)))}
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
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- APP SHELL ----------
export default function SaccoApp() {
  const [tab, setTab] = useState("home");
  const [loanView, setLoanView] = useState(null); // null | "detail"
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [applying, setApplying] = useState(false);
  const unreadCount = notificationsData.filter((n) => n.unread).length;

  const openLoan = (loan) => { setSelectedLoan(loan); setLoanView("detail"); };

  return (
    <div className="flex items-center justify-center min-h-screen w-full" style={{ background: "#DCE3DA", fontFamily: "Inter, sans-serif" }}>
      <style>{fontStack}</style>
      <div className="relative flex flex-col overflow-hidden" style={{ width: 390, height: 800, background: c.bg, borderRadius: 40, boxShadow: "0 30px 60px rgba(14,68,50,0.25)", border: "10px solid #16201B" }}>

        {/* status bar */}
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
          />
        )}

        {tab === "loans" && loanView !== "detail" && (
          <LoansHome onApply={() => setApplying(true)} onOpenLoan={openLoan} />
        )}
        {tab === "loans" && loanView === "detail" && (
          <LoanDetail loan={selectedLoan} onBack={() => setLoanView(null)} />
        )}

        {tab === "guarantor" && <GuarantorScreen />}
        {tab === "notifications" && <NotificationsScreen />}

        <NavBar tab={tab} setTab={(t) => { setTab(t); setLoanView(null); }} unreadCount={unreadCount} />

        {applying && <ApplyLoan onClose={() => setApplying(false)} />}
      </div>
    </div>
  );
}