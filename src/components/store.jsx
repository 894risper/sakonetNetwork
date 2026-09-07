/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from "react";

/* -----------------------------------------------------------------
   SHARED STORE — with localStorage persistence
   Data automatically saves to localStorage and loads on refresh
----------------------------------------------------------------- */

const STORAGE_KEY = "sakonet_store_v11";

const now = () => new Date().toLocaleTimeString("en-KE", { hour12: false });

// ---------- Seed data (one continuous story across all three apps) ----------
const defaultInitialState = {
  saccos: {
    MKU: { code: "MKU", name: "Mkulima SACCO", contact: "Esther Nyokabi", email: "admin@mkulima.co.ke", phone: "0700000000", registrationNo: "SACCO-MKU-001", networkPin: "482913", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 0 },
    BTY: { code: "BTY", name: "Beauty SACCO", contact: "Halima Juma", email: "admin@beautysacco.co.ke", phone: "0711000000", registrationNo: "SACCO-BTY-001", networkPin: "615204", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 0 },
    JEN: { code: "JEN", name: "Jenga SACCO", contact: "Brian Otieno", email: "admin@jenga.co.ke", phone: "0722000000", registrationNo: "SACCO-JEN-001", networkPin: "734128", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 200000 },
    BAR: { code: "BAR", name: "Baraka SACCO", contact: "Consolata Wanjiru", email: "admin@baraka.co.ke", phone: "0733000000", registrationNo: "SACCO-BAR-001", networkPin: "891306", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 180000 },
    GT10: { code: "GT10", name: "GT10 SACCO", contact: "GT10 Administrator", email: "admin@gt10sacco.co.ke", phone: "0700100010", registrationNo: "GT10-001", networkPin: "246810", status: "pending", onboarded: false, joined: null, totalFloat: 0, locked: 0 },
  },

  membersBySacco: {
    MKU: [
      { memberNo: "MK-07741", name: "David Kamau", savings: 50000, shares: 62000, pin: "123456", phone: "0700 556 812" },
      { memberNo: "MK-05521", name: "Mary Akinyi", savings: 315000, shares: 44000, capacity: 250000 },
      { memberNo: "MK-01123", name: "Otieno Kamau", savings: 612000, shares: 91000, capacity: 90000 },
      { memberNo: "MK-06210", name: "Peter Mwenda", savings: 172000, shares: 26000, capacity: 90000 },
      { memberNo: "MK-01987", name: "Grace Wambui", savings: 205000, shares: 30000, capacity: 60000 },
    ],
    BTY: [
      { memberNo: "BT-3390", name: "Joseph Otieno", savings: 640000, shares: 320000, capacity: 320000, pin: "654321", phone: "0712 000 339" },
      { memberNo: "BT-1001", name: "Daniel Kiptoo", savings: 240000, shares: 41000, capacity: 150000 },
      { memberNo: "BT-1002", name: "Fatuma Ali", savings: 310000, shares: 52000, capacity: 180000 },
      { memberNo: "BT-1003", name: "Esther Nduta", savings: 190000, shares: 28000, capacity: 70000 },
    ],
    JEN: [
      { memberNo: "JN-2001", name: "Brian Otieno", savings: 420000, shares: 88000, capacity: 200000, pin: "111222", phone: "0722 000 001" },
      { memberNo: "JN-2002", name: "Caroline Njeri", savings: 260000, shares: 51000, capacity: 140000 },
      { memberNo: "JN-2003", name: "Felix Mutiso", savings: 190000, shares: 33000, capacity: 220000 },
      { memberNo: "JN-2004", name: "Michael Wafula", savings: 230000, shares: 45000, pin: "202404", phone: "0722 445 810" },
    ],
    BAR: [
      { memberNo: "BR-3001", name: "Consolata Wanjiru", savings: 355000, shares: 70000, capacity: 180000, pin: "333444", phone: "0733 000 001" },
      { memberNo: "BR-3002", name: "Dennis Kiprono", savings: 275000, shares: 46000, capacity: 130000 },
      { memberNo: "BR-3003", name: "Agnes Wairimu", savings: 210000, shares: 39000, capacity: 100000 },
      { memberNo: "BR-3004", name: "Naomi Chepkoech", savings: 300000, shares: 60000, capacity: 300000, pin: "303040", phone: "0733 552 671" },
    ],
    GT10: [],
  },

  loans: {
    "L-DEMO-JB1": { id: "L-DEMO-JB1", borrowerMemberNo: "JN-2004", borrowerSacco: "JEN", product: "External Guaranteed Loan (Sakonet Boresha)", amount: 180000, term: 24, purpose: "Working capital", stage: "disbursed", repayment: "pending", guarantors: [{ memberNo: "BR-3004", name: "Naomi Chepkoech", sacco: "BAR", mode: "sakonet", amount: 180000, status: "secured" }] },
    "L-DEMO-JB2": { id: "L-DEMO-JB2", borrowerMemberNo: "BR-3002", borrowerSacco: "BAR", product: "External Guaranteed Loan (Sakonet Boresha)", amount: 120000, term: 24, purpose: "School fees", stage: "committee", repayment: "pending", guarantors: [{ memberNo: "JN-2002", name: "Caroline Njeri", sacco: "JEN", mode: "sakonet", amount: 80000, status: "secured" }] },
    "L-DEMO-JB3": { id: "L-DEMO-JB3", borrowerMemberNo: "JN-2001", borrowerSacco: "JEN", product: "External Guaranteed Loan (Sakonet Boresha)", amount: 240000, term: 36, purpose: "Business expansion", stage: "guarantors", repayment: "pending", guarantors: [{ memberNo: "BR-3002", name: "Dennis Kiprono", sacco: "BAR", mode: "sakonet", amount: 100000, status: "delivered" }] },
    "L-DEMO-JB4": { id: "L-DEMO-JB4", borrowerMemberNo: "BR-3001", borrowerSacco: "BAR", product: "External Guaranteed Loan (Sakonet Boresha)", amount: 150000, term: 24, purpose: "Equipment purchase", stage: "arrears", repayment: "arrears", guarantors: [{ memberNo: "JN-2003", name: "Felix Mutiso", sacco: "JEN", mode: "sakonet", amount: 120000, status: "secured" }] },
    "L-DEMO-JB5": { id: "L-DEMO-JB5", borrowerMemberNo: "JN-2003", borrowerSacco: "JEN", product: "External Guaranteed Loan (Sakonet Boresha)", amount: 90000, term: 12, purpose: "Emergency working capital", stage: "repaid", repayment: "repaid", guarantors: [{ memberNo: "BR-3003", name: "Agnes Wairimu", sacco: "BAR", mode: "sakonet", amount: 60000, status: "secured" }] },
  },

  requests: {
    "GR-DEMO-JB1": { id: "GR-DEMO-JB1", loanId: "L-DEMO-JB1", borrowerSacco: "JEN", borrowerMemberNo: "JN-2004", guarantorSacco: "BAR", guarantorMemberNo: "BR-3004", amount: 180000, stage: "member_notified_by_mkulima", borrowerName: "Michael Wafula", guarantorName: "Naomi Chepkoech", loanAmount: 180000, product: "External Guaranteed Loan (Sakonet Boresha)" },
    "GR-DEMO-JB2": { id: "GR-DEMO-JB2", loanId: "L-DEMO-JB2", borrowerSacco: "BAR", borrowerMemberNo: "BR-3002", guarantorSacco: "JEN", guarantorMemberNo: "JN-2002", amount: 80000, stage: "sacco_confirmation_received", borrowerName: "Dennis Kiprono", guarantorName: "Caroline Njeri", loanAmount: 120000, product: "External Guaranteed Loan (Sakonet Boresha)" },
    "GR-DEMO-JB3": { id: "GR-DEMO-JB3", loanId: "L-DEMO-JB3", borrowerSacco: "JEN", borrowerMemberNo: "JN-2001", guarantorSacco: "BAR", guarantorMemberNo: "BR-3002", amount: 100000, stage: "notified", borrowerName: "Brian Otieno", guarantorName: "Dennis Kiprono", loanAmount: 240000, product: "External Guaranteed Loan (Sakonet Boresha)" },
    "GR-DEMO-JB4": { id: "GR-DEMO-JB4", loanId: "L-DEMO-JB4", borrowerSacco: "BAR", borrowerMemberNo: "BR-3001", guarantorSacco: "JEN", guarantorMemberNo: "JN-2003", amount: 120000, stage: "sacco_confirmation_received", borrowerName: "Consolata Wanjiru", guarantorName: "Felix Mutiso", loanAmount: 150000, product: "External Guaranteed Loan (Sakonet Boresha)" },
    "GR-DEMO-JB5": { id: "GR-DEMO-JB5", loanId: "L-DEMO-JB5", borrowerSacco: "JEN", borrowerMemberNo: "JN-2003", guarantorSacco: "BAR", guarantorMemberNo: "BR-3003", amount: 60000, stage: "sacco_received_confirmation", borrowerName: "Felix Mutiso", guarantorName: "Agnes Wairimu", loanAmount: 90000, product: "External Guaranteed Loan (Sakonet Boresha)" },
  },
  guarantees: {
    "G-DEMO-JB1": { id: "G-DEMO-JB1", requestId: "GR-DEMO-JB1", loanId: "L-DEMO-JB1", borrowerSacco: "JEN", borrowerMemberNo: "JN-2004", guarantorSacco: "BAR", guarantorMemberNo: "BR-3004", amount: 180000, status: "performing", borrowerName: "Michael Wafula", guarantorName: "Naomi Chepkoech" },
    "G-DEMO-JB2": { id: "G-DEMO-JB2", requestId: "GR-DEMO-JB2", loanId: "L-DEMO-JB2", borrowerSacco: "BAR", borrowerMemberNo: "BR-3002", guarantorSacco: "JEN", guarantorMemberNo: "JN-2002", amount: 80000, status: "performing", borrowerName: "Dennis Kiprono", guarantorName: "Caroline Njeri" },
    "G-DEMO-JB4": { id: "G-DEMO-JB4", requestId: "GR-DEMO-JB4", loanId: "L-DEMO-JB4", borrowerSacco: "BAR", borrowerMemberNo: "BR-3001", guarantorSacco: "JEN", guarantorMemberNo: "JN-2003", amount: 120000, status: "claimed", borrowerName: "Consolata Wanjiru", guarantorName: "Felix Mutiso" },
    "G-DEMO-JB5": { id: "G-DEMO-JB5", requestId: "GR-DEMO-JB5", loanId: "L-DEMO-JB5", borrowerSacco: "JEN", borrowerMemberNo: "JN-2003", guarantorSacco: "BAR", guarantorMemberNo: "BR-3003", amount: 60000, status: "released", borrowerName: "Felix Mutiso", guarantorName: "Agnes Wairimu" },
  },
  claims: {
    "CLM-G-DEMO-JB4": { id: "CLM-G-DEMO-JB4", guaranteeId: "G-DEMO-JB4", amount: 120000, status: "pending" },
  },

  notifications: {
    "MK-07741": [],
    "BT-3390": [],
    "JN-2004": [],
    "BR-3004": [],
    "JN-2001": [], "JN-2002": [], "JN-2003": [],
    "BR-3001": [], "BR-3002": [], "BR-3003": [],
  },

  auditLog: [],
};

// Load initial state from localStorage or use default
function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with default to ensure all keys exist
      const merged = {
        ...defaultInitialState,
        ...parsed,
        // Deep merge for nested objects
        saccos: { ...defaultInitialState.saccos, ...parsed.saccos },
        membersBySacco: { ...defaultInitialState.membersBySacco, ...parsed.membersBySacco },
        loans: { ...defaultInitialState.loans, ...parsed.loans },
        requests: { ...defaultInitialState.requests, ...parsed.requests },
        guarantees: { ...defaultInitialState.guarantees, ...parsed.guarantees },
        claims: { ...defaultInitialState.claims, ...parsed.claims },
        notifications: { ...defaultInitialState.notifications, ...parsed.notifications },
      };
      // GT10 is intentionally a clean onboarding target for every fresh demo.
      // Do not carry forward old GT10 members/loan data from an earlier demo build.
      merged.membersBySacco.GT10 = [];
      merged.notifications = Object.fromEntries(Object.entries(merged.notifications).filter(([k]) => !k.startsWith("GT-")));
      merged.saccos.GT10 = { ...defaultInitialState.saccos.GT10, ...(parsed.saccos?.GT10 || {}), onboarded: Boolean(parsed.saccos?.GT10?.onboarded), status: parsed.saccos?.GT10?.onboarded ? "active" : "pending" };
      return merged;
    }
  } catch (e) {
    console.warn("Failed to load saved state:", e);
  }
  return defaultInitialState;
}

function findMember(state, saccoCode, memberNo) {
  return (state.membersBySacco[saccoCode] || []).find((m) => m.memberNo === memberNo);
}

function makeNotificationId() {
  const timePart = Date.now().toString(36);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint32Array(2);
    crypto.getRandomValues(bytes);
    const randomPart = Array.from(bytes, (value) => value.toString(16).padStart(8, "0")).join("");
    return `n${timePart}${randomPart}`;
  }

  return `n${timePart}${Date.now().toString(16)}`;
}

function pushNotification(notifications, memberNo, notif) {
  const list = notifications[memberNo] || [];
  return { ...notifications, [memberNo]: [{ id: makeNotificationId(), unread: true, time: "just now", ...notif }, ...list] };
}

const updateLoan = (state, loanId, update) => {
  const loan = state.loans[loanId];
  if (!loan) return state;
  return { ...state, loans: { ...state.loans, [loanId]: update(loan) } };
};

const updateSacco = (state, saccoCode, update) => {
  const sacco = state.saccos[saccoCode];
  if (!sacco) return state;
  return { ...state, saccos: { ...state.saccos, [saccoCode]: update(sacco) } };
};

function makeRequestId() {
  const timePart = Date.now().toString(36);
  
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const randomPart = (bytes[0] >>> 0).toString(36).padStart(6, "0");
    return `GR-${timePart}-${randomPart}`;
  }

  const fallbackSeed = Date.now() ^ (typeof performance !== "undefined" ? Math.floor(performance.now() * 1000) : 0);
  const randomPart = (fallbackSeed >>> 0).toString(36).padStart(6, "0");
  return `GR-${timePart}-${randomPart}`;
}

function makeLoanId() {
  const timePart = Date.now().toString(36);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const randomPart = (bytes[0] >>> 0).toString(36).padStart(6, "0");
    return `L-${timePart}-${randomPart}`;
  }

  const fallbackSeed = Date.now() ^ (typeof performance !== "undefined" ? Math.floor(performance.now() * 1000) : 0);
  const randomPart = (fallbackSeed >>> 0).toString(36).padStart(6, "0");
  return `L-${timePart}-${randomPart}`;
}

const reducerHandlers = {
  "SACCO/CREATE": (state, { sacco, member }) => ({
    ...state,
    saccos: { ...state.saccos, [sacco.code]: sacco },
    membersBySacco: { ...state.membersBySacco, [sacco.code]: member ? [member] : [] },
    notifications: member ? { ...state.notifications, [member.memberNo]: [] } : state.notifications,
  }),
  "LOAN/CREATE": (state, { loan }) => ({ ...state, loans: { ...state.loans, [loan.id]: loan } }),

  "REQUEST/CREATE": (state, { request }) => ({ ...state, requests: { ...state.requests, [request.id]: request } }),
  
  "REQUEST/STAGE": (state, { requestId, stage, extra = {} }) => {
    const req = state.requests[requestId];
    return req ? {
      ...state,
      requests: {
        ...state.requests,
        [requestId]: { ...req, stage, ...extra },
      },
    } : state;
  },
  
  "LOAN/GUARANTOR_STATUS": (state, { loanId, memberNo, status }) =>
    updateLoan(state, loanId, (loan) => ({
      ...loan,
      guarantors: loan.guarantors.map((g) => (g.memberNo === memberNo ? { ...g, status } : g)),
    })),

  "MEMBER/CAPACITY_RESERVE": (state, { saccoCode, memberNo, amount }) => {
    const members = state.membersBySacco[saccoCode] || [];
    const exists = members.some((m) => m.memberNo === memberNo);
    if (!exists) return state;
    return {
      ...state,
      membersBySacco: {
        ...state.membersBySacco,
        [saccoCode]: members.map((m) =>
          m.memberNo === memberNo
            ? { ...m, capacity: Math.max(0, Number(m.capacity || 0) - Number(amount || 0)) }
            : m
        ),
      },
    };
  },

  // Reverses MEMBER/CAPACITY_RESERVE — used when Beauty (or any guarantor
  // SACCO) staff decide not to confirm a member's acceptance, so the
  // member's guarantee capacity isn't left permanently locked up.
  "MEMBER/CAPACITY_RELEASE": (state, { saccoCode, memberNo, amount }) => {
    const members = state.membersBySacco[saccoCode] || [];
    const exists = members.some((m) => m.memberNo === memberNo);
    if (!exists) return state;
    return {
      ...state,
      membersBySacco: {
        ...state.membersBySacco,
        [saccoCode]: members.map((m) =>
          m.memberNo === memberNo
            ? { ...m, capacity: Number(m.capacity || 0) + Number(amount || 0) }
            : m
        ),
      },
    };
  },
  
  "LOAN/ADD_GUARANTOR": (state, { loanId, guarantor }) =>
    updateLoan(state, loanId, (loan) => ({ ...loan, guarantors: [...loan.guarantors, guarantor] })),
  
  "LOAN/STAGE": (state, { loanId, stage }) => updateLoan(state, loanId, (loan) => ({ ...loan, stage })),

  // Re-derives coverage from whatever is the CURRENT reducer state at the
  // moment this action is processed — never from a value captured earlier
  // in a component closure. Safe to dispatch from a delayed setTimeout.
  "LOAN/CHECK_COVERAGE": (state, { loanId }) => {
    const loan = state.loans[loanId];
    if (!loan || loan.stage !== "guarantors") return state;
    const borrower = findMember(state, loan.borrowerSacco, loan.borrowerMemberNo);
    const savingsCover = Math.min(Number(borrower?.savings || 0), loan.amount);
    const guarantorCover = (loan.guarantors || [])
      .filter((g) => g.status === "accepted" || g.status === "secured")
      .reduce((sum, g) => sum + g.amount, 0);
    if (savingsCover + guarantorCover < loan.amount) return state;
    return updateLoan(state, loanId, (l) => ({ ...l, stage: "committee" }));
  },

  "LOAN/ADVANCE_TO_APPROVED": (state, { loanId }) => {
    const loan = state.loans[loanId];
    if (!loan || loan.stage !== "committee") return state;
    return updateLoan(state, loanId, (l) => ({ ...l, stage: "approved" }));
  },
  
  "LOAN/REPAYMENT": (state, { loanId, repayment }) => updateLoan(state, loanId, (loan) => ({ ...loan, repayment })),
  
  "FLOAT/LOCK": (state, { saccoCode, amount }) =>
    updateSacco(state, saccoCode, (sacco) => ({ ...sacco, locked: sacco.locked + amount })),
  
  "FLOAT/RELEASE": (state, { saccoCode, amount }) =>
    updateSacco(state, saccoCode, (sacco) => ({ ...sacco, locked: Math.max(0, sacco.locked - amount) })),
  
  "FLOAT/SETTLE": (state, { saccoCode, amount }) =>
    updateSacco(state, saccoCode, (sacco) => ({
      ...sacco,
      locked: Math.max(0, sacco.locked - amount),
      totalFloat: sacco.totalFloat - amount,
    })),
  
  "GUARANTEE/CREATE": (state, { guarantee }) => ({ ...state, guarantees: { ...state.guarantees, [guarantee.id]: guarantee } }),
  
  "GUARANTEE/STATUS": (state, { id, status, extra }) => {
    const g = state.guarantees[id];
    if (!g) return state;
    return { ...state, guarantees: { ...state.guarantees, [id]: { ...g, status, ...extra } } };
  },
  
  "CLAIM/CREATE": (state, { claim }) => ({ ...state, claims: { ...state.claims, [claim.id]: claim } }),
  
  "CLAIM/SETTLE": (state, { id, settlementId }) => {
    const claim = state.claims[id];
    if (!claim) return state;
    return { ...state, claims: { ...state.claims, [id]: { ...claim, status: "settled", settlementId } } };
  },
  
  "NOTIFY": (state, { memberNo, notification }) => ({
    ...state,
    notifications: pushNotification(state.notifications, memberNo, notification),
  }),
  
  "NOTIFY/READ_ALL": (state, { memberNo }) => {
    const list = (state.notifications[memberNo] || []).map((n) => ({ ...n, unread: false }));
    return { ...state, notifications: { ...state.notifications, [memberNo]: list } };
  },
  
  "AUDIT": (state, { entry }) => ({ ...state, auditLog: [...state.auditLog, { ...entry, time: now() }] }),
};

function reducer(state, action) {
  const reduce = reducerHandlers[action.type];
  return reduce ? reduce(state, action) : state;
}

const SakonetContext = createContext(null);

export function SakonetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  // Save to localStorage whenever state changes
  useEffect(() => {
    window.__sakonetState = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }, [state]);

  const log = useCallback((entry) => dispatch({ type: "AUDIT", entry }), []);

  const notify = useCallback((memberNo, notification) => {
    dispatch({ type: "NOTIFY", memberNo, notification });
  }, []);

  const markRead = useCallback((memberNo) => dispatch({ type: "NOTIFY/READ_ALL", memberNo }), []);

  // ---- createSacco ----
  const createSacco = useCallback(({ name, reg, contact, email, phone }) => {
    if ((name || "").trim().toUpperCase().replace(/\s+/g, " ") !== "GT10 SACCO") return { ok: false, error: "Demo configuration: only GT10 SACCO can be onboarded on SAKONET." };
    if (state.saccos.GT10?.onboarded) return { ok: false, error: "GT10 SACCO is already onboarded on SAKONET." };
    const clean = (name || "").trim();
    if (!clean || !reg || !contact || !email || !phone) return { ok: false, error: "Complete all SACCO details." };
    const existing = Object.values(state.saccos).find((s) => s.registrationNo?.toLowerCase() === reg.trim().toLowerCase());
    if (existing && !(existing.code === "GT10" && existing.onboarded === false)) return { ok: false, error: "A SACCO with that registration number already exists." };
    // GT10 already has a pending placeholder in the demo datastore. Live
    // onboarding activates that same record; it must not become GT102/GT103.
    const isGt10 = clean.toUpperCase().replace(/\s+/g, " ") === "GT10 SACCO";
    let code = isGt10 ? "GT10" : clean.replace(/\b(SACCO|CO-OPERATIVE|COOPERATIVE)\b/gi, "").replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "NEW";
    if (!isGt10) {
      let n = 2;
      while (state.saccos[code]) code = `${code}${n++}`;
    }
    const pin = isGt10 ? "246810" : String(Math.floor(100000 + Math.random() * 900000));
    const sacco = { code, name: clean, contact: contact.trim(), email: email.trim(), phone: phone.trim(), registrationNo: reg.trim(), networkPin: pin, apiEndpoint: "/api/v1/sakonet", apiAuth: "X-SACCO-CODE + X-SACCO-PIN", status: "active", onboarded: true, joined: new Date().toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" }), totalFloat: 1000000, locked: 0 };
    const gt10Member = isGt10 ? { memberNo: "GT-1001", name: "Mercy Wambui", savings: 280000, shares: 70000, capacity: 180000, pin: "456789", phone: "0700 100 101" } : null;
    dispatch({ type: "SACCO/CREATE", sacco, member: gt10Member });
    log({ from: "SAKONET Network", to: clean, text: `SACCO onboarded as ${code}. Network PIN issued and KES 1,000,000 guarantee float activated.`, kind: "network" });
    return { ok: true, sacco };
  }, [state, log]);

  // ---- authenticateSaccoApi ----
  // Demo SACCO network access surface:
  // an API authenticated with the SACCO code + network PIN.
  // Jenga and Baraka are intentionally available in the header so the presenter
  // can switch SACCO views while GT10 is the SACCO being added live.
  const authenticateSaccoApi = useCallback((saccoCode, pin) => {
    const sacco = state.saccos[saccoCode];
    if (!sacco || !sacco.onboarded || sacco.status !== "active") return { ok: false, error: "This SACCO is not active on SAKONET yet." };
    if (String(pin || "") !== String(sacco.networkPin || "")) {
      log({ from: saccoCode, to: "SAKONET API", text: "API authentication failed — invalid SACCO network PIN.", kind: "network" });
      return { ok: false, error: "Invalid SACCO network PIN." };
    }
    log({ from: saccoCode, to: "SAKONET API", text: "API authentication successful.", kind: "network" });
    return { ok: true, sacco };
  }, [state, log]);

  // ---- createLoan ----
  // Starts a real loan application. Called once, the first time a
  // borrower moves past the amount step of the apply-loan wizard.
  const createLoan = useCallback(({ borrowerMemberNo, borrowerSacco, product, amount, term, purpose }) => {
    const id = makeLoanId();
    const borrower = findMember(state, borrowerSacco, borrowerMemberNo);
    const borrowerSaccoName = state.saccos[borrowerSacco]?.name || borrowerSacco;

    dispatch({
      type: "LOAN/CREATE",
      loan: {
        id,
        borrowerMemberNo,
        borrowerSacco,
        product,
        amount,
        term,
        purpose,
        stage: "guarantors",
        repayment: "pending",
        guarantors: [],
      },
    });

    log({
      from: borrower?.name || "Borrower",
      to: borrowerSaccoName,
      text: `Loan application ${id} started — ${product}, KES ${amount.toLocaleString("en-KE")}.`,
      kind: "internal",
    });

    return id;
  }, [state, log]);

  // ---- addLocalGuarantor ----
  // Same-SACCO guarantors don't need to travel over Sakonet, so they're
  // accepted immediately. If that's enough to fully cover the loan, it
  // advances to committee review the same way a fully-covered Sakonet
  // guarantee does.
  const addLocalGuarantor = useCallback((loanId, guarantor) => {
    const loan = state.loans[loanId];
    if (!loan) return;

    dispatch({
      type: "LOAN/ADD_GUARANTOR",
      loanId,
      guarantor: { ...guarantor, mode: "local", status: "accepted" },
    });

    // Dispatched, not computed here — LOAN/CHECK_COVERAGE reads the coverage
    // off the reducer's own state when it runs, so it always sees the
    // ADD_GUARANTOR update above even though this local `loan`/`state`
    // reference is a snapshot from before that dispatch was applied.
    dispatch({ type: "LOAN/CHECK_COVERAGE", loanId });
    setTimeout(() => dispatch({ type: "LOAN/ADVANCE_TO_APPROVED", loanId }), 900);
  }, [state]);

  // ---- sendGuarantorRequest ----
  const sendGuarantorRequest = useCallback(({ loanId, guarantorSaccoCode, guarantorMemberNo, amount }) => {
    const loan = state.loans[loanId];
    if (!loan) return { ok: false, error: "Loan not found." };

    const member = findMember(state, guarantorSaccoCode, guarantorMemberNo);
    if (!member) {
      return {
        ok: false,
        error: `No member found with that number at ${state.saccos[guarantorSaccoCode]?.name || guarantorSaccoCode}.`,
      };
    }
    if (!amount || amount <= 0) return { ok: false, error: "Enter a valid guarantee amount." };
    const borrower = findMember(state, loan.borrowerSacco, loan.borrowerMemberNo);
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;
    const guarantorSaccoName = state.saccos[guarantorSaccoCode].name;
    const requestId = makeRequestId();

    dispatch({
      type: "REQUEST/CREATE",
      request: {
        id: requestId,
        loanId,
        borrowerSacco: loan.borrowerSacco,
        borrowerMemberNo: loan.borrowerMemberNo,
        guarantorSacco: guarantorSaccoCode,
        guarantorMemberNo,
        amount,
        stage: "submitted",
        borrowerName: borrower?.name,
        guarantorName: member.name,
        loanAmount: loan.amount,
        product: loan.product,
      },
    });

    dispatch({
      type: "LOAN/ADD_GUARANTOR",
      loanId,
      guarantor: {
        memberNo: guarantorMemberNo,
        name: member.name,
        sacco: guarantorSaccoCode,
        mode: "sakonet",
        amount,
        status: "submitted",
      },
    });

    log({
      from: borrower?.name || "Borrower",
      to: borrowerSaccoName,
      text: `Guarantee request ${requestId} submitted for ${member.name} at ${guarantorSaccoName}, KES ${amount.toLocaleString("en-KE")} — awaiting SACCO review.`,
      kind: "internal",
    });

    return { ok: true, requestId };
  }, [state, log]);

  // ---- reviewBeautyIncomingRequest ----
  // Beauty SACCO owns the second operational gate. After Mkulima staff
  // approve and SAKONET delivers the request, Beauty staff must verify the
  // named member and their available guarantee capacity before the member
  // is notified. SAKONET only transports the decision.
  const reviewBeautyIncomingRequest = useCallback((requestId, decision, reason = "") => {
    const req = state.requests[requestId];
    if (!req || req.stage !== "beauty_sacco_review") {
      return { ok: false, error: "Request is not awaiting Beauty SACCO staff review." };
    }

    const borrowerSaccoName = state.saccos[req.borrowerSacco]?.name || req.borrowerSacco;
    const guarantorSaccoName = state.saccos[req.guarantorSacco]?.name || req.guarantorSacco;
    const member = findMember(state, req.guarantorSacco, req.guarantorMemberNo);

    if (decision === "decline") {
      const declineReason = String(reason || "").trim();
      if (!declineReason) return { ok: false, error: "A decline reason is required." };

      dispatch({
        type: "REQUEST/STAGE",
        requestId,
        stage: "rejected",
        extra: {
          declineReason,
          declinedBy: guarantorSaccoName,
          declinedAt: now(),
          beautyReview: "declined",
        },
      });
      dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
      log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${requestId} — Beauty SACCO declined the incoming guarantor request. Reason: ${declineReason}`, kind: "network" });
      log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — Beauty SACCO's decline delivered to ${borrowerSaccoName}.`, kind: "network" });
      notify(req.borrowerMemberNo, {
        type: "sacco",
        title: "Guarantee request declined",
        body: `${guarantorSaccoName} declined the guarantee request. ${declineReason}`,
      });
      return { ok: true };
    }

    // Beauty's staff approval includes the member/capacity check.
    if (!member) {
      return { ok: false, error: "The named guarantor could not be found in Beauty SACCO's member register." };
    }
    if (Number(req.amount) > Number(member.capacity || 0)) {
      return {
        ok: false,
        error: `Insufficient available guarantee capacity. Available: KES ${Number(member.capacity || 0).toLocaleString("en-KE")}.`,
      };
    }

    dispatch({
      type: "REQUEST/STAGE",
      requestId,
      stage: "notified",
      extra: {
        beautyReview: "approved",
        beautyReviewedAt: now(),
        memberNotifiedAt: now(),
      },
    });
    dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "delivered" });

    log({ from: guarantorSaccoName, to: guarantorSaccoName, text: `${requestId} — Beauty SACCO verified ${member.name} and approved the request for member notification.`, kind: "internal" });
    log({ from: guarantorSaccoName, to: member.name, text: `${guarantorSaccoName} presented guarantee request ${requestId} to ${member.name}.`, kind: "internal" });
    notify(req.guarantorMemberNo, {
      type: "sacco",
      title: `New guarantee request from ${borrowerSaccoName}`,
      body: `${req.borrowerName || "A member"} at ${borrowerSaccoName} requested you as guarantor for KES ${req.amount.toLocaleString("en-KE")}.`,
      requestId,
    });

    return { ok: true };
  }, [state, log, notify]);

  // ---- reviewGuarantorRequest ----
  // Mkulima SACCO staff owns the first operational decision. SAKONET only
  // routes the request after staff approval; it never approves it, and it
  // never talks to a member directly — SAKONET is a SACCO-to-SACCO rail
  // only. Once Mkulima approves, SAKONET's job ends at delivering the
  // request to Beauty SACCO; Beauty staff then own the incoming verification
  // gate before the member is notified.
  const reviewGuarantorRequest = useCallback((requestId, decision, reason = "") => {
    const req = state.requests[requestId];
    if (!req || req.stage !== "submitted") return { ok: false, error: "Request is not awaiting Mkulima staff review." };

    const borrowerSaccoName = state.saccos[req.borrowerSacco]?.name || req.borrowerSacco;
    const guarantorSaccoName = state.saccos[req.guarantorSacco]?.name || req.guarantorSacco;

    if (decision === "decline") {
      const declineReason = String(reason || "").trim();
      if (!declineReason) return { ok: false, error: "A decline reason is required." };

      dispatch({
        type: "REQUEST/STAGE",
        requestId,
        stage: "declined",
        extra: { declineReason, declinedBy: borrowerSaccoName, declinedAt: now() },
      });
      dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
      log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${requestId} declined by SACCO staff before network routing. Reason: ${declineReason}`, kind: "internal" });
      notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee request declined", body: `${borrowerSaccoName} declined the guarantee request. Reason: ${declineReason}` });
      dispatch({ type: "REQUEST/STAGE", requestId, stage: "rejected", extra: { completedAt: now() } });
      return { ok: true };
    }

    dispatch({ type: "REQUEST/STAGE", requestId, stage: "network_routed", extra: { approvedBy: borrowerSaccoName, approvedAt: now() } });
    dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "network_routed" });
    log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${requestId} approved by SACCO staff and routed to ${guarantorSaccoName} — KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });
    // SAKONET's role stops at delivery. Beauty SACCO now owns the next
    // staff gate: verify the member and capacity before notifying them.
    log({ from: "SAKONET Network", to: guarantorSaccoName, text: `${requestId} — request delivered to ${guarantorSaccoName} for staff verification.`, kind: "network" });
    dispatch({ type: "REQUEST/STAGE", requestId, stage: "beauty_sacco_review" });

    return { ok: true };
  }, [state, log, notify]);

  // ---- respondToRequest ----
  // Beauty member -> Beauty SACCO -> SAKONET -> Mkulima SACCO -> Mkulima member.
  // The guarantor's own SACCO staff no longer need to re-confirm a member's
  // acceptance with a separate approval click — once the member accepts,
  // the relay to SAKONET, the borrower's SACCO, and the borrower proceeds
  // automatically. Beauty SACCO and Mkulima SACCO staff can both see the
  // member's decision land in their consoles in real time; a decline still
  // needs no extra staff gate either, so both paths now behave the same way.
  const respondToRequest = useCallback((requestId, decision, pin) => {
    const req = state.requests[requestId];
    if (!req || req.stage !== "notified") return { ok: false, error: "This request is not awaiting the member's decision." };

    const member = findMember(state, req.guarantorSacco, req.guarantorMemberNo);
    if (!member) return { ok: false, error: "Guarantor member not found." };
    if (String(pin || "") !== String(member.pin || "")) return { ok: false, error: "Invalid SACCO member PIN." };

    const borrowerSaccoName = state.saccos[req.borrowerSacco]?.name || req.borrowerSacco;
    const guarantorSaccoName = state.saccos[req.guarantorSacco]?.name || req.guarantorSacco;
    const accepted = decision === "accepted";
    const decisionText = accepted ? "accepted" : "declined";

    // 1. Member -> own SACCO. The member's decision is recorded by the
    // guarantor SACCO first; SAKONET is not member-facing.
    dispatch({
      type: "REQUEST/STAGE",
      requestId,
      stage: "member_responded",
      extra: { memberDecision: accepted ? "accepted" : "declined", memberRespondedAt: now() },
    });
    dispatch({
      type: "LOAN/GUARANTOR_STATUS",
      loanId: req.loanId,
      memberNo: req.guarantorMemberNo,
      status: accepted ? "pending_relay" : "rejected",
    });
    if (accepted) {
      dispatch({ type: "MEMBER/CAPACITY_RESERVE", saccoCode: req.guarantorSacco, memberNo: req.guarantorMemberNo, amount: req.amount });
    }
    log({ from: member.name, to: guarantorSaccoName, text: `${member.name} ${decisionText} guarantee ${requestId}. Beauty SACCO has recorded the member decision.`, kind: "internal" });

    if (!accepted) {
      // A decline relays onward automatically — no separate staff gate.
      setTimeout(() => {
        dispatch({
          type: "REQUEST/STAGE",
          requestId,
          stage: "sacco_confirmed_declined",
          extra: { saccoConfirmation: "declined", saccoConfirmedAt: now(), declineReason: "Guarantor member declined the request." },
        });
        log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${guarantorSaccoName} sent official confirmation: ${member.name} declined ${requestId} for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });
      }, 500);

      setTimeout(() => {
        dispatch({
          type: "REQUEST/STAGE",
          requestId,
          stage: "sacco_confirmation_received_declined",
          extra: { confirmationReceivedBy: borrowerSaccoName, confirmationReceivedAt: now() },
        });
        log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — ${guarantorSaccoName}'s official declined confirmation delivered to ${borrowerSaccoName}.`, kind: "network" });
        dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
        notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee request declined", body: `${member.name} at ${guarantorSaccoName} declined the guarantee. ${borrowerSaccoName} can request another guarantor.` });
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "rejected", extra: { completedAt: now() } });
      }, 1000);

      return { ok: true };
    }

    // Accepted: relay onward automatically — no separate Beauty SACCO
    // staff confirmation step. Beauty and Mkulima staff both watch this
    // same relay land in their own consoles (read-only) via the request's
    // stage field; neither has to click anything to make it progress.

    // 2. Beauty SACCO -> SAKONET Network. This is the official SACCO relay,
    // sent automatically the moment the member accepts.
    dispatch({
      type: "REQUEST/STAGE",
      requestId,
      stage: "sacco_confirmed_accepted",
      extra: { saccoConfirmation: "accepted", saccoConfirmedAt: now() },
    });
    log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${guarantorSaccoName} sent official confirmation: ${member.name} accepted ${requestId} for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });

    // 3. SAKONET Network -> Mkulima SACCO. The network console can see
    // this hand-off and its status, but does not make the SACCO decision.
    setTimeout(() => {
      dispatch({
        type: "REQUEST/STAGE",
        requestId,
        stage: "sacco_confirmation_received",
        extra: { confirmationReceivedBy: borrowerSaccoName, confirmationReceivedAt: now() },
      });
      log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — ${guarantorSaccoName}'s official accepted confirmation delivered to ${borrowerSaccoName}.`, kind: "network" });

      // 4. Mkulima SACCO -> its member. Only Mkulima SACCO communicates
      // the final guarantee confirmation to the borrower/member.
      setTimeout(() => {
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_received_confirmation", extra: { saccoRecordedAt: now() } });
        dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "secured" });
        dispatch({ type: "FLOAT/LOCK", saccoCode: req.guarantorSacco, amount: req.amount });
        const guaranteeId = `G-${requestId.split("-")[1]}`;
        dispatch({ type: "GUARANTEE/CREATE", guarantee: { id: guaranteeId, requestId, loanId: req.loanId, borrowerSacco: req.borrowerSacco, borrowerMemberNo: req.borrowerMemberNo, guarantorSacco: req.guarantorSacco, guarantorMemberNo: req.guarantorMemberNo, amount: req.amount, status: "performing", borrowerName: req.borrowerName, guarantorName: req.guarantorName } });
        log({ from: borrowerSaccoName, to: req.borrowerName || "Borrower", text: `Mkulima SACCO received ${guarantorSaccoName}'s confirmation and sent the guarantee confirmation to you. Guarantee secured for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "internal" });
        notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee secured", body: `${borrowerSaccoName} has received and recorded ${guarantorSaccoName}'s confirmation. Your guarantee is now secured for KES ${req.amount.toLocaleString("en-KE")} for your loan.` });
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "member_notified_by_mkulima", extra: { borrowerMemberNotifiedAt: now(), completedAt: now() } });

        // LOAN/CHECK_COVERAGE re-derives coverage from the reducer's own
        // current state when it actually runs, not from `state` captured
        // when respondToRequest was first called — that snapshot is
        // stale by now (two setTimeouts and several dispatches deep), so
        // computing coverage from it here was the reason loans could get
        // stuck and never reach "approved" for disbursement.
        dispatch({ type: "LOAN/CHECK_COVERAGE", loanId: req.loanId });
        setTimeout(() => dispatch({ type: "LOAN/ADVANCE_TO_APPROVED", loanId: req.loanId }), 900);
      }, 500);
    }, 1000);

    return { ok: true };
  }, [state, log, notify]);

  const disburseLoan = useCallback((loanId) => {
    const loan = state.loans[loanId];
    if (!loan) return;

    dispatch({ type: "LOAN/STAGE", loanId, stage: "disbursed" });
    log({
      from: state.saccos[loan.borrowerSacco].name,
      to: "SAKONET Network",
      text: `${loanId} disbursed. Guarantee relationships now active.`,
      kind: "network",
    });

    loan.guarantors.filter((g) => g.mode === "sakonet").forEach((g) => {
      setTimeout(() => {
        log({
          from: "SAKONET Network",
          to: state.saccos[g.sacco].name,
          text: "Guarantee confirmed and recorded.",
          kind: "network",
        });
      }, 400);
    });
  }, [state, log]);

  const simulateDefault = useCallback((loanId) => {
    const loan = state.loans[loanId];
    if (!loan || loan.repayment === "arrears" || loan.repayment === "repaid") return;

    // A default is a loan-level event first; the network then receives
    // the guarantee claim for each still-performing cross-SACCO guarantee.
    dispatch({ type: "LOAN/REPAYMENT", loanId, repayment: "arrears" });
    dispatch({ type: "LOAN/STAGE", loanId, stage: "arrears" });
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;

    Object.values(state.guarantees)
      .filter((g) => g.loanId === loanId && g.status === "performing")
      .forEach((g) => {
        const guarantorSaccoName = state.saccos[g.guarantorSacco].name;
        log({
          from: borrowerSaccoName,
          to: "SAKONET Network",
          text: `${loanId} in default — guarantee ${g.id} claimed.`,
          kind: "network",
        });
        dispatch({ type: "GUARANTEE/STATUS", id: g.id, status: "claimed" });
        dispatch({
          type: "CLAIM/CREATE",
          claim: { id: `CLM-${g.id.split("-")[1]}`, guaranteeId: g.id, amount: g.amount, status: "pending" },
        });
        setTimeout(() => {
          notify(g.guarantorMemberNo, {
            type: "sacco",
            title: "Guarantee alert from your SACCO",
            body: `A loan you guaranteed at ${borrowerSaccoName} has entered arrears.`,
          });
          log({
            from: "SAKONET Network",
            to: guarantorSaccoName,
            text: `Arrears alert forwarded regarding guarantee ${g.id}.`,
            kind: "network",
          });
        }, 500);
      });
  }, [state, log, notify]);

  const settleClaim = useCallback((guaranteeId) => {
    const g = state.guarantees[guaranteeId];
    if (!g) return;

    const claim = Object.values(state.claims).find((cl) => cl.guaranteeId === guaranteeId);
    const settlementId = `SET-${guaranteeId.split("-")[1]}`;
    const borrowerSaccoName = state.saccos[g.borrowerSacco].name;
    const guarantorSaccoName = state.saccos[g.guarantorSacco].name;

    dispatch({ type: "GUARANTEE/STATUS", id: guaranteeId, status: "settled", extra: { settlementId } });
    if (claim) dispatch({ type: "CLAIM/SETTLE", id: claim.id, settlementId });
    dispatch({ type: "FLOAT/SETTLE", saccoCode: g.guarantorSacco, amount: g.amount });

    log({
      from: guarantorSaccoName,
      to: "SAKONET Network",
      text: `KES ${g.amount.toLocaleString("en-KE")} released from reserved float for settlement.`,
      kind: "network",
    });

    setTimeout(() => {
      log({
        from: "SAKONET Network",
        to: borrowerSaccoName,
        text: `Settlement ${settlementId} completed — KES ${g.amount.toLocaleString("en-KE")} transferred.`,
        kind: "network",
      });
    }, 500);

    setTimeout(() => {
      notify(g.guarantorMemberNo, {
        type: "sacco",
        title: "Guarantee called and settled",
        body: `Your guarantee has been used to settle the default. KES ${g.amount.toLocaleString("en-KE")} was paid from your SACCO's float.`,
      });
    }, 900);
  }, [state, log, notify]);

  const simulateRepaid = useCallback((loanId) => {
    const loan = state.loans[loanId];
    if (!loan || loan.repayment === "repaid") return;

    dispatch({ type: "LOAN/REPAYMENT", loanId, repayment: "repaid" });
    dispatch({ type: "LOAN/STAGE", loanId, stage: "repaid" });
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;

    log({
      from: borrowerSaccoName,
      to: "SAKONET Network",
      text: `${loanId} fully repaid.`,
      kind: "network",
    });

    Object.values(state.guarantees)
      .filter((g) => g.loanId === loanId && g.status === "performing")
      .forEach((g) => {
        const guarantorSaccoName = state.saccos[g.guarantorSacco].name;
        dispatch({ type: "GUARANTEE/STATUS", id: g.id, status: "released" });
        dispatch({ type: "FLOAT/RELEASE", saccoCode: g.guarantorSacco, amount: g.amount });

        setTimeout(() => {
          log({
            from: "SAKONET Network",
            to: guarantorSaccoName,
            text: `Guarantee ${g.id} released — KES ${g.amount.toLocaleString("en-KE")} unlocked.`,
            kind: "network",
          });
        }, 500);

        setTimeout(() => {
          notify(g.guarantorMemberNo, {
            type: "sacco",
            title: "Guarantee released",
            body: `The loan you guaranteed has been fully repaid. Your commitment is released.`,
          });
        }, 900);
      });
  }, [state, log, notify]);

  const value = useMemo(() => ({
    state,
    createSacco,
    authenticateSaccoApi,
    createLoan,
    addLocalGuarantor,
    sendGuarantorRequest,
    reviewGuarantorRequest,
    reviewBeautyIncomingRequest,
    respondToRequest,
    disburseLoan,
    simulateDefault,
    settleClaim,
    simulateRepaid,
    notify,
    markRead,
    log,
  }), [state, createSacco, authenticateSaccoApi, createLoan, addLocalGuarantor, sendGuarantorRequest, reviewGuarantorRequest, reviewBeautyIncomingRequest, respondToRequest, disburseLoan, simulateDefault, settleClaim, simulateRepaid, notify, markRead, log]);

  return <SakonetContext.Provider value={value}>{children}</SakonetContext.Provider>;
}

export function useSakonet() {
  const ctx = useContext(SakonetContext);
  if (!ctx) throw new Error("useSakonet must be used inside <SakonetProvider>");
  return ctx;
}