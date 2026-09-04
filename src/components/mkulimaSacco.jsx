import { useState } from "react";
import { useSakonet } from "./store";
import {
  LayoutGrid, Users, Wallet, Globe2, FileBarChart, Search, Bell,
  ChevronRight,
   ArrowUpRight, ArrowDownRight,
   X, Loader2, CircleCheck, CircleDashed, AlertTriangle,
   TrendingUp, ArrowLeft, ShieldCheck,
} from "lucide-react";

/* ---------------------------------------------------------------
   MWANGAZA SACCO — staff / back-office dashboard
   This is the "SACCO A" side of the flow: the borrower's own SACCO.
   Green/gold is Mkulima's institutional palette. Any figure or
   status that belongs to SAKONET (the inter-SACCO network) uses the
   separate slate-blue family so cross-SACCO activity is always
   visually distinct from Mkulima's own book.
----------------------------------------------------------------- */

const c = {
  ink: "#14231C",
  paper: "#F7F5EF",
  panel: "#FFFFFF",
  line: "#E4E1D6",
  green: "#0E4432",
  greenDeep: "#0A3226",
  gold: "#B8912E",
  goldSoft: "#F3E9CE",
  muted: "#6E7568",
  danger: "#A6402A",
  dangerSoft: "#F3E1DB",
  success: "#2E7D4F",
  successSoft: "#E3EFE6",
  sakonet: "#375D82",
  sakonetSoft: "#E8EEF5",
  sakonetLine: "#C7D5E4",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
  .disp { font-family: 'Fraunces', serif; }
  .body { font-family: 'IBM Plex Sans', sans-serif; }
`;

const kes = (n) => "KES " + n.toLocaleString("en-KE");
const shortDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });

function getRequestStatus(stage) {
  if (stage === "locked") return "accepted";
  if (stage === "notified") return "awaiting_response";
  if (stage === "network_routed") return "sacco_review";
  if (stage === "sacco_verified") return "sacco_verified";
  if (stage === "member_responded") return "decision_recorded";
  if (stage === "awaiting_sacco_confirmation") return "sacco_confirming";
  if (stage === "sacco_confirmed_accepted" || stage === "sacco_confirmation_received" || stage === "sacco_received_confirmation" || stage === "member_notified_by_mkulima") return "accepted";
  if (stage === "sacco_confirmed_declined" || stage === "sacco_confirmation_received_declined" || stage === "sacco_rejected" || stage === "rejected" || stage === "declined") return "rejected";
  if (stage === "verifying" || stage === "verified") return "verifying";
  if (stage === "rejected" || stage === "declined") return "rejected";
  return "submitted";
}

/* ---------------- Real member book for Mkulima SACCO ---------------- */
const members = [
  { id: "MK-01123", name: "Otieno Kamau", phone: "0722 341 908", joined: "2018-03-11", savings: 612000, shares: 91000, loanStatus: "Active loan", exposure: 180000 },
  { id: "MK-04552", name: "Nyambura Kariuki", phone: "0733 118 224", joined: "2019-07-02", savings: 244000, shares: 38000, loanStatus: "None", exposure: 60000 },
  { id: "MK-02871", name: "Achieng Wafula", phone: "0711 902 456", joined: "2017-11-19", savings: 398000, shares: 54000, loanStatus: "Active loan", exposure: 0 },
  { id: "MK-03390", name: "Kiplagat Ruto", phone: "0798 220 331", joined: "2015-05-27", savings: 890000, shares: 120000, loanStatus: "None", exposure: 0 },
  { id: "MK-07741", name: "David Kamau", phone: "0700 556 812", joined: "2016-09-04", savings: 486200, shares: 62000, loanStatus: "Pending — Development Loan", exposure: 0 },
  { id: "MK-05521", name: "Mary Akinyi", phone: "0745 671 200", joined: "2020-01-15", savings: 315000, shares: 44000, loanStatus: "None", exposure: 0 },
  { id: "MK-06210", name: "Peter Mwenda", phone: "0788 213 908", joined: "2021-04-22", savings: 172000, shares: 26000, loanStatus: "None", exposure: 0 },
  { id: "MK-08834", name: "Faith Chebet", phone: "0712 405 610", joined: "2014-08-30", savings: 1024000, shares: 140000, loanStatus: "Active loan", exposure: 0 },
  { id: "MK-09102", name: "Samuel Njoroge", phone: "0723 990 145", joined: "2022-02-14", savings: 98000, shares: 15000, loanStatus: "In arrears", exposure: 0 },
  { id: "MK-01987", name: "Grace Wambui", phone: "0710 663 872", joined: "2019-12-01", savings: 205000, shares: 30000, loanStatus: "None", exposure: 0 },
];

/* ---------------- small UI atoms ---------------- */
function StagePill({ stage }) {
  const map = {
    guarantors: { bg: c.goldSoft, fg: "#7A5C16", label: "Awaiting guarantors" },
    active: { bg: c.successSoft, fg: c.success, label: "Active" },
    arrears: { bg: c.dangerSoft, fg: c.danger, label: "In arrears" },
    review: { bg: "#EFEBDD", fg: c.muted, label: "Committee review" },
    committee: { bg: "#EFEBDD", fg: c.muted, label: "Committee review" },
    approved: { bg: c.successSoft, fg: c.success, label: "Approved" },
    disbursed: { bg: c.successSoft, fg: c.success, label: "Disbursed" },
  };
  const s = map[stage] || map.guarantors;
  return (
    <span className="body" style={{ background: s.bg, color: s.fg, fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>
      {s.label}
    </span>
  );
}

function StatusChip({ status }) {
  if (status === "accepted") return <span className="body flex items-center gap-1" style={{ color: c.success, fontSize: 12, fontWeight: 600 }}><CircleCheck size={13} /> Secured</span>;
  if (status === "pending_relay") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><Loader2 size={13} className="animate-spin" /> Accepted — confirmation en route via SAKONET</span>;
  if (status === "rejected") return <span className="body flex items-center gap-1" style={{ color: c.danger, fontSize: 12, fontWeight: 600 }}><X size={13} /> Rejected</span>;
  if (status === "network_routed") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><Loader2 size={13} className="animate-spin" /> With guarantor SACCO</span>;
  if (status === "sacco_verified") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><CircleCheck size={13} /> Verified by guarantor SACCO</span>;
  if (status === "sacco_confirming") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><Loader2 size={13} className="animate-spin" /> Member accepted — guarantor SACCO confirming</span>;
  if (status === "verifying") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><Loader2 size={13} className="animate-spin" /> Verifying at guarantor SACCO</span>;
  if (status === "delivered" || status === "awaiting_response") return <span className="body flex items-center gap-1" style={{ color: c.sakonet, fontSize: 12, fontWeight: 600 }}><Loader2 size={13} className="animate-spin" /> Awaiting member response</span>;
  if (status === "sacco_confirmed_accepted" || status === "secured") return <span className="body flex items-center gap-1" style={{ color: c.success, fontSize: 12, fontWeight: 600 }}><CircleCheck size={13} /> Secured</span>;
  if (status === "submitted") return <span className="body flex items-center gap-1" style={{ color: c.gold, fontSize: 12, fontWeight: 600 }}><CircleDashed size={13} /> Awaiting review</span>;
  if (status === "returned") return <span className="body flex items-center gap-1" style={{ color: c.danger, fontSize: 12, fontWeight: 600 }}><X size={13} /> Returned to member</span>;
  return <span className="body flex items-center gap-1" style={{ color: c.muted, fontSize: 12, fontWeight: 600 }}><CircleDashed size={13} /> Pending</span>;
}

function KpiCard({ label, value, delta, up, icon: Icon }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="body" style={{ fontSize: 12, color: c.muted, fontWeight: 600 }}>{label}</span>
        <Icon size={16} color={c.gold} />
      </div>
      <p className="disp" style={{ fontSize: 24, fontWeight: 600, color: c.ink, letterSpacing: -0.3 }}>{value}</p>
      {delta && (
        <div className="flex items-center gap-1 mt-2">
          {up ? <ArrowUpRight size={13} color={c.success} /> : <ArrowDownRight size={13} color={c.danger} />}
          <span className="body" style={{ fontSize: 11.5, color: up ? c.success : c.danger, fontWeight: 600 }}>{delta}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
function DashboardView({ onOpenLoan }) {
  const store = useSakonet();
  const { state } = store;
  const totalSavings = members.reduce((s, m) => s + m.savings, 0);
  const totalShares = members.reduce((s, m) => s + m.shares, 0);
  const storeLoans = Object.values(state.loans).filter((l) => l.borrowerSacco === "MKU");
  const activeLoans = storeLoans.filter((l) => l.stage === "active" || l.stage === "disbursed").length;
  const inArrears = storeLoans.filter((l) => l.stage === "arrears" || l.repayment === "arrears").length;
  const guarantorCover = storeLoans.filter((l) => l.stage === "guarantors");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Members" value={members.length} icon={Users} />
        <KpiCard label="Total savings & shares" value={kes(totalSavings + totalShares)} delta="+4.1% this quarter" up icon={TrendingUp} />
        <KpiCard label="Active loans" value={activeLoans} icon={Wallet} />
        <KpiCard label="In arrears" value={inArrears} delta={inArrears > 0 ? "Needs attention" : undefined} up={false} icon={AlertTriangle} />
      </div>

      <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp" style={{ fontSize: 16, fontWeight: 600, color: c.ink }}>Loans needing guarantor cover</h3>
          <span className="body" style={{ fontSize: 11.5, color: c.muted }}>{guarantorCover.length} loan(s)</span>
        </div>
        {guarantorCover.map((loan) => {
          const liveBorrower = (state.membersBySacco.MKU || []).find((m) => m.memberNo === loan.borrowerMemberNo);
          const guarantorAmount = (loan.guarantors || []).filter((g) => ["accepted", "secured"].includes(g.status)).reduce((s, g) => s + g.amount, 0);
          const savingsAmount = Math.min(Number(liveBorrower?.savings || 0), loan.amount);
          const covered = Math.min(loan.amount, savingsAmount + guarantorAmount);
          const pct = Math.min(100, Math.round((covered / loan.amount) * 100));
          const borrower = members.find((m) => m.id === loan.borrowerMemberNo);
          return (
            <button key={loan.id} onClick={() => onOpenLoan(loan)} className="w-full text-left rounded-xl p-4 flex items-center justify-between" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
              <div>
                <p className="body" style={{ fontSize: 13.5, fontWeight: 700, color: c.ink }}>{borrower?.name || loan.borrowerMemberNo} — {loan.product}</p>
                <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{kes(loan.amount)} · {(loan.guarantors || []).length} guarantor(s) · {pct}% covered</p>
                <div className="rounded-full overflow-hidden mt-2" style={{ height: 5, width: 220, background: c.line }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? c.success : c.gold }} />
                </div>
              </div>
              <ChevronRight size={17} color={c.muted} />
            </button>
          );
        })}
        {guarantorCover.length === 0 && <p className="body" style={{ fontSize: 13, color: c.muted, textAlign: "center", padding: "20px 0" }}>No loans awaiting guarantor cover.</p>}
      </div>

    </div>
  );
}

/* ---------------- Members ---------------- */
function MembersView() {
  const [q, setQ] = useState("");
  const filtered = members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
          <Search size={15} color={c.muted} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or member number" className="body flex-1 outline-none" style={{ fontSize: 13, background: "transparent" }} />
        </div>
        <span className="body" style={{ fontSize: 12, color: c.muted }}>{filtered.length} members</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}` }}>
        <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
              {["Member", "No.", "Phone", "Joined", "Savings", "Shares", "Loan status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: c.muted, fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{m.name}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{m.id}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{m.phone}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{shortDate(m.joined)}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(m.savings)}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(m.shares)}</td>
                <td style={{ padding: "11px 14px" }}>
                  {(() => {
                    if (m.loanStatus === "In arrears") {
                      return <span style={{ color: c.danger, fontWeight: 600 }}>{m.loanStatus}</span>;
                    }
                    if (m.loanStatus === "None") {
                      return <span style={{ color: c.muted }}>—</span>;
                    }
                    return <span style={{ color: c.ink, fontWeight: 500 }}>{m.loanStatus}</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Loans list + detail ---------------- */
function LoansView({ onOpenLoan }) {
  const store = useSakonet();
  const { state } = store;
  // Mkulima only manages disbursement/repayment/default for loans it originated.
  // A loan where Mkulima is only the guarantor SACCO belongs to the other SACCO's book.
  const storeLoans = Object.values(state.loans).filter((l) => l.borrowerSacco === "MKU");
  
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}` }}>
      <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
            {["Loan", "Borrower", "Product", "Amount", "Status", ""].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: c.muted, fontSize: 11.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {storeLoans.map((l, i) => {
            const borrower = members.find((m) => m.id === l.borrowerMemberNo);
            return (
              <tr key={l.id} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                <td style={{ padding: "11px 14px", color: c.muted }}>{l.id}</td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{borrower?.name || l.borrowerMemberNo}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{l.product}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(l.amount)}</td>
                <td style={{ padding: "11px 14px" }}><StagePill stage={l.stage} /></td>
                <td style={{ padding: "11px 14px" }}>
                  <button onClick={() => onOpenLoan(l)} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.green, fontWeight: 600 }}>
                    Open <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getLoanCoverage(guarantors, amount, savings = 0) {
  const guarantorCovered = (guarantors || [])
    .filter((g) => g.status === "accepted" || g.status === "secured")
    .reduce((sum, g) => sum + g.amount, 0);

  const savingsCovered = Math.min(Number(savings || 0), amount);
  const covered = Math.min(amount, savingsCovered + guarantorCovered);
  const pct = Math.min(100, Math.round((covered / amount) * 100));
  return { covered, pct, isFullyCovered: pct >= 100 };
}

function getActionStyle(disabled) {
  return {
    background: disabled ? c.line : c.green,
    color: disabled ? c.muted : "#fff"
  };
}

function getDisbursementAction(liveLoan, isFullyCovered, disburseLoan) {
  const disabled = !isFullyCovered;
  const style = getActionStyle(disabled);

  if (liveLoan.stage === "approved") {
    return {
      disabled,
      label: "Disburse loan",
      onClick: () => disburseLoan(liveLoan.id),
      style
    };
  }

  if (liveLoan.stage === "committee") {
    return {
      disabled,
      label: "Awaiting committee approval",
      onClick: isFullyCovered ? () => alert("Loan is fully covered! It will advance to committee review automatically.") : undefined,
      style
    };
  }

  return {
    disabled,
    label: isFullyCovered ? "Fully covered — advancing" : "Send to credit committee",
    onClick: isFullyCovered ? () => alert("Loan is fully covered! It will advance to committee review automatically.") : undefined,
    style
  };
}

function LoanDetailView({ loan, onBack }) {
  const store = useSakonet();
  const { state, disburseLoan, simulateDefault, simulateRepaid } = store;
  
  const liveLoan = state.loans[loan.id] || loan;
  const guarantors = liveLoan.guarantors || [];
  const liveBorrower = (state.membersBySacco.MKU || []).find((m) => m.memberNo === liveLoan.borrowerMemberNo);
  const { pct, isFullyCovered } = getLoanCoverage(guarantors, liveLoan.amount, liveBorrower?.savings);
  const borrower = members.find((m) => m.id === liveLoan.borrowerMemberNo);
  const isDisbursed = liveLoan.stage === "disbursed";
  const disbursementAction = getDisbursementAction(liveLoan, isFullyCovered, disburseLoan);
  
  const getRepaymentAlert = () => {
    if (liveLoan.repayment === "arrears") {
      return (
        <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: c.dangerSoft }}>
          <AlertTriangle size={16} color={c.danger} />
          <span className="body" style={{ fontSize: 12.5, color: c.danger, fontWeight: 600 }}>Loan is in arrears</span>
        </div>
      );
    }
    if (liveLoan.repayment === "repaid") {
      return (
        <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: c.successSoft }}>
          <CircleCheck size={16} color={c.success} />
          <span className="body" style={{ fontSize: 12.5, color: c.success, fontWeight: 600 }}>Loan has been fully repaid</span>
        </div>
      );
    }
    return null;
  };
  const repaymentAlert = getRepaymentAlert();
  const actionButtons = isDisbursed ? (
    <>
      <button 
        onClick={() => simulateDefault(liveLoan.id)}
        disabled={liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid"}
        className="flex-1 rounded-xl body"
        style={{ 
          padding: "11px 20px", 
          fontSize: 13, 
          fontWeight: 600, 
          background: (liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.line : c.panel,
          color: (liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.muted : c.danger,
          border: `1px solid ${(liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.line : c.danger}`
        }}
      >
        Simulate default
      </button>
      <button 
        onClick={() => simulateRepaid(liveLoan.id)}
        disabled={liveLoan.repayment === "repaid"}
        className="flex-1 rounded-xl body"
        style={{ 
          padding: "11px 20px", 
          fontSize: 13, 
          fontWeight: 600, 
          background: liveLoan.repayment === "repaid" ? c.line : c.panel,
          color: liveLoan.repayment === "repaid" ? c.muted : c.success,
          border: `1px solid ${liveLoan.repayment === "repaid" ? c.line : c.success}`
        }}
      >
        Simulate full repayment
      </button>
    </>
  ) : (
    <button 
      disabled={disbursementAction.disabled}
      onClick={disbursementAction.onClick}
      className="flex-1 rounded-xl body"
      style={{
        padding: "11px 20px",
        fontSize: 13,
        fontWeight: 600,
        ...disbursementAction.style
      }}
    >
      {disbursementAction.label}
    </button>
  );

  return (
    <div>
      <button onClick={onBack} className="body flex items-center gap-1 mb-4" style={{ fontSize: 12.5, color: c.muted, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to loans
      </button>

      <div className="rounded-2xl p-5 mb-5" style={{ background: c.green }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="body" style={{ fontSize: 12, color: "#BFE0CE" }}>{liveLoan.id} · {liveLoan.product}</p>
            <p className="disp" style={{ fontSize: 24, fontWeight: 600, color: "#fff", marginTop: 4 }}>
              {borrower?.name || liveLoan.borrower || liveLoan.borrowerMemberNo}
            </p>
          </div>
          <StagePill stage={liveLoan.stage} />
        </div>
        <div className="flex gap-8 mt-5">
          <div><p className="body" style={{ fontSize: 11, color: "#BFE0CE" }}>Amount</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{kes(liveLoan.amount)}</p></div>
          <div><p className="body" style={{ fontSize: 11, color: "#BFE0CE" }}>Term</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{liveLoan.term} months</p></div>
          <div><p className="body" style={{ fontSize: 11, color: "#BFE0CE" }}>Purpose</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{liveLoan.purpose || "—"}</p></div>
        </div>
        {repaymentAlert}
      </div>

      <div className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="disp" style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>Guarantor cover</h3>
          <span className="body" style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? c.success : c.gold }}>
            {pct}% covered {isFullyCovered && "✓"}
          </span>
        </div>
        <div className="rounded-full overflow-hidden mb-4" style={{ height: 6, background: c.paper }}>
          <div style={{ width: `${pct}%`, height: "100%", background: pct >= 100 ? c.success : c.gold }} />
        </div>

        <div className="flex flex-col gap-2">
          {Math.min(Number(liveBorrower?.savings || 0), liveLoan.amount) > 0 && (
            <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: c.paper, border: `1px solid ${c.line}` }}>
              <div>
                <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{borrower?.name || "Borrower"}'s savings</p>
                <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Covering {kes(Math.min(Number(liveBorrower?.savings || 0), liveLoan.amount))}</p>
              </div>
              <StatusChip status="accepted" />
            </div>
          )}
          {guarantors.map((g) => {
            const isSakonet = g.mode === "sakonet" || g.type === "sakonet";
            const member = members.find((m) => m.id === g.memberId || m.id === g.memberNo);
            return (
              <div key={g.name} className="rounded-xl p-3 flex items-center justify-between" style={{ 
                background: isSakonet ? c.sakonetSoft : c.paper, 
                border: `1px solid ${isSakonet ? c.sakonetLine : c.line}` 
              }}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{member?.name || g.name}</p>
                    {isSakonet && (
                      <span className="body flex items-center gap-1" style={{ background: c.sakonet, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20 }}>
                        <Globe2 size={9} /> {g.sacco || "External"}
                      </span>
                    )}
                    {!isSakonet && g.memberId && <span className="body" style={{ fontSize: 10.5, color: c.muted }}>{g.memberId}</span>}
                  </div>
                  <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Guaranteeing {kes(g.amount)}</p>
                </div>
                <StatusChip status={g.status} />
              </div>
            );
          })}
          {guarantors.length === 0 && (
            <p className="body" style={{ fontSize: 12.5, color: c.muted, padding: "10px 0" }}>No guarantors added yet.</p>
          )}
        </div>

        {guarantors.some((g) => g.mode === "sakonet" || g.type === "sakonet") && (
          <p className="body mt-4" style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5 }}>
            Mkulima SACCO never contacts external guarantors directly. SAKONET Network routes the request to their SACCO, which verifies and notifies them in their own app. Their decision returns from that SACCO through SAKONET Network.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {actionButtons}
      </div>
    </div>
  );
}

/* ---------------- Sakonet network view ---------------- */

function GuaranteeRequestsView() {
  const store = useSakonet();
  const { state, reviewGuarantorRequest, settleClaim } = store;
  const [reasonById, setReasonById] = useState({});
  const [errorById, setErrorById] = useState({});
  const requests = Object.values(state.requests).filter((r) => r.borrowerSacco === "MKU");
  // Guarantees Mkulima has extended to other SACCOs' borrowers — settlement of
  // a called guarantee draws on Mkulima's own float, so it belongs here, not on SAKONET.
  const guaranteesGiven = Object.values(state.guarantees).filter((g) => g.guarantorSacco === "MKU" && g.status === "claimed");

  const decide = (request, decision) => {
    const result = reviewGuarantorRequest(request.id, decision, reasonById[request.id] || "");
    if (!result.ok) setErrorById((x) => ({ ...x, [request.id]: result.error }));
    else setErrorById((x) => ({ ...x, [request.id]: "" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: c.goldSoft, border: `1px solid ${c.line}` }}>
        <ShieldCheck size={18} color={c.green} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.green }}>Mkulima SACCO staff decision queue</p>
          <p className="body" style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, marginTop: 3 }}>
            Review the borrower's outgoing guarantee request here. Approve to route it through SAKONET; decline to stop it before network routing. Declines require a reason.
          </p>
        </div>
      </div>
      {requests.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: c.panel, border: `1px solid ${c.line}` }}><p className="body" style={{ fontSize: 13, color: c.muted }}>No guarantee requests for Mkulima SACCO.</p></div>}
      {requests.map((request) => {
        const guarantorSacco = state.saccos[request.guarantorSacco]?.name || request.guarantorSacco;
        const isPending = request.stage === "submitted";
        return (
          <div key={request.id} className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{request.id}</p>
                <h3 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>{request.borrowerName} → {request.guarantorName}</h3>
                <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>{guarantorSacco} · {request.product || "Loan"} · {kes(request.amount)} guarantee</p>
              </div>
              <StatusChip status={getRequestStatus(request.stage)} />
            </div>
            {isPending ? (
              <div className="mt-4">
                <textarea value={reasonById[request.id] || ""} onChange={(e) => setReasonById((x) => ({ ...x, [request.id]: e.target.value }))} placeholder="Required only when declining — enter the reason..." className="body w-full rounded-xl" rows={3} style={{ padding: "10px 12px", fontSize: 12.5, border: `1px solid ${c.line}`, resize: "vertical" }} />
                {errorById[request.id] && <p className="body mt-2" style={{ fontSize: 11.5, color: c.danger }}>{errorById[request.id]}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => decide(request, "approve")} className="rounded-xl body flex items-center gap-2" style={{ padding: "10px 14px", background: c.success, color: "#fff", fontSize: 12.5, fontWeight: 700 }}><CircleCheck size={15} /> Approve & route</button>
                  <button onClick={() => decide(request, "decline")} className="rounded-xl body flex items-center gap-2" style={{ padding: "10px 14px", background: c.danger, color: "#fff", fontSize: 12.5, fontWeight: 700 }}><X size={15} /> Decline request</button>
                </div>
              </div>
            ) : request.declineReason ? (
              <div className="rounded-xl p-3 mt-4" style={{ background: c.dangerSoft }}>
                <p className="body" style={{ fontSize: 11, color: c.danger, fontWeight: 700 }}>Declined by {request.declinedBy || "SACCO staff"}</p>
                <p className="body" style={{ fontSize: 12, color: c.danger, marginTop: 3 }}>{request.declineReason}</p>
              </div>
            ) : null}
          </div>
        );
      })}

      {guaranteesGiven.length > 0 && (
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginBottom: 10 }}>Guarantees called against Mkulima SACCO's float</p>
          <div className="flex flex-col gap-3">
            {guaranteesGiven.map((g) => {
              const borrowerSacco = state.saccos[g.borrowerSacco]?.name || g.borrowerSacco;
              return (
                <div key={g.id} className="rounded-2xl p-4" style={{ background: c.dangerSoft }}>
                  <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.danger }}>{g.id} — {g.guarantorName} guaranteed {kes(g.amount)} for {borrowerSacco}</p>
                  <p className="body" style={{ fontSize: 11.5, color: c.danger, marginTop: 2 }}>The borrower's loan defaulted. Settling pays {kes(g.amount)} from Mkulima SACCO's own float to {borrowerSacco}.</p>
                  <button onClick={() => settleClaim(g.id)} className="rounded-lg body mt-3" style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, background: c.danger, color: "#fff" }}>
                    Settle from Mkulima SACCO's float
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SakonetView() {
  const store = useSakonet();
  const { state } = store;
  const requests = Object.values(state.requests);
  
  return (
    <div>
      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: c.sakonetSoft, border: `1px solid ${c.sakonetLine}` }}>
        <Globe2 size={18} color={c.sakonet} style={{ flexShrink: 0, marginTop: 1 }} />
        <p className="body" style={{ fontSize: 12.5, color: c.sakonet, lineHeight: 1.5 }}>
          Sakonet only ever talks to Mkulima SACCO — never to a guarantor at another SACCO directly. Every request below was
          verified against the target SACCO's own membership records before anything was shown to that member.
        </p>
      </div>
      <h3 className="disp mb-3" style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>Outgoing guarantee requests</h3>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.sakonetLine}` }}>
        <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: c.sakonetSoft, borderBottom: `1px solid ${c.sakonetLine}` }}>
              {["Request", "Borrower", "Guarantor", "SACCO", "Amount", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: c.sakonet, fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r, i) => {
              const borrower = members.find((m) => m.id === r.borrowerMemberNo);
              const saccoName = state.saccos[r.guarantorSacco]?.name || r.guarantorSacco;
              return (
                <tr key={r.id} style={{ background: i % 2 ? c.sakonetSoft : c.panel, borderBottom: `1px solid ${c.sakonetLine}` }}>
                  <td style={{ padding: "11px 14px", color: c.muted }}>{r.id}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{borrower?.name || r.borrowerMemberNo}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{r.guarantorName || "—"}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{saccoName}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{kes(r.amount)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <StatusChip status={getRequestStatus(r.stage)} />
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: c.muted }}>
                  No guarantee requests sent yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Shell ---------------- */
export default function MkulimaStaffDashboard() {
  const [nav, setNav] = useState("dashboard");
  const [openLoan, setOpenLoan] = useState(null);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "members", label: "Members", icon: Users },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "guarantees", label: "Guarantee requests", icon: ShieldCheck },
    { id: "sakonet", label: "Sakonet network", icon: Globe2 },
    { id: "reports", label: "Reports", icon: FileBarChart },
  ];

  const handleOpenLoan = (loan) => { setOpenLoan(loan); setNav("loans"); };

  return (
    <div className="min-h-screen w-full flex" style={{ background: c.paper, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <style>{fonts}</style>

      {/* Sidebar */}
      <div className="flex flex-col" style={{ width: 232, background: c.greenDeep, flexShrink: 0 }}>
        <div className="px-5 pt-6 pb-5">
          <p className="disp" style={{ fontSize: 19, fontWeight: 600, color: "#fff" }}>Mkulima</p>
          <p className="body" style={{ fontSize: 11, color: "#8FB39E", fontWeight: 600, letterSpacing: 0.3 }}>SACCO · staff portal</p>
        </div>
        <div className="flex flex-col gap-0.5 px-3">
          {navItems.map((item) => {
            const active = nav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { if (item.id === "sakonet") { window.history.pushState({}, "", "/sacco/network/MKU"); window.dispatchEvent(new PopStateEvent("popstate")); return; } setNav(item.id); if (item.id !== "loans") setOpenLoan(null); }}
                className="flex items-center gap-3 rounded-lg body"
                style={{ padding: "9px 12px", fontSize: 13, fontWeight: 500, color: active ? "#fff" : "#B7CBBE", background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto px-5 pb-6">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="body" style={{ fontSize: 11, color: "#8FB39E" }}>Logged in as</p>
            <p className="body" style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>Esther Nyokabi, Loan Officer</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${c.line}` }}>
          <h2 className="disp" style={{ fontSize: 21, fontWeight: 600, color: c.ink }}>
            {openLoan ? `${openLoan.borrower || openLoan.borrowerMemberNo}'s loan` : navItems.find((n) => n.id === nav)?.label}
          </h2>
          <button className="p-2 rounded-full" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <Bell size={16} color={c.ink} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {nav === "dashboard" && <DashboardView onOpenLoan={handleOpenLoan} />}
          {nav === "members" && <MembersView />}
          {nav === "loans" && (openLoan ? <LoanDetailView loan={openLoan} onBack={() => setOpenLoan(null)} /> : <LoansView onOpenLoan={setOpenLoan} />)}
          {nav === "guarantees" && <GuaranteeRequestsView />}
          {nav === "sakonet" && <SakonetView />}
          {nav === "reports" && <p className="body" style={{ fontSize: 13, color: c.muted }}>Reports aren't built yet — tell me what you'd like to see here.</p>}
        </div>
      </div>
    </div>
  );
}