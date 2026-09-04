import { useState } from "react";
import { useSakonet } from "./store";
import {
  LayoutGrid, Building2, GitBranch, ShieldCheck, ScrollText, Plus, Wallet,
  ChevronRight, ArrowLeft, Lock, Unlock, CheckCircle2, XCircle,
  Loader2, AlertTriangle, Landmark, Bell, X, Users, ArrowUpRight, ArrowDownLeft, TrendingUp,
} from "lucide-react";

/* -----------------------------------------------------------------
   SAKONET — network operator console.
   Now connected to the shared store via useSakonet().
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

/* ================= SIDEBAR ================= */
function Sidebar({ nav, setNav }) {
  const items = [
    { id: "dashboard", label: "Network dashboard", icon: LayoutGrid },
    { id: "saccos", label: "SACCOs & float", icon: Building2 },
    { id: "requests", label: "Guarantee requests", icon: GitBranch },
    { id: "loans", label: "Loans management", icon: Wallet },
    { id: "guarantees", label: "Guarantees & claims", icon: ShieldCheck },
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
  const requests = Object.values(state.requests);
  const pendingRequests = requests.filter((r) => !["member_notified_by_mkulima", "rejected"].includes(r.stage)).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="SACCOs onboarded" value={saccos.length} icon={Building2} />
        <KpiCard label="Total network float" value={kes(totalFloat)} icon={Landmark} />
        <KpiCard label="Committed float" value={kes(lockedFloat)} icon={Lock} tone={c.gold} />
        <KpiCard label="Available float" value={kes(availableFloat)} icon={Unlock} tone={c.success} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Active guarantees" value={activeGuarantees} icon={ShieldCheck} />
        <KpiCard label="Guarantees claimed" value={claims.length} icon={AlertTriangle} tone={c.danger} />
        <KpiCard label="Settled volume" value={kes(settledVolume)} icon={CheckCircle2} tone={c.success} />
      </div>

      <div className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="disp" style={{ fontSize: 15, fontWeight: 700, color: c.ink }}>SACCO float positions</h3>
          <button onClick={() => setNav("saccos")} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>
            Manage <ChevronRight size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {saccos.map((s) => (
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
            <h3 className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Demo network setup</h3>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>Mkulima, Beauty, Jenga and Baraka are already onboarded network participants for the demo. GT10 is onboarded live during the presentation, then becomes the SACCO login used to view the network data.</p>
          </div>
          <Pill tone="neutral">5 network SACCOs</Pill>
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
function OnboardModal({ onClose, onCreate, onOpenNetwork }) {
  const [form, setForm] = useState({ name: "GT10 SACCO", reg: "GT10-001", contact: "GT10 Administrator", email: "admin@gt10sacco.co.ke", phone: "0700 100 010" });
  const [checks, setChecks] = useState([]);
  const [done, setDone] = useState(false);
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const canSubmit = form.name && form.reg && form.contact && form.email && form.phone;

  const runVerification = () => {
    const steps = ["SACCO details verified", "Registration number verified", "Integration endpoint tested", "Network agreement accepted", "KES 1,000,000 float confirmed"];
    setChecks([]);
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
              ["SACCO name", "name", "e.g. Nyota SACCO"],
              ["Registration number", "reg", "SACCO-00XXXX"],
              ["Contact person", "contact", "Full name"],
              ["Email", "email", "admin@sacco.co.ke"],
              ["Phone", "phone", "07XXXXXXXX"],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <p className="body" style={{ fontSize: 11.5, fontWeight: 600, color: c.muted, marginBottom: 4 }}>{label}</p>
                <input value={form[key]} onChange={set(key)} placeholder={ph} className="body w-full rounded-lg" style={{ padding: "9px 12px", fontSize: 13, border: `1px solid ${c.line}`, outline: "none" }} />
              </div>
            ))}
            <div className="rounded-xl p-3 mt-1" style={{ background: c.goldSoft }}>
              <p className="body" style={{ fontSize: 12, fontWeight: 700, color: "#7A5C16" }}>Required guarantee float: {kes(1000000)}</p>
              <p className="body" style={{ fontSize: 11, color: "#7A5C16", marginTop: 2 }}>Backs every guarantee this SACCO's members make across the network.</p>
            </div>
            <button
              disabled={!canSubmit}
              onClick={runVerification}
              className="w-full rounded-xl body mt-2"
              style={{ padding: "11px 0", fontSize: 13.5, fontWeight: 700, background: canSubmit ? c.primary : c.line, color: "#fff" }}
            >
              Submit onboarding request
            </button>
          </div>
        )}

        {checks.length > 0 && (
          <div className="flex flex-col gap-2">
            {["SACCO details verified", "Registration number verified", "Integration endpoint tested", "Network agreement accepted", "KES 1,000,000 float confirmed"].map((s) => (
              <div key={s} className="flex items-center gap-2">
                {checks.includes(s) ? <CheckCircle2 size={15} color={c.success} /> : <Loader2 size={15} color={c.muted} className="animate-spin" />}
                <span className="body" style={{ fontSize: 12.5, color: c.ink }}>{s}</span>
              </div>
            ))}
            {done && (
              <>
                {!created && <button
                  onClick={() => { const result = onCreate(form); if (result?.ok === false) { setError(result.error); return; } setCreated(result.sacco); }}
                  className="w-full rounded-xl body mt-3"
                  style={{ padding: "11px 0", fontSize: 13.5, fontWeight: 700, background: c.success, color: "#fff" }}
                >
                  Activate {form.name} on Sakonet
                </button>}
                {error && <p className="body" style={{ fontSize: 11.5, color: c.danger, marginTop: 8 }}>{error}</p>}
                {created && (
                  <div className="rounded-xl p-4 mt-3" style={{ background: c.successSoft, border: `1px solid #BBD8C4` }}>
                    <p className="body" style={{ fontSize: 12, fontWeight: 700, color: c.success }}>SACCO activated successfully</p>
                    <p className="body" style={{ fontSize: 11.5, color: c.ink, marginTop: 5 }}>{created.name} · {created.code}</p>
                    <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Network PIN</p>
                    <p className="mono" style={{ fontSize: 22, fontWeight: 700, color: c.primaryDeep, letterSpacing: 3 }}>{created.networkPin}</p>
                    <p className="body" style={{ fontSize: 10.5, color: c.muted, marginTop: 4 }}>Give this PIN only to the authorised SACCO system administrator. It authenticates SACCO-to-SAKONET communication.</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={onClose} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: c.paper, color: c.ink, border: `1px solid ${c.line}` }}>Done</button>
                      <button onClick={() => onOpenNetwork(created.code)} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: c.primaryDeep, color: "#fff" }}>Continue to SACCO login</button>
                    </div>
                  </div>
                )}
              </>
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
  const { state } = store;
  const [selected, setSelected] = useState(null);
  const saccos = Object.values(state.saccos).filter((s) => s.onboarded === true);
  const pending = Object.values(state.saccos).filter((s) => !s.onboarded);

  if (selected) return <SaccoDetail sacco={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <p className="body" style={{ fontSize: 12, color: c.muted }}>Jenga and Baraka are available as onboarded demo SACCOs so the presenter can switch between their network views. GT10 is kept pending until it is added during the presentation.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl px-3 py-2" style={{ background: c.successSoft, border: `1px solid #BBD8C4` }}>
            <p className="body" style={{ fontSize: 11.5, color: c.success, fontWeight: 700 }}>{saccos.length} onboarded SACCOs</p>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Demo network</p>
          </div>
          <button onClick={onOnboard} className="body rounded-xl" style={{ padding: "9px 13px", fontSize: 12, fontWeight: 700, background: c.primaryDeep, color: "#fff" }}>+ Add new SACCO</button>
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c.line}` }}>
        <table className="w-full body" style={{ fontSize: 12.5, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: c.paper, borderBottom: `1px solid ${c.line}` }}>
              {["SACCO", "Contact", "Total float", "Committed", "Available", "Status", ""].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, color: c.muted, fontSize: 11.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {saccos.map((s, i) => (
              <tr key={s.code} style={{ background: i % 2 ? c.paper : c.panel, borderBottom: `1px solid ${c.line}` }}>
                <td style={{ padding: "11px 14px", fontWeight: 700, color: c.ink }}>{s.name}</td>
                <td style={{ padding: "11px 14px", color: c.muted }}>{s.contact}</td>
                <td style={{ padding: "11px 14px", color: c.ink }} className="mono">{kes(s.totalFloat)}</td>
                <td style={{ padding: "11px 14px", color: c.gold }} className="mono">{kes(s.locked)}</td>
                <td style={{ padding: "11px 14px", color: c.success }} className="mono">{kes(s.totalFloat - s.locked)}</td>
                <td style={{ padding: "11px 14px" }}><Pill tone="active">Active</Pill></td>
                <td style={{ padding: "11px 14px" }}>
                  <button onClick={() => setSelected(s)} className="body flex items-center gap-1" style={{ fontSize: 12, color: c.primary, fontWeight: 700 }}>Open <ChevronRight size={13} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pending.map((s) => (
        <div key={s.code} className="rounded-2xl p-5 mt-5" style={{ background: c.primarySoft, border: `1px solid #C7D6E8` }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>{s.name} · not yet onboarded</p>
              <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>For the presentation, use <strong>+ Add new SACCO</strong> to add GT10. The form is pre-filled so the presenter only needs to review and submit it.</p>
            </div>
            <Pill tone="pending">Pending</Pill>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================= GUARANTEE REQUESTS ================= */
function RequestsView() {
  const store = useSakonet();
  const { state } = store;
  const requests = Object.values(state.requests);
  
  return (
    <div className="flex flex-col gap-5">
      {requests.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
          <p className="body" style={{ fontSize: 13, color: c.muted }}>No guarantee requests yet. Submit one from the Mkulima Member App.</p>
        </div>
      )}
      
      {requests.map((request) => {
        const borrowerSacco = state.saccos[request.borrowerSacco]?.name || request.borrowerSacco;
        const guarantorSacco = state.saccos[request.guarantorSacco]?.name || request.guarantorSacco;
        const loan = state.loans[request.loanId];
        
        let stageMessage = null;
        if (request.stage === "member_notified_by_mkulima" || request.stage === "sacco_received_confirmation") {
          stageMessage = (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: c.successSoft }}>
              <Lock size={15} color={c.success} />
              <span className="body" style={{ fontSize: 12.5, color: c.success, fontWeight: 600 }}>
                {kes(request.amount)} locked against {guarantorSacco}'s float. Guarantee active.
              </span>
            </div>
          );
        } else if (request.stage === "rejected") {
          stageMessage = (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: c.dangerSoft }}>
              <XCircle size={15} color={c.danger} />
              <span className="body" style={{ fontSize: 12.5, color: c.danger, fontWeight: 600 }}>
                Declined — no float reserved. {borrowerSacco} needs a different guarantor.
              </span>
            </div>
          );
        } else if (request.stage === "notified") {
          stageMessage = (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: c.goldSoft }}>
              <Loader2 size={15} className="animate-spin" color="#7A5C16" />
              <span className="body" style={{ fontSize: 12.5, color: "#7A5C16", fontWeight: 600 }}>
                Awaiting {request.guarantorName}'s response via {guarantorSacco}'s app.
              </span>
            </div>
          );
        } else if (request.stage === "verifying" || request.stage === "verified") {
          stageMessage = (
            <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: c.primarySoft }}>
              <Loader2 size={15} className="animate-spin" color={c.primary} />
              <span className="body" style={{ fontSize: 12.5, color: c.primary, fontWeight: 600 }}>
                Verifying {request.guarantorName} with {guarantorSacco}...
              </span>
            </div>
          );
        }
        
        return (
          <div key={request.id} className="rounded-2xl p-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="mono" style={{ fontSize: 11, color: c.muted }}>{request.id}</p>
                <h3 className="disp" style={{ fontSize: 16, fontWeight: 700, color: c.ink }}>
                  {request.borrowerName || "Member"} → {request.guarantorName || "Member"}
                </h3>
              </div>
              <StageChip stage={request.stage} />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl p-3" style={{ background: c.paper }}>
                <p className="body" style={{ fontSize: 11, color: c.muted }}>Borrower</p>
                <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{request.borrowerName || "Member"} · {borrowerSacco}</p>
                <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>{loan?.product || "Loan"} · {request.loanId} · {kes(request.loanAmount || loan?.amount || 0)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: c.paper }}>
                <p className="body" style={{ fontSize: 11, color: c.muted }}>Guarantor</p>
                <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{request.guarantorName || "Member"} · {guarantorSacco}</p>
                <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Requested guarantee {kes(request.amount)}</p>
              </div>
            </div>

            {stageMessage}
          </div>
        );
      })}
    </div>
  );
}

/* ================= LOANS MANAGEMENT ================= */
function LoansManagementView() {
  const store = useSakonet();
  const { state } = store;
  const [openId, setOpenId] = useState(null);
  const loans = Object.values(state.loans).sort((a, b) => String(b.id).localeCompare(String(a.id)));

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
          Network-wide visibility from external loan application, SACCO review and guarantor acceptance through disbursement, repayment, default and guarantee settlement. Disbursement, repayment and default are actioned by the borrower's own SACCO — not from here.
        </p>
      </div>

      {loans.length === 0 && <div className="rounded-2xl p-8 text-center" style={{ background: c.panel, border: `1px solid ${c.line}` }}><p className="body" style={{ fontSize: 13, color: c.muted }}>No loans have entered the network yet.</p></div>}

      {loans.map((loan) => {
        const borrowerSacco = state.saccos[loan.borrowerSacco]?.name || loan.borrowerSacco;
        const guarantors = loan.guarantors || [];
        const loanRequests = Object.values(state.requests).filter((r) => r.loanId === loan.id);
        const guarantees = Object.values(state.guarantees).filter((g) => g.loanId === loan.id);
        const claims = Object.values(state.claims).filter((cl) => guarantees.some((g) => g.id === cl.guaranteeId));
        const open = openId === loan.id;

        return (
          <div key={loan.id} className="rounded-2xl overflow-hidden" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <button onClick={() => setOpenId(open ? null : loan.id)} className="w-full text-left p-5" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mono" style={{ fontSize: 10.5, color: c.muted }}>{loan.id}</p>
                  <h2 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink, marginTop: 2 }}>{loan.borrowerMemberNo} · {loan.product || "Loan"}</h2>
                  <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>{borrowerSacco} · {kes(loan.amount)} · {loan.term || "—"} months</p>
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
                  <KpiCard label="Loan amount" value={kes(loan.amount)} icon={Landmark} />
                  <KpiCard label="Guarantees" value={guarantors.length} icon={ShieldCheck} />
                  <KpiCard label="Requests" value={loanRequests.length} icon={GitBranch} />
                  <KpiCard label="Claims" value={claims.length} icon={AlertTriangle} tone={c.danger} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <section className="rounded-xl p-4" style={{ background: c.paper }}>
                    <h3 className="disp" style={{ fontSize: 14, fontWeight: 700, color: c.ink }}>Guarantee coverage</h3>
                    <div className="flex flex-col gap-2 mt-3">
                      {guarantors.length === 0 && <p className="body" style={{ fontSize: 11.5, color: c.muted }}>No guarantors recorded.</p>}
                      {guarantors.map((g) => {
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
                    <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>Read-only. Disbursement, repayment, default and claim settlement are performed by the responsible SACCO's own staff dashboard and reported here.</p>
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
                      {claims.filter((cl) => cl.status === "pending").map((cl) => (
                        <div key={cl.id} className="flex items-center justify-between rounded-lg p-2.5" style={{ background: c.dangerSoft }}>
                          <span className="body" style={{ fontSize: 11.5, color: c.danger, fontWeight: 700 }}>{cl.id} — pending settlement</span>
                          <span className="body" style={{ fontSize: 11, color: c.danger }}>awaiting guarantor SACCO</span>
                        </div>
                      ))}
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


/* ================= SACCO CREATION ROUTE ================= */
export function SaccoCreationPage({ onBack }) {
  const store = useSakonet();
  const [form, setForm] = useState({ name: "GT10 SACCO", reg: "GT10-001", contact: "GT10 Administrator", email: "admin@gt10sacco.co.ke", phone: "0700 100 010" });
  const [created, setCreated] = useState(null);
  const [error, setError] = useState("");
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const complete = Object.values(form).every(Boolean);

  return (
    <div className="min-h-screen" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
      <style>{fonts}</style>
      <div className="max-w-3xl mx-auto px-6 py-10">
        <button onClick={onBack} className="body flex items-center gap-1 mb-5" style={{ fontSize: 12.5, color: c.muted, fontWeight: 600 }}><ArrowLeft size={14} /> Back to operator console</button>
        <div className="rounded-2xl p-6" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
          <p className="body" style={{ fontSize: 11, color: c.primary, fontWeight: 700, letterSpacing: .5 }}>SAKONET NETWORK ONBOARDING</p>
          <h1 className="disp" style={{ fontSize: 28, fontWeight: 700, color: c.ink, marginTop: 5 }}>Create and activate a SACCO</h1>
          <p className="body" style={{ fontSize: 13, color: c.muted, lineHeight: 1.5, marginTop: 6 }}>Create the SACCO record, issue its network PIN and activate its KES 1,000,000 guarantee float in one demo flow.</p>

          {!created ? <>
            <div className="grid grid-cols-2 gap-4 mt-6">
              {[["SACCO name","name","e.g. Nyota SACCO"],["Registration number","reg","SACCO-00XXXX"],["Authorised contact","contact","Full name"],["Email","email","admin@sacco.co.ke"],["Phone","phone","07XXXXXXXX"]].map(([label,key,placeholder]) => (
                <div key={key} className={key === "name" ? "col-span-2" : ""}>
                  <p className="body" style={{ fontSize: 11.5, fontWeight: 600, color: c.muted, marginBottom: 5 }}>{label}</p>
                  <input value={form[key]} onChange={set(key)} placeholder={placeholder} className="body w-full rounded-xl" style={{ padding: "11px 12px", fontSize: 13, border: `1px solid ${c.line}`, outline: "none" }} />
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 mt-5" style={{ background: c.goldSoft }}>
              <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: "#7A5C16" }}>Activation package</p>
              <p className="body" style={{ fontSize: 11.5, color: "#7A5C16", marginTop: 3 }}>KES 1,000,000 guarantee float · unique SACCO code · 6-digit network PIN · active network status.</p>
            </div>
            {error && <p className="body" style={{ fontSize: 12, color: c.danger, marginTop: 10 }}>{error}</p>}
            <button disabled={!complete} onClick={() => { const r = store.createSacco(form); if (!r.ok) setError(r.error); else setCreated(r.sacco); }} className="w-full rounded-xl body mt-5" style={{ padding: "12px 0", fontSize: 13.5, fontWeight: 700, background: complete ? c.primary : c.line, color: "#fff" }}>Create SACCO & issue network credentials</button>
          </> : <div className="rounded-2xl p-5 mt-6" style={{ background: c.successSoft, border: `1px solid #BBD8C4` }}>
            <div className="flex items-center gap-2"><CheckCircle2 size={18} color={c.success} /><p className="body" style={{ fontSize: 13.5, fontWeight: 700, color: c.success }}>SACCO activated</p></div>
            <p className="disp" style={{ fontSize: 22, fontWeight: 700, color: c.ink, marginTop: 8 }}>{created.name}</p>
            <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>Code: <strong>{created.code}</strong> · Float: <strong>{kes(created.totalFloat)}</strong></p>
            <div className="rounded-xl p-4 mt-5" style={{ background: c.panel }}><p className="body" style={{ fontSize: 11.5, color: c.muted }}>SACCO network PIN</p><p className="mono" style={{ fontSize: 28, fontWeight: 700, color: c.primaryDeep, letterSpacing: 5 }}>{created.networkPin}</p><p className="body" style={{ fontSize: 11, color: c.muted, lineHeight: 1.45 }}>This authenticates authorised SACCO-to-SAKONET traffic. It is not a member PIN.</p></div>
            <button onClick={() => { window.history.pushState({}, "", "/gt10/network"); window.dispatchEvent(new PopStateEvent("popstate")); }} className="w-full rounded-xl body mt-4" style={{ padding: "11px 0", fontSize: 13, fontWeight: 700, background: c.primaryDeep, color: "#fff" }}>Continue to SACCO login</button>
          </div>}
        </div>
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
  const guaranteeExposure = Object.values(state.guarantees)
    .filter((g) => g.guarantorSacco === saccoCode && ["performing", "claimed"].includes(g.status))
    .reduce((sum, g) => sum + Number(g.amount || 0), 0);
  const sacco = state.saccos[saccoCode];

  return (
    <>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard label="Requests touching SACCO" value={touching.length} icon={GitBranch} />
        <KpiCard label="Outgoing guarantee requests" value={outgoing.length} icon={ArrowUpRight} tone={c.primary} />
        <KpiCard label="Incoming guarantee requests" value={incoming.length} icon={ArrowDownLeft} tone={c.gold} />
        <KpiCard label="Active cross-SACCO guarantees" value={Object.values(state.guarantees).filter((g) => g.status === "performing" && (g.borrowerSacco === saccoCode || g.guarantorSacco === saccoCode)).length} icon={ShieldCheck} tone={c.success} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <KpiCard label="Committed float" value={kes(sacco.locked)} icon={Lock} tone={c.gold} />
        <KpiCard label="Uncommitted float" value={kes(sacco.totalFloat - sacco.locked)} icon={Unlock} tone={c.success} />
        <KpiCard label="Guarantee exposure" value={kes(guaranteeExposure)} icon={Wallet} />
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
                    <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink }}>{borrowerName} · {kes(loan.amount)}</p>
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

/* ================= SACCO NETWORK LOGIN ================= */
export function SaccoNetworkLogin({ saccoCode = "GT10", autoOpen = false }) {
  const store = useSakonet();
  const { state, authenticateSaccoApi } = store;
  const [pin, setPin] = useState("");
  const [loggedIn, setLoggedIn] = useState(autoOpen);
  const [error, setError] = useState("");
  const sacco = state.saccos[saccoCode];

  if (!sacco) return <div className="min-h-screen flex items-center justify-center body">SACCO not found on SAKONET Network.</div>;

  const login = () => {
    if (!sacco.onboarded || sacco.status !== "active") {
      setError("This SACCO has not been activated on SAKONET yet. Use Add new SACCO in the operator console first.");
      return;
    }
    const result = authenticateSaccoApi(sacco.code, pin);
    if (!result.ok) { setError(result.error); return; }
    setError("");
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
        <style>{fonts}</style>
        <div className="rounded-2xl p-7" style={{ width: 430, background: c.panel, border: `1px solid ${c.line}`, boxShadow: "0 18px 50px rgba(0,0,0,.08)" }}>
          <p className="body" style={{ fontSize: 11, color: c.primary, fontWeight: 800, letterSpacing: .6 }}>SAKONET NETWORK ACCESS</p>
          <h1 className="disp" style={{ fontSize: 27, fontWeight: 700, color: c.ink, marginTop: 6 }}>{sacco.name}</h1>
          <p className="body" style={{ fontSize: 12, color: c.muted, lineHeight: 1.5, marginTop: 5 }}>Read-only SACCO network workspace. Use this view to demonstrate the requests, guarantees, borrowers and float this SACCO can see through SAKONET.</p>
          <input value={pin} onChange={(e) => setPin(e.target.value)} type="password" inputMode="numeric" placeholder="6-digit network PIN" className="body w-full rounded-xl mt-5" style={{ padding: "12px", fontSize: 13, border: `1px solid ${c.line}` }} />
          {error && <p className="body" style={{ color: c.danger, fontSize: 12, marginTop: 8 }}>{error}</p>}
          <p className="body" style={{ color: c.muted, fontSize: 11, marginTop: 8 }}>Demo network PIN: <strong>{sacco.networkPin}</strong></p>
          <button onClick={login} className="w-full rounded-xl body mt-4" style={{ padding: "12px 0", background: c.primary, color: "#fff", fontWeight: 700 }}>Open network workspace</button>
        </div>
      </div>
    );
  }

  const requests = Object.values(state.requests).filter((r) => r.borrowerSacco === saccoCode || r.guarantorSacco === saccoCode);

  return (
    <div className="min-h-screen" style={{ background: c.paper, fontFamily: "'Public Sans', sans-serif" }}>
      <style>{fonts}</style>
      <div className="max-w-6xl mx-auto px-7 py-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="body" style={{ fontSize: 10.5, color: c.primary, fontWeight: 800, letterSpacing: .7 }}>SAKONET NETWORK · READ ONLY</p>
            <h1 className="disp" style={{ fontSize: 27, fontWeight: 700, color: c.ink }}>{sacco.name}</h1>
            <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 3 }}>Routing, delivery and audit visibility. Approvals and declines are performed in the SACCO staff portal.</p>
          </div>
          <div className="rounded-xl px-4 py-3" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
            <p className="body" style={{ fontSize: 10.5, color: c.muted }}>Available float</p>
            <p className="mono" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>{kes(sacco.totalFloat - sacco.locked)}</p>
          </div>
        </div>

        <SaccoNetworkAnalysis saccoCode={saccoCode} />

        <section className="rounded-2xl p-5 mb-5" style={{ background: c.panel, border: `1px solid ${c.line}` }}>
          <h2 className="disp" style={{ fontSize: 17, fontWeight: 700, color: c.ink }}>Guarantee request visibility</h2>
          <p className="body" style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>No approval controls are available here.</p>
          <div className="flex flex-col gap-2 mt-4">
            {requests.length === 0 && <p className="body" style={{ fontSize: 12, color: c.muted }}>No requests yet.</p>}
            {requests.slice().reverse().map((r) => (
              <div key={r.id} className="rounded-xl p-3" style={{ background: c.paper }}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="mono" style={{ fontSize: 10, color: c.muted }}>{r.id}</p>
                    <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink }}>{r.borrowerName} → {r.guarantorName} · {kes(r.amount)}</p>
                    <p className="body" style={{ fontSize: 11, color: c.muted, marginTop: 2 }}>{state.saccos[r.borrowerSacco]?.name} → {state.saccos[r.guarantorSacco]?.name}</p>
                  </div>
                  <StageChip stage={r.stage} />
                </div>
                {r.declineReason && <div className="rounded-lg p-2 mt-2" style={{ background: c.dangerSoft }}><p className="body" style={{ fontSize: 11.5, color: c.danger }}><strong>Decline reason:</strong> {r.declineReason}</p></div>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ================= SAKONET OPERATOR CONSOLE ================= */
export default function SakonetOperatorConsole() {
  const store = useSakonet();
  const [nav, setNav] = useState("dashboard");
  const [showOnboard, setShowOnboard] = useState(false);

  const handleOnboard = (form) => store.createSacco(form);

  const getTitle = () => {
    const titles = {
      dashboard: "Network dashboard",
      saccos: "SACCOs & float",
      requests: "Guarantee requests",
      loans: "Loans management",
      guarantees: "Guarantees & claims",
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
        </div>
      </div>

      {showOnboard && (
        <OnboardModal
          onClose={() => setShowOnboard(false)}
          onCreate={handleOnboard}
          onOpenNetwork={(code) => {
            setShowOnboard(false);
            window.history.pushState({}, "", code === "GT10" ? "/gt10/network" : `/sacco/network/${code}`);
            window.dispatchEvent(new PopStateEvent("popstate"));
          }}
        />
      )}
    </div>
  );
}