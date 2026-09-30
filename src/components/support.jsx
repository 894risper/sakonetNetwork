/* eslint-disable react-refresh/only-export-components */
import { useState } from "react";
import { useSakonet } from "./store";
import { LifeBuoy, Plus, ArrowLeft, Send, ChevronRight, Inbox, Clock, CheckCircle2 } from "lucide-react";

/* -----------------------------------------------------------------
   SAKONET customer service & ticketing.
   One shared workspace (list / new ticket / thread) configured three
   ways: SaccoSupport (SACCO staff), MemberSupport (a member inside a
   member app) and OperatorSupport (SAKONET operator console).
----------------------------------------------------------------- */

const c = {
  ink: "#12202E", paper: "#EEF1F5", panel: "#FFFFFF", line: "#DCE2EA",
  primary: "#2F5D8A", primaryDeep: "#1F4368", primarySoft: "#E4EBF3",
  gold: "#B8862E", goldSoft: "#F3E9CE", success: "#2E7D4F", successSoft: "#E3EFE6",
  danger: "#A6402A", dangerSoft: "#F3E1DB", muted: "#69707C",
};

export const TICKET_CATEGORIES = [
  "Guarantee request", "Float / settlement", "Loan", "Claim / default", "Login / access", "Other",
];
const PRIORITIES = [["low", "Low"], ["normal", "Normal"], ["high", "High"], ["urgent", "Urgent"]];
const STATUS_META = {
  open: { label: "Open", bg: c.goldSoft, fg: "#7A5C16" },
  in_progress: { label: "In progress", bg: c.primarySoft, fg: c.primary },
  resolved: { label: "Resolved", bg: c.successSoft, fg: c.success },
  closed: { label: "Closed", bg: c.paper, fg: c.muted },
};
const PRIORITY_COLOR = { low: c.muted, normal: c.primary, high: c.gold, urgent: c.danger };
const FILTERS = [["all", "All"], ["open", "Open"], ["in_progress", "In progress"], ["resolved", "Resolved"], ["closed", "Closed"]];

const fmt = (iso) =>
  new Date(iso).toLocaleString("en-KE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });

function StatusPill({ status }) {
  const s = STATUS_META[status] || STATUS_META.open;
  return <span style={{ background: s.bg, color: s.fg, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap" }}>{s.label}</span>;
}

const field = { width: "100%", padding: "9px 12px", fontSize: 13, border: `1px solid ${c.line}`, borderRadius: 10, outline: "none", background: "#fff", color: c.ink };
const label = { fontSize: 11.5, fontWeight: 600, color: c.muted, marginBottom: 4, display: "block" };

/* ---------- New ticket form ---------- */
function NewTicketForm({ defaults, accent, onDone, onCancel }) {
  const { raiseTicket } = useSakonet();
  const [f, setF] = useState({ category: TICKET_CATEGORIES[0], priority: "normal", subject: "", description: "", linkedId: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = () => {
    const res = raiseTicket({ ...defaults, ...f });
    if (!res.ok) return setError(res.error);
    onDone(res.ticketId);
  };

  return (
    <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: 20, maxWidth: 640 }}>
      <button onClick={onCancel} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: c.muted, fontWeight: 600, marginBottom: 12 }}>
        <ArrowLeft size={14} /> Back to tickets
      </button>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: c.ink, marginBottom: 14 }}>Raise a ticket or complaint</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={label}>Category</label>
          <select value={f.category} onChange={set("category")} style={field}>
            {TICKET_CATEGORIES.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Priority</label>
          <select value={f.priority} onChange={set("priority")} style={field}>
            {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={label}>Subject</label>
        <input value={f.subject} onChange={set("subject")} placeholder="Short summary of the problem" style={field} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={label}>Related request, loan or guarantee ID (optional)</label>
        <input value={f.linkedId} onChange={set("linkedId")} placeholder="e.g. GR-… or L-…" style={field} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label style={label}>Describe the issue</label>
        <textarea value={f.description} onChange={set("description")} rows={5} placeholder="What happened, and what do you expect?" style={{ ...field, resize: "vertical" }} />
      </div>
      {error && <p style={{ color: c.danger, fontSize: 12, marginTop: 8 }}>{error}</p>}
      <button onClick={submit} style={{ marginTop: 14, padding: "10px 18px", fontSize: 13, fontWeight: 700, background: accent, color: "#fff", borderRadius: 10 }}>
        Submit ticket
      </button>
    </div>
  );
}

/* ---------- Ticket thread ---------- */
function TicketThread({ ticketId, me, myName, accent, isOperator, onBack }) {
  const { state, replyToTicket, setTicketStatus } = useSakonet();
  const ticket = state.tickets?.[ticketId];
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  if (!ticket) return null;

  const saccoName = state.saccos[ticket.saccoCode]?.name || ticket.saccoCode;
  const done = ticket.status === "resolved" || ticket.status === "closed";
  const actions = isOperator
    ? [["in_progress", "Mark in progress"], ["resolved", "Resolve"], ["closed", "Close"]].filter(([s]) => s !== ticket.status)
    : done ? [] : [["resolved", "Mark as resolved"]];

  const send = () => {
    const res = replyToTicket(ticketId, { from: me, name: myName, text });
    if (!res.ok) return setError(res.error);
    setText(""); setError("");
  };

  const bubble = (m) => {
    const mine = m.from === me;
    const bg = mine ? accent : m.from === "operator" ? c.goldSoft : c.paper;
    return (
      <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
        <div style={{ maxWidth: "78%" }}>
          <p style={{ fontSize: 10.5, color: c.muted, marginBottom: 3, textAlign: mine ? "right" : "left" }}>{m.name} · {fmt(m.at)}</p>
          <div style={{ background: bg, color: mine ? "#fff" : c.ink, fontSize: 12.5, lineHeight: 1.5, padding: "10px 13px", borderRadius: 14, whiteSpace: "pre-wrap" }}>{m.text}</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: 20, borderBottom: `1px solid ${c.line}` }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, color: c.muted, fontWeight: 600, marginBottom: 10 }}>
          <ArrowLeft size={14} /> Back to tickets
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontSize: 10.5, color: c.muted, fontFamily: "monospace" }}>{ticket.id}</p>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: c.ink, marginTop: 2 }}>{ticket.subject}</h3>
            <p style={{ fontSize: 11.5, color: c.muted, marginTop: 3 }}>
              {ticket.category} · <span style={{ color: PRIORITY_COLOR[ticket.priority], fontWeight: 700 }}>{ticket.priority}</span> · {ticket.raisedByName} ({ticket.raisedByType === "member" ? `member, ${saccoName}` : saccoName}) · {fmt(ticket.createdAt)}
            </p>
            {ticket.linkedId && <p style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>Linked to <span style={{ fontFamily: "monospace", color: c.ink }}>{ticket.linkedId}</span></p>}
          </div>
          <StatusPill status={ticket.status} />
        </div>
        {actions.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {actions.map(([s, l]) => (
              <button key={s} onClick={() => setTicketStatus(ticketId, s, myName)} style={{ padding: "6px 12px", fontSize: 12, fontWeight: 700, border: `1px solid ${c.line}`, borderRadius: 8, color: accent, background: c.panel }}>{l}</button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, background: "#fff", maxHeight: 420, overflowY: "auto" }}>
        {ticket.messages.map(bubble)}
      </div>

      <div style={{ padding: 16, borderTop: `1px solid ${c.line}`, background: c.paper }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={done ? "Reply to reopen this ticket…" : "Write a reply…"} style={{ ...field, flex: 1 }}
          />
          <button onClick={send} disabled={!text.trim()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", fontSize: 12.5, fontWeight: 700, background: text.trim() ? accent : c.line, color: "#fff", borderRadius: 10 }}>
            <Send size={14} /> Send
          </button>
        </div>
        {error && <p style={{ color: c.danger, fontSize: 12, marginTop: 6 }}>{error}</p>}
      </div>
    </div>
  );
}

/* ---------- Shared workspace: list / new / thread ---------- */
function SupportWorkspace({ tickets, me, myName, isOperator = false, accent = c.primary, newDefaults, showSacco = false }) {
  const { state } = useSakonet();
  const [view, setView] = useState("list"); // "list" | "new" | ticketId
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  if (view === "new" && newDefaults) {
    return <NewTicketForm defaults={newDefaults} accent={accent} onCancel={() => setView("list")} onDone={(id) => setView(id)} />;
  }
  if (view !== "list" && view !== "new") {
    return <TicketThread ticketId={view} me={me} myName={myName} accent={accent} isOperator={isOperator} onBack={() => setView("list")} />;
  }

  const sorted = tickets.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const counts = Object.fromEntries(FILTERS.map(([id]) => [id, id === "all" ? sorted.length : sorted.filter((t) => t.status === id).length]));
  const q = query.trim().toLowerCase();
  const rows = sorted.filter((t) => (filter === "all" || t.status === filter) &&
    (!q || `${t.id} ${t.subject} ${t.raisedByName} ${t.category} ${t.linkedId || ""}`.toLowerCase().includes(q)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTERS.map(([id, l]) => (
            <button key={id} onClick={() => setFilter(id)} style={{ padding: "6px 13px", fontSize: 12, fontWeight: 700, borderRadius: 20, background: filter === id ? accent : c.panel, color: filter === id ? "#fff" : c.muted, border: `1px solid ${filter === id ? accent : c.line}` }}>
              {l} · {counts[id]}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flex: 1, justifyContent: "flex-end" }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tickets" style={{ ...field, width: 220, flex: "1 1 160px" }} />
          {newDefaults && (
            <button onClick={() => setView("new")} style={{ display: "flex", alignItems: "center", gap: 4, padding: "9px 14px", fontSize: 12.5, fontWeight: 700, background: accent, color: "#fff", borderRadius: 10, whiteSpace: "nowrap" }}>
              <Plus size={14} /> New ticket
            </button>
          )}
        </div>
      </div>

      {rows.length === 0 && (
        <div style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: 32, textAlign: "center", color: c.muted, fontSize: 12.5 }}>
          <LifeBuoy size={20} color={c.muted} style={{ margin: "0 auto 8px" }} />
          {tickets.length === 0 ? "No tickets yet." : "No tickets match your search or filter."}
        </div>
      )}

      {rows.map((t) => (
        <button key={t.id} onClick={() => setView(t.id)} style={{ textAlign: "left", background: c.panel, border: `1px solid ${c.line}`, borderRadius: 14, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10.5, color: c.muted, fontFamily: "monospace" }}>{t.id} · {fmt(t.updatedAt)}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: c.ink, marginTop: 2 }}>{t.subject}</p>
            <p style={{ fontSize: 11.5, color: c.muted, marginTop: 2 }}>
              {t.category} · <span style={{ color: PRIORITY_COLOR[t.priority], fontWeight: 700 }}>{t.priority}</span> · {t.raisedByName}
              {showSacco ? ` · ${state.saccos[t.saccoCode]?.name || t.saccoCode}` : ""} · {t.messages.length} message{t.messages.length === 1 ? "" : "s"}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <StatusPill status={t.status} />
            <ChevronRight size={15} color={c.muted} />
          </div>
        </button>
      ))}
    </div>
  );
}

/* ---------- Exports ---------- */

// SACCO staff: every ticket for this SACCO, including ones its members raised.
export function SaccoSupport({ saccoCode }) {
  const { state } = useSakonet();
  const sacco = state.saccos[saccoCode];
  const tickets = Object.values(state.tickets || {}).filter((t) => t.saccoCode === saccoCode);
  return (
    <SupportWorkspace
      tickets={tickets} me="sacco" myName={sacco.name}
      newDefaults={{ saccoCode, raisedByType: "sacco", name: sacco.contact || sacco.name }}
    />
  );
}

// A member, inside a member app: only their own tickets.
// Usage: <MemberSupport saccoCode="BTY" memberNo="BT-3390" accent="#0E4432" />
export function MemberSupport({ saccoCode, memberNo, accent = c.primary }) {
  const { state } = useSakonet();
  const member = (state.membersBySacco[saccoCode] || []).find((m) => m.memberNo === memberNo);
  const name = member?.name || memberNo;
  const tickets = Object.values(state.tickets || {}).filter((t) => t.memberNo === memberNo);
  return (
    <SupportWorkspace
      tickets={tickets} me="member" myName={name} accent={accent}
      newDefaults={{ saccoCode, raisedByType: "member", memberNo, name }}
    />
  );
}

// SAKONET operator: all tickets across the network.
export function OperatorSupport() {
  const { state } = useSakonet();
  const tickets = Object.values(state.tickets || {});
  const n = (s) => tickets.filter((t) => t.status === s).length;
  const urgent = tickets.filter((t) => t.priority === "urgent" && (t.status === "open" || t.status === "in_progress")).length;
  const kpis = [
    ["Open", n("open"), Inbox, c.gold],
    ["In progress", n("in_progress"), Clock, c.primary],
    ["Resolved", n("resolved"), CheckCircle2, c.success],
    ["Urgent & unresolved", urgent, LifeBuoy, c.danger],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {kpis.map(([l, v, Icon, col]) => (
          <div key={l} style={{ background: c.panel, border: `1px solid ${c.line}`, borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11.5, color: c.muted, fontWeight: 600 }}>{l}</span>
              <Icon size={16} color={col} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: c.ink }}>{v}</p>
          </div>
        ))}
      </div>
      <SupportWorkspace tickets={tickets} me="operator" myName="SAKONET Support" isOperator accent={c.primaryDeep} showSacco />
    </div>
  );
}