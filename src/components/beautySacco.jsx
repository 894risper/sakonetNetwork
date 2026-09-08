import { useState } from "react";
import { useSakonet } from "./store";
import {
  LayoutGrid, Users, Wallet, Globe2, FileBarChart, Search, Bell,
  ChevronRight, ArrowUpRight, ArrowDownRight,
  X, Loader2, CircleCheck, CircleDashed, AlertTriangle,
  TrendingUp, ArrowLeft, ShieldCheck,
} from "lucide-react";

/* ---------------------------------------------------------------
   BEAUTY SACCO — staff / back-office dashboard
   This is the "SACCO B" side of the flow: the guarantor's SACCO.
   Light, cool orchid/fuchsia is Beauty SACCO's institutional palette
   (matches guarantor.jsx). Any figure or status that belongs to
   SAKONET (the inter-SACCO network) uses the separate slate-blue
   family so cross-SACCO activity is always visually distinct from
   Beauty SACCO's own book.
----------------------------------------------------------------- */

const c = {
  ink: "#332933",
  paper: "#FBF6FA",
  panel: "#FFFFFF",
  border: "#EEE2EC",
  teal: "#C07DBB",
  tealDeep: "#8C5A88",
  tealSoft: "#F8ECF6",
  gold: "#C79A5F",
  goldSoft: "#F6ECDB",
  muted: "#8A818A",
  danger: "#A6402A",
  dangerSoft: "#F3E1DB",
  success: "#2E7D4F",
  successSoft: "#E3EFE6",
  sakonet: "#2F5D8A",
  sakonetSoft: "#E9EFF6",
  sakonetLine: "#C7D6E8",
};

const fonts = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .disp { font-family: 'Spectral', serif; }
  .body { font-family: 'Manrope', sans-serif; }
`;

const kes = (n) => "KES " + n.toLocaleString("en-KE");
const shortDate = (iso) => new Date(iso).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });

/* ---------------- Member book for Beauty SACCO ---------------- */
const members = [
  { id: "BT-3390", name: "Phoebe Atieno", phone: "0722 341 908", joined: "2019-03-11", savings: 640000, shares: 320000, loanStatus: "None", exposure: 0 },
  { id: "BT-1001", name: "Daniel Kiptoo", phone: "0733 118 224", joined: "2020-07-02", savings: 240000, shares: 41000, loanStatus: "Active loan", exposure: 95000 },
  { id: "BT-1002", name: "Fatuma Ali", phone: "0711 902 456", joined: "2018-11-19", savings: 310000, shares: 52000, loanStatus: "None", exposure: 0 },
  { id: "BT-1003", name: "Esther Nduta", phone: "0798 220 331", joined: "2017-05-27", savings: 190000, shares: 28000, loanStatus: "None", exposure: 0 },
];

/* ---------------- Beauty SACCO members (with capacity) ---------------- */
const beautyMembers = [
  { id: "BT-3390", name: "Phoebe Atieno", phone: "0722 341 908", joined: "2019-03-11", savings: 640000, shares: 320000, loanStatus: "None", exposure: 0, capacity: 320000 },
  { id: "BT-1001", name: "Daniel Kiptoo", phone: "0733 118 224", joined: "2020-07-02", savings: 240000, shares: 41000, loanStatus: "Active loan", exposure: 95000, capacity: 150000 },
  { id: "BT-1002", name: "Fatuma Ali", phone: "0711 902 456", joined: "2018-11-19", savings: 310000, shares: 52000, loanStatus: "None", exposure: 0, capacity: 180000 },
  { id: "BT-1003", name: "Esther Nduta", phone: "0798 220 331", joined: "2017-05-27", savings: 190000, shares: 28000, loanStatus: "None", exposure: 0, capacity: 70000 },
];

/* ---------------- Helper function for button text ---------------- */
function getButtonText(liveLoan, isFullyCovered) {
  if (liveLoan.stage === "approved") return "Disburse loan";
  if (liveLoan.stage === "committee") return "Awaiting committee approval";
  if (isFullyCovered) return "Fully covered — advancing";
  return "Send to credit committee";
}

/* ---------------- Helper function for status ---------------- */
function getRequestStatus(stage) {
  if (stage === "locked") return "accepted";
  if (stage === "notified") return "awaiting_response";
  if (stage === "network_routed") return "sacco_review";
  if (stage === "beauty_sacco_review") return "beauty_staff_review";
  if (stage === "sacco_verified") return "sacco_verified";
  if (stage === "notified") return "awaiting_response";
  if (stage === "member_responded") return "decision_recorded";
  if (stage === "awaiting_sacco_confirmation") return "sacco_confirming";
  if (stage === "sacco_confirmed_accepted" || stage === "sacco_confirmation_received" || stage === "sacco_received_confirmation" || stage === "member_notified_by_mkulima") return "accepted";
  if (stage === "sacco_confirmed_declined" || stage === "sacco_confirmation_received_declined" || stage === "sacco_rejected" || stage === "rejected" || stage === "declined") return "rejected";
  if (stage === "verifying" || stage === "verified") return "verifying";
  if (stage === "rejected") return "rejected";
  return "submitted";
}

/* ---------------- Helper function for member status display ---------------- */
function getMemberStatusDisplay(member) {
  if (member.loanStatus === "Active loan") {
    return <span style={{ color: c.success, fontWeight: 600 }}>{member.loanStatus}</span>;
  }
  if (member.loanStatus === "None") {
    return <span style={{ color: c.muted }}>—</span>;
  }
  return <span style={{ color: c.ink, fontWeight: 500 }}>{member.loanStatus}</span>;
}

/* ---------------- Helper function for StatusChip ---------------- */
function getStatusChipText(status) {
  if (status === "accepted") return "Accepted";
  if (status === "rejected") return "Rejected";
  if (status === "sacco_review") return "Awaiting Beauty delivery";
  if (status === "beauty_staff_review") return "Beauty staff review";
  if (status === "sacco_verified") return "Verified — member notified";
  if (status === "decision_recorded") return "Decision received by Beauty";
  if (status === "sacco_confirming") return "Member accepted — awaiting staff confirmation";
  if (status === "verifying") return "Verifying at SACCO";
  if (status === "delivered" || status === "awaiting_response") return "Awaiting member response";
  if (status === "submitted") return "Submitted";
  return "Pending";
}

/* ---------------- small UI atoms ---------------- */
function StagePill({ stage }) {
  const map = {
    guarantors: { bg: c.goldSoft, fg: "#7A5C16", label: "Awaiting guarantors" },
    active: { bg: c.successSoft, fg: c.success, label: "Active" },
    arrears: { bg: c.dangerSoft, fg: c.danger, label: "In arrears" },
    review: { bg: c.tealSoft, fg: c.muted, label: "Committee review" },
    committee: { bg: c.tealSoft, fg: c.muted, label: "Committee review" },
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
  const label = getStatusChipText(status);
  const style = (() => {
    if (status === "accepted") return { color: c.success };
    if (status === "rejected") return { color: c.danger };
    if (status === "verifying" || status === "delivered" || status === "awaiting_response" || status === "sacco_confirming") return { color: c.sakonet };
    return { color: c.muted };
  })();

  let icon;
  if (status === "accepted") {
    icon = <CircleCheck size={13} />;
  } else if (status === "rejected") {
    icon = <X size={13} />;
  } else if (status === "verifying" || status === "delivered" || status === "awaiting_response" || status === "sacco_confirming") {
    icon = <Loader2 size={13} className="animate-spin" />;
  } else {
    icon = <CircleDashed size={13} />;
  }

  return (
    <span className="body flex items-center gap-1" style={{ ...style, fontSize: 12, fontWeight: 600 }}>
      {icon} {label}
    </span>
  );
}

function KpiCard({ label, value, delta, up, icon: Icon }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
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
  const storeLoans = Object.values(state.loans).filter((l) => l.borrowerSacco === "BTY");
  const activeLoans = storeLoans.filter((l) => l.stage === "active" || l.stage === "disbursed").length;
  const inArrears = storeLoans.filter((l) => l.stage === "arrears" || l.repayment === "arrears").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Members" value={members.length} icon={Users} />
        <KpiCard label="Total savings & shares" value={kes(totalSavings + totalShares)} delta="+3.2% this quarter" up icon={TrendingUp} />
        <KpiCard label="Active loans" value={activeLoans} icon={Wallet} />
        <KpiCard label="In arrears" value={inArrears} delta={inArrears > 0 ? "Needs attention" : undefined} up={false} icon={AlertTriangle} />
      </div>

      <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp" style={{ fontSize: 16, fontWeight: 600, color: c.ink }}>Loans on this SACCO</h3>
          <span className="body" style={{ fontSize: 11.5, color: c.muted }}>{storeLoans.length} loan(s)</span>
        </div>
        {storeLoans.slice(0, 6).map((loan) => {
          const borrower = members.find((m) => m.id === loan.borrowerMemberNo);
          return (
            <button key={loan.id} onClick={() => onOpenLoan(loan)} className="w-full text-left rounded-xl p-4 mb-2 flex items-center justify-between" style={{ background: c.paper, border: `1px solid ${c.border}` }}>
              <div>
                <p className="body" style={{ fontSize: 13.5, fontWeight: 700, color: c.ink }}>{borrower?.name || loan.borrowerMemberNo} — {loan.product}</p>
                <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{kes(loan.amount)} · {loan.stage === "repaid" ? "Repaid" : loan.repayment === "arrears" ? "In arrears" : loan.stage}</p>
              </div>
              <ChevronRight size={17} color={c.muted} />
            </button>
          );
        })}
        {storeLoans.length === 0 && <p className="body" style={{ fontSize: 13, color: c.muted, textAlign: "center", padding: "20px 0" }}>No loans recorded yet.</p>}
      </div>

    </div>
  );
}

/* ---------------- Members ---------------- */
function MembersView() {
  const [q, setQ] = useState("");
  const filtered = beautyMembers.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.id.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
          <Search size={15} color={c.muted} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or member number" className="body flex-1 outline-none" style={{ fontSize: 13, background: "transparent" }} />
        </div>
        <span className="body" style={{ fontSize: 12, color: c.muted }}>{filtered.length} members</span>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
        <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: c.paper, borderBottom: `1px solid ${c.border}` }}>
              {["Member", "No.", "Phone", "Joined", "Savings", "Shares", "Capacity", "Status"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: c.muted, fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.border}` }}>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{m.name}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{m.id}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{m.phone}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{shortDate(m.joined)}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(m.savings)}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(m.shares)}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(m.capacity || 0)}</td>
                <td style={{ padding: "11px 14px" }}>{getMemberStatusDisplay(m)}</td>
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
  // Beauty only manages disbursement/repayment/default for loans it originated.
  // A loan where Beauty is only the guarantor SACCO belongs to the other SACCO's book.
  const storeLoans = Object.values(state.loans).filter((l) => l.borrowerSacco === "BTY");
  
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
      <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: c.paper, borderBottom: `1px solid ${c.border}` }}>
            {["Loan", "Borrower", "Product", "Amount", "Status", ""].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, color: c.muted, fontSize: 11.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {storeLoans.map((l, i) => {
            const borrower = beautyMembers.find((m) => m.id === l.borrowerMemberNo) || members.find((m) => m.id === l.borrowerMemberNo);
            return (
              <tr key={l.id} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.border}` }}>
                <td style={{ padding: "11px 14px", color: c.muted }}>{l.id}</td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{borrower?.name || l.borrowerMemberNo}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{l.product}</td>
                <td style={{ padding: "11px 14px", color: c.ink }}>{kes(l.amount)}</td>
                <td style={{ padding: "11px 14px" }}><StagePill stage={l.stage} /></td>
                <td style={{ padding: "11px 14px" }}>
                  <button onClick={() => onOpenLoan(l)} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.teal, fontWeight: 600 }}>
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

function LoanDetailView({ loan, onBack }) {
  const store = useSakonet();
  const { state, disburseLoan, simulateDefault, simulateRepaid } = store;
  
  const liveLoan = state.loans[loan.id] || loan;
  const guarantors = liveLoan.guarantors || [];
  
  const covered = guarantors.filter((g) => g.status === "accepted").reduce((s, g) => s + g.amount, 0);
  const pct = Math.min(100, Math.round((covered / liveLoan.amount) * 100));
  const isFullyCovered = pct >= 100;
  
  const borrower = beautyMembers.find((m) => m.id === liveLoan.borrowerMemberNo) || members.find((m) => m.id === liveLoan.borrowerMemberNo);
  const isDisbursed = liveLoan.stage === "disbursed";

  const buttonText = getButtonText(liveLoan, isFullyCovered);

  const handleDisburse = () => {
    if (liveLoan.stage === "approved") {
      disburseLoan(liveLoan.id);
    } else if (isFullyCovered) {
      alert("Loan is fully covered! It will advance to committee review automatically.");
    }
  };

  return (
    <div>
      <button onClick={onBack} className="body flex items-center gap-1 mb-4" style={{ fontSize: 12.5, color: c.muted, fontWeight: 600 }}>
        <ArrowLeft size={14} /> Back to loans
      </button>

      <div className="rounded-2xl p-5 mb-5" style={{ background: c.tealDeep }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="body" style={{ fontSize: 12, color: c.tealSoft }}>{liveLoan.id} · {liveLoan.product}</p>
            <p className="disp" style={{ fontSize: 24, fontWeight: 600, color: "#fff", marginTop: 4 }}>
              {borrower?.name || liveLoan.borrower || liveLoan.borrowerMemberNo}
            </p>
          </div>
          <StagePill stage={liveLoan.stage} />
        </div>
        <div className="flex gap-8 mt-5">
          <div><p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Amount</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{kes(liveLoan.amount)}</p></div>
          <div><p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Term</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{liveLoan.term} months</p></div>
          <div><p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Purpose</p><p className="body" style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{liveLoan.purpose || "—"}</p></div>
        </div>
        {liveLoan.repayment === "arrears" && (
          <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: c.dangerSoft }}>
            <AlertTriangle size={16} color={c.danger} />
            <span className="body" style={{ fontSize: 12.5, color: c.danger, fontWeight: 600 }}>Loan is in arrears</span>
          </div>
        )}
        {liveLoan.repayment === "repaid" && (
          <div className="mt-4 rounded-xl p-3 flex items-center gap-2" style={{ background: c.successSoft }}>
            <CircleCheck size={16} color={c.success} />
            <span className="body" style={{ fontSize: 12.5, color: c.success, fontWeight: 600 }}>Loan has been fully repaid</span>
          </div>
        )}
      </div>

      <div className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
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
          {guarantors.map((g) => {
            const isSakonet = g.mode === "sakonet" || g.type === "sakonet";
            const member = beautyMembers.find((m) => m.id === g.memberId || m.id === g.memberNo) || members.find((m) => m.id === g.memberId || m.id === g.memberNo);
            return (
              <div key={g.name} className="rounded-xl p-3 flex items-center justify-between" style={{ 
                background: isSakonet ? c.sakonetSoft : c.paper, 
                border: `1px solid ${isSakonet ? c.sakonetLine : c.border}` 
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
            SAKONET routes the request to Beauty SACCO. Beauty verifies the member and capacity, then Beauty SACCO sends the request to Phoebe. Phoebe's decision returns to Beauty SACCO first, then Beauty sends the official confirmation through SAKONET.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        {!isDisbursed && liveLoan.stage !== "disbursed" && (
          <button 
            disabled={!isFullyCovered} 
            onClick={handleDisburse}
            className="flex-1 rounded-xl body"
            style={{ 
              padding: "11px 20px", 
              fontSize: 13, 
              fontWeight: 600, 
              background: !isFullyCovered ? c.border : c.teal, 
              color: !isFullyCovered ? c.muted : "#fff" 
            }}
          >
            {buttonText}
          </button>
        )}
        
        {isDisbursed && (
          <>
            <button 
              onClick={() => simulateDefault(liveLoan.id)}
              disabled={liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid"}
              className="flex-1 rounded-xl body"
              style={{ 
                padding: "11px 20px", 
                fontSize: 13, 
                fontWeight: 600, 
                background: (liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.border : c.panel,
                color: (liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.muted : c.danger,
                border: `1px solid ${(liveLoan.repayment === "arrears" || liveLoan.repayment === "repaid") ? c.border : c.danger}`
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
                background: liveLoan.repayment === "repaid" ? c.border : c.panel,
                color: liveLoan.repayment === "repaid" ? c.muted : c.success,
                border: `1px solid ${liveLoan.repayment === "repaid" ? c.border : c.success}`
              }}
            >
              Simulate full repayment
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Sakonet network view ---------------- */

function GuaranteeRequestsView() {
  const store = useSakonet();
  const { state, reviewBeautyIncomingRequest, settleClaim } = store;
  const [reasonById, setReasonById] = useState({});
  const [errorById, setErrorById] = useState({});
  const requests = Object.values(state.requests).filter((r) => r.guarantorSacco === "BTY");
  const staffReviewPending = requests.filter((r) => r.stage === "beauty_sacco_review");
  const decidedRequests = requests.filter((r) =>
    r.stage === "rejected" || r.stage === "declined" ||
    r.stage.startsWith("sacco_confirm") || r.stage === "sacco_received_confirmation" ||
    r.stage === "member_notified_by_mkulima"
  );
  const guaranteesGiven = Object.values(state.guarantees).filter((g) => g.guarantorSacco === "BTY" && g.status === "claimed");

  const decideInitialReview = (request, decision) => {
    const result = reviewBeautyIncomingRequest(request.id, decision, reasonById[request.id] || "");
    if (!result.ok) setErrorById((x) => ({ ...x, [request.id]: result.error }));
    else setErrorById((x) => ({ ...x, [request.id]: "" }));
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: c.tealSoft, border: `1px solid ${c.sakonetLine}` }}>
        <ShieldCheck size={18} color={c.teal} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.teal }}>Beauty SACCO staff decision queue</p>
          <p className="body" style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, marginTop: 3 }}>
            Beauty SACCO receives the request after Mkulima staff approve it. First, Beauty staff verify the named member and capacity. Once the member accepts, the acceptance relays to SAKONET and Mkulima SACCO automatically — no second staff confirmation needed.
          </p>
        </div>
      </div>

      {staffReviewPending.length > 0 && (
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginBottom: 10 }}>Incoming requests awaiting Beauty staff review</p>
          <div className="flex flex-col gap-3">
            {staffReviewPending.map((request) => {
              const borrowerSacco = state.saccos[request.borrowerSacco]?.name || request.borrowerSacco;
              const member = (state.membersBySacco.BTY || []).find((m) => m.memberNo === request.guarantorMemberNo);
              return (
                <div key={request.id} className="rounded-2xl p-5" style={{ background: c.panel, border: `2px solid ${c.sakonetLine}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{request.id}</p>
                      <h3 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>{request.guarantorName} · {kes(request.amount)}</h3>
                      <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>From {borrowerSacco} · {request.product || "Loan"} · {request.loanId}</p>
                    </div>
                    <StatusChip status="beauty_staff_review" />
                  </div>
                  <div className="rounded-xl p-3 mt-4" style={{ background: c.sakonetSoft }}>
                    <p className="body" style={{ fontSize: 11.5, color: c.muted }}>
                      Verify the named member and available guarantee capacity before the member is notified.
                    </p>
                    <p className="body" style={{ fontSize: 12, color: c.ink, marginTop: 5, fontWeight: 700 }}>
                      Member: {member?.name || "Not found"} · Available capacity: {kes(Number(member?.capacity || 0))}
                    </p>
                  </div>
                  <textarea
                    value={reasonById[request.id] || ""}
                    onChange={(e) => setReasonById((x) => ({ ...x, [request.id]: e.target.value }))}
                    placeholder="Required only when declining — enter the reason..."
                    className="body w-full rounded-xl mt-3"
                    rows={2}
                    style={{ padding: "10px 12px", fontSize: 12.5, border: `1px solid ${c.border}`, resize: "vertical" }}
                  />
                  {errorById[request.id] && <p className="body mt-2" style={{ fontSize: 11.5, color: c.danger }}>{errorById[request.id]}</p>}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => decideInitialReview(request, "approve")} className="rounded-xl body flex items-center gap-2" style={{ padding: "10px 14px", background: c.success, color: "#fff", fontSize: 12.5, fontWeight: 700 }}><CircleCheck size={15} /> Approve & notify member</button>
                    <button onClick={() => decideInitialReview(request, "decline")} className="rounded-xl body flex items-center gap-2" style={{ padding: "10px 14px", background: c.danger, color: "#fff", fontSize: 12.5, fontWeight: 700 }}><X size={15} /> Decline request</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {staffReviewPending.length === 0 && decidedRequests.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: c.panel, border: `1px solid ${c.border}` }}><p className="body" style={{ fontSize: 13, color: c.muted }}>Nothing to review yet. Requests appear here once Mkulima SACCO routes one to a Beauty SACCO member.</p></div>
      )}

      {decidedRequests.length > 0 && (
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginBottom: 10 }}>Member decisions</p>
          <div className="flex flex-col gap-3">
            {decidedRequests.map((request) => {
              const borrowerSacco = state.saccos[request.borrowerSacco]?.name || request.borrowerSacco;
              return (
                <div key={request.id} className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{request.id}</p>
                      <h3 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>{request.guarantorName} · {kes(request.amount)}</h3>
                      <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>{borrowerSacco} · {request.product || "Loan"} · {request.loanId}</p>
                    </div>
                    <StatusChip status={getRequestStatus(request.stage)} />
                  </div>
                  {getRequestStatus(request.stage) === "accepted" && (
                    <p className="body mt-3" style={{ fontSize: 11.5, color: c.success }}>
                      {request.guarantorName} accepted — relayed to SAKONET and {borrowerSacco} automatically.
                    </p>
                  )}
                  {request.declineReason && (
                    <div className="rounded-xl p-3 mt-4" style={{ background: c.dangerSoft }}>
                      <p className="body" style={{ fontSize: 11, color: c.danger, fontWeight: 700 }}>Declined by {request.declinedBy || "SACCO staff"}</p>
                      <p className="body" style={{ fontSize: 12, color: c.danger, marginTop: 3 }}>{request.declineReason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {guaranteesGiven.length > 0 && (
        <div>
          <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink, marginBottom: 10 }}>Guarantees called against Beauty SACCO's float</p>
          <div className="flex flex-col gap-3">
            {guaranteesGiven.map((g) => {
              const borrowerSacco = state.saccos[g.borrowerSacco]?.name || g.borrowerSacco;
              return (
                <div key={g.id} className="rounded-2xl p-4" style={{ background: c.dangerSoft }}>
                  <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.danger }}>{g.id} — {g.guarantorName} guaranteed {kes(g.amount)} for {borrowerSacco}</p>
                  <p className="body" style={{ fontSize: 11.5, color: c.danger, marginTop: 2 }}>The borrower's loan defaulted. Settling pays {kes(g.amount)} from Beauty SACCO's own float to {borrowerSacco}.</p>
                  <button onClick={() => settleClaim(g.id)} className="rounded-lg body mt-3" style={{ padding: "8px 14px", fontSize: 12, fontWeight: 700, background: c.danger, color: "#fff" }}>
                    Settle from Beauty SACCO's float
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
  // Only requests that have actually left the borrower's SACCO and
  // reached Sakonet belong here — "submitted"/"returned" ones are still
  // sitting with the borrower's own SACCO awaiting their manual review.
  const requests = Object.values(state.requests).filter(
    (r) => r.guarantorSacco === "BTY" && r.stage !== "submitted" && r.stage !== "returned"
  );
  
  return (
    <div>
      <div className="rounded-2xl p-4 mb-5 flex items-start gap-3" style={{ background: c.sakonetSoft, border: `1px solid ${c.sakonetLine}` }}>
        <Globe2 size={18} color={c.sakonet} style={{ flexShrink: 0, marginTop: 1 }} />
        <p className="body" style={{ fontSize: 12.5, color: c.sakonet, lineHeight: 1.5 }}>
          SAKONET Network only communicates with Beauty SACCO — never to a guarantor at another SACCO directly. Every request below was
          verified against the target SACCO's own membership records before anything was shown to that member.
        </p>
      </div>
      <h3 className="disp mb-3" style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>Incoming & outgoing guarantee requests</h3>
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
              const saccoName = state.saccos[r.borrowerSacco]?.name || r.borrowerSacco;
              const status = getRequestStatus(r.stage);
              return (
                <tr key={r.id} style={{ background: i % 2 ? c.sakonetSoft : c.panel, borderBottom: `1px solid ${c.sakonetLine}` }}>
                  <td style={{ padding: "11px 14px", color: c.muted }}>{r.id}</td>
                  <td style={{ padding: "11px 14px", fontWeight: 600, color: c.ink }}>{r.borrowerName || r.borrowerMemberNo}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{r.guarantorName || "—"}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{saccoName}</td>
                  <td style={{ padding: "11px 14px", color: c.ink }}>{kes(r.amount)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <StatusChip status={status} />
                  </td>
                </tr>
              );
            })}
            {requests.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: c.muted }}>
                  No guarantee requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------- Reports ---------------- */
function ReportsView() {
  return (
    <div className="rounded-2xl p-6 text-center" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
      <FileBarChart size={32} color={c.muted} style={{ margin: "0 auto 12px" }} />
      <p className="body" style={{ fontSize: 14, color: c.muted }}>Reports module coming soon</p>
      <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 4 }}>Tell me what reports you'd like to see.</p>
    </div>
  );
}

/* ---------------- Shell ---------------- */
export default function BeautyStaffDashboard() {
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
    <div className="min-h-screen w-full flex" style={{ background: c.paper, fontFamily: "'Manrope', sans-serif" }}>
      <style>{fonts}</style>

      {/* Sidebar */}
      <div className="flex flex-col" style={{ width: 232, background: c.tealDeep, flexShrink: 0 }}>
        <div className="px-5 pt-6 pb-5">
          <p className="disp" style={{ fontSize: 19, fontWeight: 600, color: "#fff" }}>Beauty</p>
          <p className="body" style={{ fontSize: 11, color: "#EAD9E7", fontWeight: 600, letterSpacing: 0.3 }}>SACCO · staff portal</p>
        </div>
        <div className="flex flex-col gap-0.5 px-3">
          {navItems.map((item) => {
            const active = nav === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { if (item.id === "sakonet") { window.history.pushState({}, "", "/sacco/network/BTY"); window.dispatchEvent(new PopStateEvent("popstate")); return; } setNav(item.id); if (item.id !== "loans") setOpenLoan(null); }}
                className="flex items-center gap-3 rounded-lg body"
                style={{ padding: "9px 12px", fontSize: 13, fontWeight: 500, color: active ? "#fff" : "#D9C0D6", background: active ? "rgba(255,255,255,0.08)" : "transparent" }}
              >
                <Icon size={16} /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="mt-auto px-5 pb-6">
          <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
            <p className="body" style={{ fontSize: 11, color: "#EAD9E7" }}>Logged in as</p>
            <p className="body" style={{ fontSize: 12.5, fontWeight: 600, color: "#fff" }}>Halima Juma, Loan Officer</p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-8 py-5" style={{ borderBottom: `1px solid ${c.border}` }}>
          <h2 className="disp" style={{ fontSize: 21, fontWeight: 600, color: c.ink }}>
            {openLoan ? `${openLoan.borrower || openLoan.borrowerMemberNo}'s loan` : navItems.find((n) => n.id === nav)?.label}
          </h2>
          <button className="p-2 rounded-full" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
            <Bell size={16} color={c.ink} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {nav === "dashboard" && <DashboardView onOpenLoan={handleOpenLoan} />}
          {nav === "members" && <MembersView />}
          {nav === "loans" && (openLoan ? <LoanDetailView loan={openLoan} onBack={() => setOpenLoan(null)} /> : <LoansView onOpenLoan={setOpenLoan} />)}
          {nav === "guarantees" && <GuaranteeRequestsView />}
          {nav === "sakonet" && <SakonetView />}
          {nav === "reports" && <ReportsView />}
        </div>
      </div>
    </div>
  );
}