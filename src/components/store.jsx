/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from "react";

const STORAGE_KEY = "sakonet_store_v12"; // bumped — shape changed (sessionAuth, dropped JEN/BAR/GT10)

const now = () => new Date().toLocaleTimeString("en-KE", { hour12: false });

const defaultInitialState = {
  saccos: {
    MKU: { code: "MKU", name: "Mkulima SACCO", contact: "Esther Nyokabi", email: "admin@mkulima.co.ke", phone: "0700000000", registrationNo: "SACCO-MKU-001", networkPin: "482913", apiEndpoint: "/api/v1/sakonet", apiAuth: "X-SACCO-CODE + X-SACCO-PIN", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 0 },
    BTY: { code: "BTY", name: "Beauty SACCO", contact: "Halima Juma", email: "admin@beautysacco.co.ke", phone: "0711000000", registrationNo: "SACCO-BTY-001", networkPin: "615204", apiEndpoint: "/api/v1/sakonet", apiAuth: "X-SACCO-CODE + X-SACCO-PIN", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 0 },
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
      { memberNo: "BT-3390", name: "Phoebe Atieno", savings: 640000, shares: 320000, capacity: 320000, pin: "654321", phone: "0712 000 339" },
      { memberNo: "BT-1001", name: "Daniel Kiptoo", savings: 240000, shares: 41000, capacity: 150000 },
      { memberNo: "BT-1002", name: "Fatuma Ali", savings: 310000, shares: 52000, capacity: 180000 },
      { memberNo: "BT-1003", name: "Esther Nduta", savings: 190000, shares: 28000, capacity: 70000 },
    ],
  },

  loans: {},
  requests: {},
  guarantees: {},
  claims: {},

  notifications: {
    "MK-07741": [],
    "BT-3390": [],
  },

  // Persisted per-SACCO login flags for SaccoNetworkLogin (and anywhere
  // else that gates a view behind the SACCO network PIN). Lives in the
  // same store as everything else, so it rides along with the existing
  // localStorage persistence below — log in once, stay logged in across
  // navigation and page refresh until explicitly logged out.
  sessionAuth: {},

  auditLog: [],
};

// Shared by both the initial page load and the cross-tab live-sync
// handler below — always merge onto defaultInitialState so a stored
// blob from an older shape (or a partial write) never drops a key the
// rest of the app expects to exist.
function mergeWithDefaults(parsed) {
  return {
    ...defaultInitialState,
    ...parsed,
    saccos: { ...defaultInitialState.saccos, ...parsed.saccos },
    membersBySacco: { ...defaultInitialState.membersBySacco, ...parsed.membersBySacco },
    loans: { ...defaultInitialState.loans, ...parsed.loans },
    requests: { ...defaultInitialState.requests, ...parsed.requests },
    guarantees: { ...defaultInitialState.guarantees, ...parsed.guarantees },
    claims: { ...defaultInitialState.claims, ...parsed.claims },
    notifications: { ...defaultInitialState.notifications, ...parsed.notifications },
    sessionAuth: { ...defaultInitialState.sessionAuth, ...parsed.sessionAuth },
  };
}

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return mergeWithDefaults(JSON.parse(saved));
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
  return `GR-${timePart}-${(fallbackSeed >>> 0).toString(36).padStart(6, "0")}`;
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
  return `L-${timePart}-${(fallbackSeed >>> 0).toString(36).padStart(6, "0")}`;
}

const reducerHandlers = {
  "LOAN/CREATE": (state, { loan }) => ({ ...state, loans: { ...state.loans, [loan.id]: loan } }),

  "REQUEST/CREATE": (state, { request }) => ({ ...state, requests: { ...state.requests, [request.id]: request } }),

  "REQUEST/STAGE": (state, { requestId, stage, extra = {} }) => {
    const req = state.requests[requestId];
    return req ? { ...state, requests: { ...state.requests, [requestId]: { ...req, stage, ...extra } } } : state;
  },

  "LOAN/GUARANTOR_STATUS": (state, { loanId, memberNo, status }) =>
    updateLoan(state, loanId, (loan) => ({
      ...loan,
      guarantors: loan.guarantors.map((g) => (g.memberNo === memberNo ? { ...g, status } : g)),
    })),

  "MEMBER/CAPACITY_RESERVE": (state, { saccoCode, memberNo, amount }) => {
    const members = state.membersBySacco[saccoCode] || [];
    if (!members.some((m) => m.memberNo === memberNo)) return state;
    return {
      ...state,
      membersBySacco: {
        ...state.membersBySacco,
        [saccoCode]: members.map((m) =>
          m.memberNo === memberNo ? { ...m, capacity: Math.max(0, Number(m.capacity || 0) - Number(amount || 0)) } : m
        ),
      },
    };
  },

  "MEMBER/CAPACITY_RELEASE": (state, { saccoCode, memberNo, amount }) => {
    const members = state.membersBySacco[saccoCode] || [];
    if (!members.some((m) => m.memberNo === memberNo)) return state;
    return {
      ...state,
      membersBySacco: {
        ...state.membersBySacco,
        [saccoCode]: members.map((m) =>
          m.memberNo === memberNo ? { ...m, capacity: Number(m.capacity || 0) + Number(amount || 0) } : m
        ),
      },
    };
  },

  "LOAN/ADD_GUARANTOR": (state, { loanId, guarantor }) =>
    updateLoan(state, loanId, (loan) => ({ ...loan, guarantors: [...loan.guarantors, guarantor] })),

  "LOAN/STAGE": (state, { loanId, stage }) => updateLoan(state, loanId, (loan) => ({ ...loan, stage })),

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

  // Debits the guarantor SACCO when a claim is settled: releases the
  // committed portion (locked) AND removes it from that SACCO's own
  // totalFloat, since the money is actually leaving their book to pay
  // out the claim. Paired with FLOAT/CREDIT below, which is what
  // actually receives that money on the borrower SACCO's side — without
  // that pairing this looked like money vanishing from the network
  // instead of just changing hands.
  "FLOAT/SETTLE": (state, { saccoCode, amount }) =>
    updateSacco(state, saccoCode, (sacco) => ({
      ...sacco,
      locked: Math.max(0, sacco.locked - amount),
      totalFloat: sacco.totalFloat - amount,
    })),

  // Credits a SACCO's totalFloat only (never touches locked) — used to
  // land the settled amount on the borrower SACCO's side when a claim
  // is settled, so the transfer is a wash across the network: one
  // SACCO's totalFloat goes down by exactly what the other's goes up
  // by, and once nothing is locked anywhere the network's available
  // float is back to its full original total.
  "FLOAT/CREDIT": (state, { saccoCode, amount }) =>
    updateSacco(state, saccoCode, (sacco) => ({ ...sacco, totalFloat: sacco.totalFloat + amount })),

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

  // ---- Persistent SACCO network login ----
  "AUTH/LOGIN": (state, { saccoCode }) => ({
    ...state,
    sessionAuth: { ...state.sessionAuth, [saccoCode]: true },
  }),
  "AUTH/LOGOUT": (state, { saccoCode }) => {
    const next = { ...state.sessionAuth };
    delete next[saccoCode];
    return { ...state, sessionAuth: next };
  },

  // Cross-tab live sync — see the `storage` event listener in
  // SakonetProvider below. Replaces the entire state wholesale with
  // whatever the other tab just wrote to localStorage, so every open
  // window converges on the same data without a manual refresh.
  "STATE/REPLACE": (_state, { nextState }) => nextState,

  "AUDIT": (state, { entry }) => ({ ...state, auditLog: [...state.auditLog, { ...entry, time: now() }] }),
};

function reducer(state, action) {
  const reduce = reducerHandlers[action.type];
  return reduce ? reduce(state, action) : state;
}

const SakonetContext = createContext(null);

export function SakonetProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, getInitialState());

  useEffect(() => {
    window.__sakonetState = state;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Failed to save state:", e);
    }
  }, [state]);

  // Cross-tab / cross-window live sync. The browser only fires the
  // `storage` event in OTHER tabs/windows on the same origin when
  // localStorage changes — never in the tab that made the change — so
  // this can't loop back on itself. Whenever another open window
  // (David's app, Phoebe's app, Mkulima staff, Beauty staff, ...) writes
  // a new state, this tab picks it up immediately and re-renders with
  // it, no manual refresh needed.
  useEffect(() => {
    function handleStorage(e) {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        dispatch({ type: "STATE/REPLACE", nextState: mergeWithDefaults(parsed) });
      } catch (err) {
        console.warn("Failed to apply cross-tab state update:", err);
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const log = useCallback((entry) => dispatch({ type: "AUDIT", entry }), []);
  const notify = useCallback((memberNo, notification) => dispatch({ type: "NOTIFY", memberNo, notification }), []);
  const markRead = useCallback((memberNo) => dispatch({ type: "NOTIFY/READ_ALL", memberNo }), []);

  // ---- authenticateSaccoApi ----
  // Pure check against the SACCO's code + network PIN. Used for one-off
  // API-auth tests (e.g. the "Test SACCO API authentication" panel) —
  // it does NOT persist a login on its own.
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

  // ---- loginSaccoNetwork ----
  // Same PIN check, but on success it also persists the login into store
  // state (and therefore localStorage), so SaccoNetworkLogin doesn't
  // re-ask for the PIN after navigating away and back, or after a
  // refresh — only an explicit logoutSaccoNetwork clears it.
  const loginSaccoNetwork = useCallback((saccoCode, pin) => {
    const result = authenticateSaccoApi(saccoCode, pin);
    if (result.ok) dispatch({ type: "AUTH/LOGIN", saccoCode });
    return result;
  }, [authenticateSaccoApi]);

  const logoutSaccoNetwork = useCallback((saccoCode) => {
    dispatch({ type: "AUTH/LOGOUT", saccoCode });
  }, []);

  // ---- createLoan ----
  const createLoan = useCallback(({ borrowerMemberNo, borrowerSacco, product, amount, term, purpose }) => {
    const id = makeLoanId();
    const borrower = findMember(state, borrowerSacco, borrowerMemberNo);
    const borrowerSaccoName = state.saccos[borrowerSacco]?.name || borrowerSacco;

    dispatch({
      type: "LOAN/CREATE",
      loan: { id, borrowerMemberNo, borrowerSacco, product, amount, term, purpose, stage: "guarantors", repayment: "pending", guarantors: [] },
    });

    log({ from: borrower?.name || "Borrower", to: borrowerSaccoName, text: `Loan application ${id} started — ${product}, KES ${amount.toLocaleString("en-KE")}.`, kind: "internal" });
    return id;
  }, [state, log]);

  // ---- addLocalGuarantor ----
  const addLocalGuarantor = useCallback((loanId, guarantor) => {
    const loan = state.loans[loanId];
    if (!loan) return;
    dispatch({ type: "LOAN/ADD_GUARANTOR", loanId, guarantor: { ...guarantor, mode: "local", status: "accepted" } });
    dispatch({ type: "LOAN/CHECK_COVERAGE", loanId });
    setTimeout(() => dispatch({ type: "LOAN/ADVANCE_TO_APPROVED", loanId }), 900);
  }, [state]);

  // ---- sendGuarantorRequest ----
  const sendGuarantorRequest = useCallback(({ loanId, guarantorSaccoCode, guarantorMemberNo, amount }) => {
    const loan = state.loans[loanId];
    if (!loan) return { ok: false, error: "Loan not found." };

    const member = findMember(state, guarantorSaccoCode, guarantorMemberNo);
    if (!member) return { ok: false, error: `No member found with that number at ${state.saccos[guarantorSaccoCode]?.name || guarantorSaccoCode}.` };
    if (!amount || amount <= 0) return { ok: false, error: "Enter a valid guarantee amount." };

    const borrower = findMember(state, loan.borrowerSacco, loan.borrowerMemberNo);
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;
    const guarantorSaccoName = state.saccos[guarantorSaccoCode].name;
    const requestId = makeRequestId();

    dispatch({
      type: "REQUEST/CREATE",
      request: {
        id: requestId, loanId, borrowerSacco: loan.borrowerSacco, borrowerMemberNo: loan.borrowerMemberNo,
        guarantorSacco: guarantorSaccoCode, guarantorMemberNo, amount, stage: "submitted",
        borrowerName: borrower?.name, guarantorName: member.name, loanAmount: loan.amount, product: loan.product,
      },
    });

    dispatch({
      type: "LOAN/ADD_GUARANTOR",
      loanId,
      guarantor: { memberNo: guarantorMemberNo, name: member.name, sacco: guarantorSaccoCode, mode: "sakonet", amount, status: "submitted" },
    });

    log({ from: borrower?.name || "Borrower", to: borrowerSaccoName, text: `Guarantee request ${requestId} submitted for ${member.name} at ${guarantorSaccoName}, KES ${amount.toLocaleString("en-KE")} — awaiting SACCO review.`, kind: "internal" });
    return { ok: true, requestId };
  }, [state, log]);

  // ---- reviewBeautyIncomingRequest ----
  const reviewBeautyIncomingRequest = useCallback((requestId, decision, reason = "") => {
    const req = state.requests[requestId];
    if (!req || req.stage !== "beauty_sacco_review") return { ok: false, error: "Request is not awaiting Beauty SACCO staff review." };

    const borrowerSaccoName = state.saccos[req.borrowerSacco]?.name || req.borrowerSacco;
    const guarantorSaccoName = state.saccos[req.guarantorSacco]?.name || req.guarantorSacco;
    const member = findMember(state, req.guarantorSacco, req.guarantorMemberNo);

    if (decision === "decline") {
      const declineReason = String(reason || "").trim();
      if (!declineReason) return { ok: false, error: "A decline reason is required." };

      dispatch({ type: "REQUEST/STAGE", requestId, stage: "rejected", extra: { declineReason, declinedBy: guarantorSaccoName, declinedAt: now(), beautyReview: "declined" } });
      dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
      log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${requestId} — Beauty SACCO declined the incoming guarantor request. Reason: ${declineReason}`, kind: "network" });
      log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — Beauty SACCO's decline delivered to ${borrowerSaccoName}.`, kind: "network" });
      notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee request declined", body: `${guarantorSaccoName} declined the guarantee request. ${declineReason}` });
      return { ok: true };
    }

    if (!member) return { ok: false, error: "The named guarantor could not be found in Beauty SACCO's member register." };
    if (Number(req.amount) > Number(member.capacity || 0)) {
      return { ok: false, error: `Insufficient available guarantee capacity. Available: KES ${Number(member.capacity || 0).toLocaleString("en-KE")}.` };
    }

    dispatch({ type: "REQUEST/STAGE", requestId, stage: "notified", extra: { beautyReview: "approved", beautyReviewedAt: now(), memberNotifiedAt: now() } });
    dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "delivered" });

    log({ from: guarantorSaccoName, to: guarantorSaccoName, text: `${requestId} — Beauty SACCO verified ${member.name} and approved the request for member notification.`, kind: "internal" });
    log({ from: guarantorSaccoName, to: member.name, text: `${guarantorSaccoName} presented guarantee request ${requestId} to ${member.name}.`, kind: "internal" });
    notify(req.guarantorMemberNo, { type: "sacco", title: `New guarantee request from ${borrowerSaccoName}`, body: `${req.borrowerName || "A member"} at ${borrowerSaccoName} requested you as guarantor for KES ${req.amount.toLocaleString("en-KE")}.`, requestId });

    return { ok: true };
  }, [state, log, notify]);

  // ---- reviewGuarantorRequest ----
  const reviewGuarantorRequest = useCallback((requestId, decision, reason = "") => {
    const req = state.requests[requestId];
    if (!req || req.stage !== "submitted") return { ok: false, error: "Request is not awaiting Mkulima staff review." };

    const borrowerSaccoName = state.saccos[req.borrowerSacco]?.name || req.borrowerSacco;
    const guarantorSaccoName = state.saccos[req.guarantorSacco]?.name || req.guarantorSacco;

    if (decision === "decline") {
      const declineReason = String(reason || "").trim();
      if (!declineReason) return { ok: false, error: "A decline reason is required." };

      dispatch({ type: "REQUEST/STAGE", requestId, stage: "declined", extra: { declineReason, declinedBy: borrowerSaccoName, declinedAt: now() } });
      dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
      log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${requestId} declined by SACCO staff before network routing. Reason: ${declineReason}`, kind: "internal" });
      notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee request declined", body: `${borrowerSaccoName} declined the guarantee request. Reason: ${declineReason}` });
      dispatch({ type: "REQUEST/STAGE", requestId, stage: "rejected", extra: { completedAt: now() } });
      return { ok: true };
    }

    dispatch({ type: "REQUEST/STAGE", requestId, stage: "network_routed", extra: { approvedBy: borrowerSaccoName, approvedAt: now() } });
    dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "network_routed" });
    log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${requestId} approved by SACCO staff and routed to ${guarantorSaccoName} — KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });
    log({ from: "SAKONET Network", to: guarantorSaccoName, text: `${requestId} — request delivered to ${guarantorSaccoName} for staff verification.`, kind: "network" });
    dispatch({ type: "REQUEST/STAGE", requestId, stage: "beauty_sacco_review" });

    return { ok: true };
  }, [state, log, notify]);

  // ---- respondToRequest ----
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

    dispatch({ type: "REQUEST/STAGE", requestId, stage: "member_responded", extra: { memberDecision: accepted ? "accepted" : "declined", memberRespondedAt: now() } });
    dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: accepted ? "pending_relay" : "rejected" });
    if (accepted) dispatch({ type: "MEMBER/CAPACITY_RESERVE", saccoCode: req.guarantorSacco, memberNo: req.guarantorMemberNo, amount: req.amount });
    log({ from: member.name, to: guarantorSaccoName, text: `${member.name} ${decisionText} guarantee ${requestId}. Beauty SACCO has recorded the member decision.`, kind: "internal" });

    if (!accepted) {
      setTimeout(() => {
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_confirmed_declined", extra: { saccoConfirmation: "declined", saccoConfirmedAt: now(), declineReason: "Guarantor member declined the request." } });
        log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${guarantorSaccoName} sent official confirmation: ${member.name} declined ${requestId} for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });
      }, 500);

      setTimeout(() => {
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_confirmation_received_declined", extra: { confirmationReceivedBy: borrowerSaccoName, confirmationReceivedAt: now() } });
        log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — ${guarantorSaccoName}'s official declined confirmation delivered to ${borrowerSaccoName}.`, kind: "network" });
        dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "rejected" });
        notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee request declined", body: `${member.name} at ${guarantorSaccoName} declined the guarantee. ${borrowerSaccoName} can request another guarantor.` });
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "rejected", extra: { completedAt: now() } });
      }, 1000);

      return { ok: true };
    }

    dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_confirmed_accepted", extra: { saccoConfirmation: "accepted", saccoConfirmedAt: now() } });
    log({ from: guarantorSaccoName, to: "SAKONET Network", text: `${guarantorSaccoName} sent official confirmation: ${member.name} accepted ${requestId} for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "network" });

    setTimeout(() => {
      dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_confirmation_received", extra: { confirmationReceivedBy: borrowerSaccoName, confirmationReceivedAt: now() } });
      log({ from: "SAKONET Network", to: borrowerSaccoName, text: `${requestId} — ${guarantorSaccoName}'s official accepted confirmation delivered to ${borrowerSaccoName}.`, kind: "network" });

      setTimeout(() => {
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "sacco_received_confirmation", extra: { saccoRecordedAt: now() } });
        dispatch({ type: "LOAN/GUARANTOR_STATUS", loanId: req.loanId, memberNo: req.guarantorMemberNo, status: "secured" });
        dispatch({ type: "FLOAT/LOCK", saccoCode: req.guarantorSacco, amount: req.amount });
        const guaranteeId = `G-${requestId.split("-")[1]}`;
        dispatch({ type: "GUARANTEE/CREATE", guarantee: { id: guaranteeId, requestId, loanId: req.loanId, borrowerSacco: req.borrowerSacco, borrowerMemberNo: req.borrowerMemberNo, guarantorSacco: req.guarantorSacco, guarantorMemberNo: req.guarantorMemberNo, amount: req.amount, status: "performing", borrowerName: req.borrowerName, guarantorName: req.guarantorName } });
        log({ from: borrowerSaccoName, to: req.borrowerName || "Borrower", text: `Mkulima SACCO received ${guarantorSaccoName}'s confirmation and sent the guarantee confirmation to you. Guarantee secured for KES ${req.amount.toLocaleString("en-KE")}.`, kind: "internal" });
        notify(req.borrowerMemberNo, { type: "sacco", title: "Guarantee secured", body: `${borrowerSaccoName} has received and recorded ${guarantorSaccoName}'s confirmation. Your guarantee is now secured for KES ${req.amount.toLocaleString("en-KE")} for your loan.` });
        dispatch({ type: "REQUEST/STAGE", requestId, stage: "member_notified_by_mkulima", extra: { borrowerMemberNotifiedAt: now(), completedAt: now() } });

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
    log({ from: state.saccos[loan.borrowerSacco].name, to: "SAKONET Network", text: `${loanId} disbursed. Guarantee relationships now active.`, kind: "network" });

    loan.guarantors.filter((g) => g.mode === "sakonet").forEach((g) => {
      setTimeout(() => {
        log({ from: "SAKONET Network", to: state.saccos[g.sacco].name, text: "Guarantee confirmed and recorded.", kind: "network" });
      }, 400);
    });
  }, [state, log]);

  const simulateDefault = useCallback((loanId) => {
    const loan = state.loans[loanId];
    if (!loan || loan.repayment === "arrears" || loan.repayment === "repaid") return;

    dispatch({ type: "LOAN/REPAYMENT", loanId, repayment: "arrears" });
    dispatch({ type: "LOAN/STAGE", loanId, stage: "arrears" });
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;

    Object.values(state.guarantees).filter((g) => g.loanId === loanId && g.status === "performing").forEach((g) => {
      const guarantorSaccoName = state.saccos[g.guarantorSacco].name;
      log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${loanId} in default — guarantee ${g.id} claimed.`, kind: "network" });
      dispatch({ type: "GUARANTEE/STATUS", id: g.id, status: "claimed" });
      dispatch({ type: "CLAIM/CREATE", claim: { id: `CLM-${g.id.split("-")[1]}`, guaranteeId: g.id, amount: g.amount, status: "pending" } });
      setTimeout(() => {
        notify(g.guarantorMemberNo, { type: "sacco", title: "Guarantee alert from your SACCO", body: `A loan you guaranteed at ${borrowerSaccoName} has entered arrears.` });
        log({ from: "SAKONET Network", to: guarantorSaccoName, text: `Arrears alert forwarded regarding guarantee ${g.id}.`, kind: "network" });
      }, 500);
    });
  }, [state, log, notify]);

  // ---- settleClaim ----
  // Settling a claim moves money, not just clears a flag: the guarantor
  // SACCO's committed amount is released AND actually leaves their float
  // (FLOAT/SETTLE), and — this is the part that was missing — that same
  // amount lands on the borrower SACCO's float (FLOAT/CREDIT), since the
  // payout is what makes the borrower SACCO whole after the default.
  // Net effect on the network: total float is unchanged (it's a
  // transfer, not a loss), the guarantor SACCO's own float goes down by
  // the settled amount, the borrower SACCO's goes up by the same
  // amount, and once nothing is left locked anywhere, network-wide
  // available float is back to the full total.
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
    dispatch({ type: "FLOAT/CREDIT", saccoCode: g.borrowerSacco, amount: g.amount });

    log({ from: guarantorSaccoName, to: "SAKONET Network", text: `KES ${g.amount.toLocaleString("en-KE")} released from reserved float for settlement.`, kind: "network" });
    setTimeout(() => {
      log({ from: "SAKONET Network", to: borrowerSaccoName, text: `Settlement ${settlementId} completed — KES ${g.amount.toLocaleString("en-KE")} transferred to ${borrowerSaccoName}'s float.`, kind: "network" });
    }, 500);
    setTimeout(() => {
      notify(g.guarantorMemberNo, { type: "sacco", title: "Guarantee called and settled", body: `Your guarantee has been used to settle the default. KES ${g.amount.toLocaleString("en-KE")} was paid from your SACCO's float.` });
    }, 900);
  }, [state, log, notify]);

  const simulateRepaid = useCallback((loanId) => {
    const loan = state.loans[loanId];
    if (!loan || loan.repayment === "repaid") return;

    dispatch({ type: "LOAN/REPAYMENT", loanId, repayment: "repaid" });
    dispatch({ type: "LOAN/STAGE", loanId, stage: "repaid" });
    const borrowerSaccoName = state.saccos[loan.borrowerSacco].name;

    log({ from: borrowerSaccoName, to: "SAKONET Network", text: `${loanId} fully repaid.`, kind: "network" });

    Object.values(state.guarantees).filter((g) => g.loanId === loanId && g.status === "performing").forEach((g) => {
      const guarantorSaccoName = state.saccos[g.guarantorSacco].name;
      dispatch({ type: "GUARANTEE/STATUS", id: g.id, status: "released" });
      dispatch({ type: "FLOAT/RELEASE", saccoCode: g.guarantorSacco, amount: g.amount });

      setTimeout(() => {
        log({ from: "SAKONET Network", to: guarantorSaccoName, text: `Guarantee ${g.id} released — KES ${g.amount.toLocaleString("en-KE")} unlocked.`, kind: "network" });
      }, 500);
      setTimeout(() => {
        notify(g.guarantorMemberNo, { type: "sacco", title: "Guarantee released", body: `The loan you guaranteed has been fully repaid. Your commitment is released.` });
      }, 900);
    });
  }, [state, log, notify]);

  const value = useMemo(() => ({
    state,
    authenticateSaccoApi,
    loginSaccoNetwork,
    logoutSaccoNetwork,
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
  }), [state, authenticateSaccoApi, loginSaccoNetwork, logoutSaccoNetwork, createLoan, addLocalGuarantor, sendGuarantorRequest, reviewGuarantorRequest, reviewBeautyIncomingRequest, respondToRequest, disburseLoan, simulateDefault, settleClaim, simulateRepaid, notify, markRead, log]);

  return <SakonetContext.Provider value={value}>{children}</SakonetContext.Provider>;
}

export function useSakonet() {
  const ctx = useContext(SakonetContext);
  if (!ctx) throw new Error("useSakonet must be used inside <SakonetProvider>");
  return ctx;
}