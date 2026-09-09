import { useState } from "react";
import {
  Home, Wallet, Users, Bell, ChevronRight, ChevronLeft, X,
  ShieldCheck, TrendingUp, Smartphone, Globe2, Loader2,
  CheckCircle2,
} from "lucide-react";
import { useSakonet } from "./store";

/* -----------------------------------------------------------------
   BEAUTY SACCO — member app, for Phoebe Atieno (guarantor side).

   Reads and writes the shared store (store.jsx) — the same one
   mkulimaSacco.jsx and sakonet.jsx use. The request Phoebe sees here
   is real: it only appears once Beauty SACCO has received the request,
   verified Phoebe and her capacity, and sent the request from Beauty SACCO.
   Accepting/declining here records Phoebe's decision at Beauty SACCO first;
   Beauty then sends the official SACCO-to-SACCO confirmation through the
   SAKONET Network.

   Palette: light, cool orchid/fuchsia — Beauty SACCO's institutional
   color. Kept the `teal`/`tealDeep`/`tealSoft` variable names to avoid
   touching every usage site; the hex values are the soft fuchsia tones.
----------------------------------------------------------------- */

const CURRENT_MEMBER_NO = "BT-3390";
const SACCO_CODE = "BTY";

const c = {
  ink: "#332933",
  paper: "#FBF6FA",
  panel: "#FFFFFF",
  border: "#EEE2EC",
  teal: "#C07DBB",
  tealDeep:"#69084e",
  tealSoft: "#F8ECF6",
  coral: "#B9502F",
  coralSoft: "#F3E1D6",
  gold: "#C79A5F",
  goldSoft: "#F6ECDB",
  muted: "#8A818A",
  success: "#2E7D4F",
  successSoft: "#E3EFE6",
  danger: "#A6402A",
  dangerSoft: "#F3E1DB",
  sakonet: "#2F5D8A",
  sakonetBg: "#E9EFF6",
  sakonetBorder: "#C7D6E8",
};

const fontStack = `
  @import url('https://fonts.googleapis.com/css2?family=Spectral:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
  .disp { font-family: 'Spectral', serif; }
  .body { font-family: 'Manrope', sans-serif; }

  /* Phone display: edge-to-edge on an actual phone-sized screen,
     the familiar bezel mockup once there's room for it. */
  .phone-shell {
    width: 100%;
    height: 100dvh;
    border-radius: 0;
    border: none;
    box-shadow: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  @media (min-width: 640px) {
    .phone-shell {
      width: 390px;
      height: 800px;
      border-radius: 40px;
      border: 10px solid #332933;
      box-shadow: 0 30px 60px rgba(140,90,136,0.25);
    }
  }
`;

const fmt = (n) => "KES " + Number(n).toLocaleString("en-KE");

// A guarantee Phoebe already holds locally at Beauty SACCO — not part
// of the live Sakonet demo, kept as static context for the screen.
const activeGuarantee = {
  name: "Daniel Kiptoo",
  amount: 150000,
  exposure: 95000,
  product: "Emergency Loan",
  cleared: "37%",
};

const notifIcon = (type) => {
  const map = {
    sakonet: <Globe2 size={16} color={c.sakonet} />,
    sacco: <ShieldCheck size={16} color={c.teal} />,
    guarantor: <Users size={16} color={c.gold} />,
    security: <ShieldCheck size={16} color={c.ink} />,
    dividend: <TrendingUp size={16} color={c.success} />,
  };
  return map[type] || <Bell size={16} />;
};

// Map the store's request stage to this screen's simpler status model.
function deriveStatus(stage) {
  if (stage === "notified") return "awaiting_response";
  if (stage === "member_responded" || stage === "awaiting_sacco_confirmation") return "processing";
  if (stage === "sacco_confirmed_accepted" || stage === "sacco_confirmation_received" || stage === "sacco_received_confirmation" || stage === "member_notified_by_mkulima" || stage === "accepted" || stage === "locked") return "accepted";
  if (stage === "rejected" || stage === "sacco_confirmed_declined" || stage === "sacco_confirmation_received_declined") return "rejected";
  return "not_ready";
}

// ---------- Small building blocks ----------
function TopBar({ title, onBack }) {
  return (
    <div className="flex items-center gap-2 px-5 pt-5 pb-3 flex-shrink-0" style={{ background: c.paper }}>
      {onBack && (
        <button onClick={onBack} className="p-1 -ml-1 rounded-full flex-shrink-0" style={{ color: c.ink }}>
          <ChevronLeft size={22} />
        </button>
      )}
      <h1 className="disp" style={{ fontSize: 19, fontWeight: 600, color: c.ink, minWidth: 0 }}>{title}</h1>
    </div>
  );
}

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: { bg: c.tealSoft, fg: c.teal },
    pending: { bg: c.goldSoft, fg: "#8A6512" },
    active: { bg: c.successSoft, fg: c.success },
    danger: { bg: c.dangerSoft, fg: c.danger },
  };
  const t = tones[tone];
  return (
    <span className="body" style={{ background: t.bg, color: t.fg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, whiteSpace: "nowrap", flexShrink: 0 }}>
      {children}
    </span>
  );
}

function SakonetBadge({ label = "Sakonet" }) {
  return (
    <span
      className="body flex items-center gap-1"
      style={{ background: c.sakonetBg, color: c.sakonet, fontSize: 10.5, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: `1px solid ${c.sakonetBorder}`, whiteSpace: "nowrap", flexShrink: 0 }}
    >
      <Globe2 size={10.5} /> {label}
    </span>
  );
}

function NavBar({ tab, setTab, unreadCount }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "guarantor", label: "Guarantor", icon: Users },
    { id: "savings", label: "Savings", icon: Wallet },
    { id: "notifications", label: "Alerts", icon: Bell },
  ];
  return (
    <div className="flex justify-around items-center px-2 pt-2 flex-shrink-0" style={{ borderTop: `1px solid ${c.border}`, background: c.panel, paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}>
      {items.map((it) => {
        const active = tab === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            className="flex flex-col items-center gap-1 relative"
            style={{ padding: "4px 10px", color: active ? c.teal : c.muted }}
          >
            <div className="relative">
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              {it.id === "notifications" && unreadCount > 0 && (
                <span style={{ position: "absolute", top: -3, right: -6, width: 8, height: 8, borderRadius: 8, background: c.coral, border: `1.5px solid ${c.panel}` }} />
              )}
            </div>
            <span className="body" style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- HOME ----------
function HomeScreen({ member, goGuarantor, goNotifications, hasPending }) {
  return (
    <div className="px-5 pt-6 pb-6 overflow-y-auto" style={{ background: c.paper, flex: 1, minHeight: 0 }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="body" style={{ fontSize: 13, color: c.muted }}>Good afternoon,</p>
          <p className="disp" style={{ fontSize: 18, fontWeight: 600, color: c.ink }}>{member.name.split(" ")[0]}</p>
        </div>
        <button onClick={goNotifications} className="p-2 rounded-full flex-shrink-0" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
          <Bell size={18} color={c.ink} />
        </button>
      </div>

      <div className="rounded-2xl p-5 mb-4" style={{ background: c.tealDeep }}>
        <p className="body" style={{ fontSize: 12, color: c.tealSoft, marginBottom: 4 }}>Total savings & shares</p>
        <p className="disp" style={{ fontSize: 27, fontWeight: 600, color: "#fff", letterSpacing: -0.3 }}>
          {fmt(member.savings + member.shares)}
        </p>
        <div className="flex gap-5 mt-4">
          <div>
            <p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Savings</p>
            <p className="body" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(member.savings)}</p>
          </div>
          <div>
            <p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Shares</p>
            <p className="body" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmt(member.shares)}</p>
          </div>
          <div>
            <p className="body" style={{ fontSize: 11, color: c.tealSoft }}>Member No.</p>
            <p className="body" style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{member.memberNo}</p>
          </div>
        </div>
      </div>

      {hasPending && (
        <button onClick={goGuarantor} className="w-full text-left rounded-2xl p-4 mb-4 flex items-center justify-between" style={{ background: c.sakonetBg, border: `1px solid ${c.sakonetBorder}`, cursor: "pointer" }}>
          <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 36, height: 36, background: "#fff" }}>
              <Globe2 size={16} color={c.sakonet} />
            </div>
            <div style={{ minWidth: 0 }}>
              <p className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink }}>Guarantee request via Sakonet</p>
              <p className="body" style={{ fontSize: 11, color: c.muted }}>Needs your response</p>
            </div>
          </div>
          <ChevronRight size={17} color={c.ink} style={{ flexShrink: 0 }} />
        </button>
      )}

      <h2 className="disp" style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}>Guarantees you hold</h2>
      <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
        <div className="flex justify-between items-start mb-2" style={{ gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{activeGuarantee.name}</p>
            <p className="body" style={{ fontSize: 11.5, color: c.muted }}>{activeGuarantee.product} · your exposure {fmt(activeGuarantee.exposure)}</p>
          </div>
          <Pill>{activeGuarantee.cleared} cleared</Pill>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.tealSoft }}>
          <div style={{ width: activeGuarantee.cleared, height: "100%", background: c.gold }} />
        </div>
      </div>
    </div>
  );
}

// ---------- GUARANTOR ----------
function RequestDetail({ request, member, onBack, onRespond, relayLog, respondStatus }) {
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pendingDecision, setPendingDecision] = useState(null);
  const isDeciding = respondStatus === "sending";
  const isFinal = request.status === "accepted" || request.status === "rejected";
  const isProcessing = !isFinal && (respondStatus === "done" || request.status === "processing");
  const isDone = isFinal || isProcessing;

  return (
    <div className="flex-1 flex flex-col" style={{ background: c.paper, minHeight: 0 }}>
      <TopBar title="Guarantee request" onBack={onBack} />
      <div className="px-5 flex-1 overflow-y-auto pb-3" style={{ minHeight: 0 }}>
        <div className="rounded-2xl p-3 mb-4 flex gap-2" style={{ background: c.sakonetBg, border: `1px solid ${c.sakonetBorder}` }}>
          <Globe2 size={14} color={c.sakonet} style={{ flexShrink: 0, marginTop: 1 }} />
          <p className="body" style={{ fontSize: 11.5, color: c.sakonet, lineHeight: 1.5, minWidth: 0 }}>
            This request was sent by Beauty SACCO after Beauty verified your membership and available guarantee capacity. Your decision is recorded by Beauty SACCO first, then Beauty sends the official confirmation through the SAKONET Network.
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-4" style={{ background: c.tealDeep }}>
          <div className="flex items-center justify-between mb-1" style={{ gap: 8 }}>
            <p className="body" style={{ fontSize: 12, color: c.tealSoft, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{request.product} · {request.loanId}</p>
            <SakonetBadge label="SAKONET Network" />
          </div>
          <p className="disp" style={{ fontSize: 22, fontWeight: 600, color: "#fff", marginTop: 4, wordBreak: "break-word" }}>{request.borrower}</p>
          <p className="body" style={{ fontSize: 12, color: c.tealSoft, marginTop: 2 }}>Loan amount {fmt(request.loanAmount)} · {request.term}</p>
        </div>

        <div className="rounded-2xl p-4 mb-4" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
          {[
            ["Purpose", request.purpose],
            ["Your guarantee", fmt(request.amount)],
            ["Your available capacity", fmt(member.capacity)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2" style={{ borderBottom: `1px solid ${c.border}`, gap: 8 }}>
              <span className="body" style={{ fontSize: 12.5, color: c.muted, flexShrink: 0 }}>{k}</span>
              <span className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink, textAlign: "right", minWidth: 0, wordBreak: "break-word" }}>{v}</span>
            </div>
          ))}
        </div>

        {request.otherGuarantors?.length > 0 && (
          <>
            <p className="body" style={{ fontSize: 11.5, fontWeight: 700, color: c.ink, marginBottom: 8 }}>Other guarantors on this loan</p>
            <div className="flex flex-col gap-2 mb-4">
              {request.otherGuarantors.map((g) => (
                <div key={g.name} className="rounded-xl p-3 flex items-center justify-between" style={{ background: c.panel, border: `1px solid ${c.border}`, gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p className="body" style={{ fontSize: 12.5, fontWeight: 600, color: c.ink }}>{g.name}</p>
                    <p className="body" style={{ fontSize: 11, color: c.muted }}>{g.sacco} · {fmt(g.amount)}</p>
                  </div>
                  <Pill tone={g.status === "accepted" ? "active" : "pending"}>{g.status === "accepted" ? "Accepted" : "Pending"}</Pill>
                </div>
              ))}
            </div>
          </>
        )}

        {relayLog.length > 0 && respondStatus === "sending" && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: c.sakonetBg, border: `1px solid ${c.sakonetBorder}` }}>
            <p className="body" style={{ fontSize: 11.5, fontWeight: 700, color: c.sakonet, marginBottom: 8 }}>Sending your response</p>
            <div className="flex flex-col gap-2">
              {relayLog.map((line) => (
                <div key={line.text} className="flex items-center gap-2" style={{ minWidth: 0 }}>
                  {line.done ? <CheckCircle2 size={13} color={c.sakonet} style={{ flexShrink: 0 }} /> : <Loader2 size={13} color={c.sakonet} className="animate-spin" style={{ flexShrink: 0 }} />}
                  <span className="body" style={{ fontSize: 11.5, color: c.ink, minWidth: 0, wordBreak: "break-word" }}>{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="rounded-2xl p-4 flex items-start gap-2" style={{ background: c.sakonetBg }}>
            <Loader2 size={16} color={c.sakonet} className="animate-spin flex-shrink-0" style={{ marginTop: 1 }} />
            <p className="body" style={{ fontSize: 12.5, fontWeight: 600, color: c.sakonet, minWidth: 0, lineHeight: 1.45 }}>
              {request.memberDecision === "declined"
                ? "You declined this request. Beauty SACCO is recording your decision and relaying it through the SAKONET Network."
                : "You accepted this guarantee. Beauty SACCO staff are confirming your decision before it's relayed through the SAKONET Network."}
            </p>
          </div>
        )}

        {isFinal && (
          <div className="rounded-2xl p-4 flex items-start gap-2" style={{ background: request.status === "accepted" ? c.successSoft : c.dangerSoft }}>
            {request.status === "accepted" ? <CheckCircle2 size={16} color={c.success} style={{ flexShrink: 0, marginTop: 1 }} /> : <X size={16} color={c.danger} style={{ flexShrink: 0, marginTop: 1 }} />}
            <p className="body" style={{ fontSize: 12.5, fontWeight: 600, color: request.status === "accepted" ? c.success : c.danger, minWidth: 0, lineHeight: 1.45 }}>
              {request.status === "accepted"
                ? `Your acceptance was confirmed by Beauty SACCO. Beauty SACCO has sent the confirmation through the SAKONET Network.`
                : request.memberDecision === "declined"
                  ? `You declined this request. Beauty SACCO has recorded your decision and sent the response through the SAKONET Network.`
                  : `This guarantorship failed. Beauty SACCO has recorded the outcome.`}
            </p>
          </div>
        )}
      </div>

      {showPin && !isDone && (
        <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(140,90,136,0.45)", zIndex: 40, padding: 16 }}>
          <div className="rounded-2xl p-5" style={{ background: c.panel, width: "100%", maxWidth: 330, boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <p className="disp" style={{ fontSize: 18, fontWeight: 700, color: c.ink }}>Confirm with your SACCO PIN</p>
            <p className="body" style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.45, marginTop: 5 }}>Beauty SACCO records your decision before it is sent to Sakonet. Demo PIN: 654321.</p>
            <input autoFocus inputMode="numeric" maxLength={6} value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinError(""); }} placeholder="6-digit PIN" className="body w-full rounded-xl mt-4" style={{ padding: "12px", fontSize: 16, letterSpacing: 4, textAlign: "center", border: `1px solid ${pinError ? c.danger : c.border}`, outline: "none", boxSizing: "border-box" }} />
            {pinError && <p className="body" style={{ fontSize: 11, color: c.danger, marginTop: 5 }}>{pinError}</p>}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowPin(false)} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: c.paper, color: c.ink }}>Cancel</button>
              <button disabled={pin.length !== 6} onClick={() => { const result = onRespond(pendingDecision, pin); if (result?.ok === false) { setPinError(result.error); return; } setShowPin(false); }} className="flex-1 rounded-xl body" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 700, background: pin.length === 6 ? c.teal : c.border, color: "#fff" }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* ACCEPT/DECLINE BUTTONS - Always visible when not done */}
      {!isDone && (
        <div className="px-5 pb-6 pt-3 flex gap-2 flex-shrink-0" style={{ borderTop: `1px solid ${c.border}`, background: c.paper, paddingBottom: "max(24px, env(safe-area-inset-bottom))" }}>
          <button
            disabled={isDeciding}
            onClick={() => { setPendingDecision("rejected"); setPin(""); setPinError(""); setShowPin(true); }}
            className="flex-1 rounded-2xl body"
            style={{ 
              padding: "13px 8px", 
              fontSize: 14, 
              fontWeight: 700, 
              background: c.panel, 
              color: c.danger, 
              border: `1px solid ${c.danger}`, 
              opacity: isDeciding ? 0.5 : 1,
              cursor: isDeciding ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Decline
          </button>
          <button
            disabled={isDeciding}
            onClick={() => { setPendingDecision("accepted"); setPin(""); setPinError(""); setShowPin(true); }}
            className="flex-1 rounded-2xl body flex items-center justify-center gap-2"
            style={{ 
              padding: "13px 8px", 
              fontSize: 14, 
              fontWeight: 700, 
              background: c.teal, 
              color: "#fff", 
              opacity: isDeciding ? 0.7 : 1,
              cursor: isDeciding ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isDeciding ? <><Loader2 size={14} className="animate-spin" /> Sending…</> : "Accept"}
          </button>
        </div>
      )}
    </div>
  );
}

function GuarantorScreen({ store, member, requestView }) {
  const [open, setOpen] = useState(false);
  const [respondStatus, setRespondStatus] = useState("idle");
  const [relayLog, setRelayLog] = useState([]);

  const respond = (decision, pin) => {
    if (!requestView) return { ok: false, error: "No request selected." };

    const result = store.respondToRequest(requestView.id, decision, pin);
    if (result?.ok === false) return result;

    setRespondStatus("sending");
    setRelayLog([{ text: "Phoebe → Beauty SACCO: decision recorded by your SACCO…", done: false }]);

    // Beyond this, the real progress (Beauty SACCO staff confirmation, then
    // the SAKONET/Mkulima relay) is driven entirely by store state — the
    // screen switches to reading requestView.status once it changes, so
    // there's no further local animation to fake here.
    setTimeout(() => {
      setRelayLog((prev) => [{ ...prev[0], done: true }]);
      setRespondStatus("done");
    }, 700);
    return { ok: true };
  };

  if (!requestView) {
    return (
      <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.paper, flex: 1, minHeight: 0 }}>
        <h2 className="disp" style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}>Guarantee requests from Beauty SACCO</h2>
        <div className="rounded-2xl p-5 text-center mb-6" style={{ background: c.tealSoft }}>
          <p className="body" style={{ fontSize: 12.5, color: c.ink }}>Nothing to review yet — send a request from Mkulima SACCO's app to see it appear here.</p>
        </div>
        <GuaranteesHeld />
      </div>
    );
  }

  // If open is true, show the detail view with buttons
  if (open) {
    return (
      <RequestDetail
        request={requestView}
        member={member}
        onBack={() => setOpen(false)}
        onRespond={respond}
        relayLog={relayLog}
        respondStatus={respondStatus}
      />
    );
  }

  const isPending = requestView.status === "awaiting_response" && respondStatus !== "done";

  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.paper, flex: 1, minHeight: 0 }}>
      <h2 className="disp" style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}>
        Pending requests {isPending && <span style={{ color: c.gold }}>(1)</span>}
      </h2>

      {isPending ? (
        <button 
          onClick={() => setOpen(true)} 
          className="w-full text-left rounded-2xl p-4 mb-6" 
          style={{ 
            background: c.panel, 
            border: `2px solid ${c.sakonetBorder}`,
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow: "0 2px 8px rgba(47,93,138,0.1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = c.sakonet;
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(47,93,138,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = c.sakonetBorder;
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(47,93,138,0.1)";
          }}
        >
          <div className="flex items-center justify-between mb-1" style={{ gap: 8 }}>
            <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
              <p className="body" style={{ fontSize: 13.5, fontWeight: 700, color: c.ink, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{requestView.borrower}</p>
              <SakonetBadge label={requestView.borrowerSacco} />
            </div>
            <ChevronRight size={16} color={c.sakonet} style={{ flexShrink: 0 }} />
          </div>
          <p className="body" style={{ fontSize: 11.5, color: c.muted }}>
            {requestView.product} · guarantee {fmt(requestView.amount)}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="body" style={{ fontSize: 11, color: c.sakonet, fontWeight: 600 }}>
              👆 Click to review and respond
            </span>
          </div>
        </button>
      ) : (
        <div className="rounded-2xl p-5 text-center mb-6" style={{ background: c.tealSoft }}>
          <CheckCircle2 size={22} color={c.teal} style={{ margin: "0 auto 6px" }} />
          <p className="body" style={{ fontSize: 12.5, color: c.ink }}>
            {requestView.status === "rejected"
              ? (requestView.memberDecision === "declined" ? "You declined this request." : "This guarantorship failed.")
              : requestView.status === "processing"
                ? "You accepted this guarantee — Beauty SACCO is confirming it."
                : "You accepted this guarantee."}
          </p>
        </div>
      )}

      <GuaranteesHeld />
    </div>
  );
}

function GuaranteesHeld() {
  return (
    <>
      <h2 className="disp" style={{ fontSize: 14, fontWeight: 600, color: c.ink, marginBottom: 10 }}>Guarantees you hold</h2>
      <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
        <div className="flex justify-between items-start mb-2" style={{ gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <p className="body" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>{activeGuarantee.name}</p>
            <p className="body" style={{ fontSize: 11.5, color: c.muted }}>{activeGuarantee.product} · your exposure {fmt(activeGuarantee.exposure)}</p>
          </div>
          <Pill>{activeGuarantee.cleared} cleared</Pill>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 6, background: c.tealSoft }}>
          <div style={{ width: activeGuarantee.cleared, height: "100%", background: c.gold }} />
        </div>
      </div>
    </>
  );
}

// ---------- SAVINGS ----------
function SavingsScreen({ member }) {
  const rows = [
    ["Savings balance", fmt(member.savings)],
    ["Shares balance", fmt(member.shares)],
    ["Available to guarantee", fmt(member.capacity)],
    ["Currently committed", fmt(activeGuarantee.exposure)],
  ];
  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.paper, flex: 1, minHeight: 0 }}>
      <div className="rounded-2xl p-4" style={{ background: c.panel, border: `1px solid ${c.border}` }}>
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between py-2.5" style={{ borderBottom: `1px solid ${c.border}`, gap: 8 }}>
            <span className="body" style={{ fontSize: 12.5, color: c.muted }}>{k}</span>
            <span className="body" style={{ fontSize: 12.5, fontWeight: 700, color: c.ink, textAlign: "right" }}>{v}</span>
          </div>
        ))}
      </div>
      <p className="body mt-4" style={{ fontSize: 11.5, color: c.muted, lineHeight: 1.5 }}>
        Guarantee capacity is drawn from your shares, whether the loan you're guaranteeing sits at Beauty SACCO
        or, via Sakonet, at another SACCO entirely.
      </p>
    </div>
  );
}

// ---------- NOTIFICATIONS ----------
function NotificationsScreen({ store, member }) {
  const items = store.state.notifications[member.memberNo] || [];
  return (
    <div className="px-5 pb-4 overflow-y-auto" style={{ background: c.paper, flex: 1, minHeight: 0 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="disp" style={{ fontSize: 14, fontWeight: 600, color: c.ink }}>Recent</h2>
        <button onClick={() => store.markRead(member.memberNo)} className="body" style={{ fontSize: 12, color: c.teal, fontWeight: 700 }}>
          Mark all read
        </button>
      </div>
      {items.length === 0 && <p className="body" style={{ fontSize: 12.5, color: c.muted }}>Nothing here yet.</p>}
      <div className="flex flex-col gap-2">
        {items.map((n) => (
          <div key={n.id} className="rounded-2xl p-4 flex gap-3" style={{ background: n.unread ? c.tealSoft : c.panel, border: `1px solid ${c.border}` }}>
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 34, height: 34, background: "#fff" }}>
              {notifIcon(n.type)}
            </div>
            <div className="flex-1" style={{ minWidth: 0 }}>
              <div className="flex justify-between items-start" style={{ gap: 8 }}>
                <p className="body" style={{ fontSize: 13, fontWeight: n.unread ? 700 : 600, color: c.ink, minWidth: 0 }}>{n.title}</p>
                {n.unread && <span style={{ width: 7, height: 7, borderRadius: 7, background: c.coral, flexShrink: 0, marginTop: 4 }} />}
              </div>
              <p className="body" style={{ fontSize: 12, color: c.muted, marginTop: 2 }}>{n.body}</p>
              <p className="body" style={{ fontSize: 10.5, color: c.muted, marginTop: 6 }}>{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- APP SHELL ----------
export default function BeautySaccoMemberApp() {
  const store = useSakonet();
  const [tab, setTab] = useState("home");

  const member = store.state.membersBySacco[SACCO_CODE].find((m) => m.memberNo === CURRENT_MEMBER_NO);
  const notifications = store.state.notifications[CURRENT_MEMBER_NO] || [];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const rawRequest = Object.values(store.state.requests).find((r) => r.guarantorSacco === SACCO_CODE && r.guarantorMemberNo === CURRENT_MEMBER_NO);
  const status = rawRequest ? deriveStatus(rawRequest.stage) : "not_ready";

  let requestView = null;
  if (rawRequest && status !== "not_ready") {
    const loan = store.state.loans[rawRequest.loanId];
    const borrower = store.state.membersBySacco[rawRequest.borrowerSacco]?.find((m) => m.memberNo === rawRequest.borrowerMemberNo);
    const borrowerSaccoName = store.state.saccos[rawRequest.borrowerSacco]?.name || rawRequest.borrowerSacco;
    const otherGuarantors = (loan?.guarantors || [])
      .filter((g) => g.memberNo !== CURRENT_MEMBER_NO)
      .map((g) => ({ name: g.name, sacco: store.state.saccos[g.sacco]?.name || g.sacco, amount: g.amount, status: g.status }));

    requestView = {
      id: rawRequest.id,
      borrower: borrower?.name || "Member",
      borrowerSacco: borrowerSaccoName,
      loanId: rawRequest.loanId,
      product: loan?.product,
      loanAmount: loan?.amount,
      amount: rawRequest.amount,
      term: loan ? `${loan.term} months` : "",
      purpose: loan?.purpose || "—",
      otherGuarantors,
      status,
      memberDecision: rawRequest.memberDecision,
    };
  }

  const hasPending = requestView?.status === "awaiting_response";

  return (
    <div className="flex items-center justify-center w-full" style={{ minHeight: "100dvh", background: "#DCE0D5", fontFamily: "Manrope, sans-serif" }}>
      <style>{fontStack}</style>
      <div className="phone-shell relative" style={{ background: c.paper }}>

        <div className="flex items-center justify-between px-6 pt-3 pb-1 flex-shrink-0" style={{ background: c.paper }}>
          <span className="disp" style={{ fontSize: 13, fontWeight: 700, color: c.ink }}>9:41</span>
          <Smartphone size={13} color={c.ink} />
        </div>

        {tab === "home" && (
          <HomeScreen
            member={member}
            goGuarantor={() => setTab("guarantor")}
            goNotifications={() => setTab("notifications")}
            hasPending={hasPending}
          />
        )}
        {tab === "guarantor" && <GuarantorScreen store={store} member={member} requestView={requestView} />}
        {tab === "savings" && <SavingsScreen member={member} />}
        {tab === "notifications" && <NotificationsScreen store={store} member={member} />}

        <NavBar tab={tab} setTab={setTab} unreadCount={unreadCount} />
      </div>
    </div>
  );
}