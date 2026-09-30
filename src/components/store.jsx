/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from "react";

const STORAGE_KEY = "sakonet_store_v14"; // bumped — Beauty-focused CLF demo seed data

const now = () => new Date().toLocaleTimeString("en-KE", { hour12: false });

const defaultInitialState = {
  saccos: {
    MKU: { code: "MKU", name: "Mkulima SACCO", contact: "Esther Nyokabi", email: "admin@mkulima.co.ke", phone: "0700000000", registrationNo: "SACCO-MKU-001", networkPin: "482913", apiEndpoint: "/api/v1/sakonet", apiAuth: "X-SACCO-CODE + X-SACCO-PIN", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 250000 },
    BTY: { code: "BTY", name: "Beauty SACCO", contact: "Halima Juma", email: "admin@beautysacco.co.ke", phone: "0711000000", registrationNo: "SACCO-BTY-001", networkPin: "615204", apiEndpoint: "/api/v1/sakonet", apiAuth: "X-SACCO-CODE + X-SACCO-PIN", status: "active", onboarded: true, joined: "02 Sep 2026", totalFloat: 1000000, locked: 780000 },
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

  // Customer service tickets, keyed by ticket id. Each ticket carries its
  // own message thread. Raised by a SACCO's staff or by one of its members.
  tickets: {},

  notifications: {
    "MK-07741": [],
    "BT-3390": [],
  },

  sessionAuth: {},

  // Per-SACCO history of committed-float snapshots, used to power the
  // CLF top-up forecast. Real FLOAT/LOCK, FLOAT/RELEASE, FLOAT/SETTLE
  // and FLOAT/CREDIT actions each append a dated snapshot here as they
  // happen. On a fresh install there is no real history yet, so a
  // deterministic seed history is generated once (see
  // ensureFloatHistorySeeded) so the forecast has something honest to
  // work from immediately — clearly a stand-in for the months of real
  // snapshots a live deployment would accumulate on its own.
  floatHistory: {
    MKU: [],
    BTY: [],
  },

  auditLog: [],
};

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
    tickets: { ...defaultInitialState.tickets, ...parsed.tickets },
    notifications: { ...defaultInitialState.notifications, ...parsed.notifications },
    sessionAuth: { ...defaultInitialState.sessionAuth, ...parsed.sessionAuth },
    floatHistory: { ...defaultInitialState.floatHistory, ...parsed.floatHistory },
  };
}

// Deterministic (no Math.random) seed history for a SACCO with no real
// float-history yet. Beauty SACCO gets a deliberate rising trend so the
// CLF model has a genuine slope to extrapolate. Other SACCOs stay flat,
// mildly noisy and healthy so the predictive-analysis table provides a
// clear contrast without hard-coding a forecast result.
function seedFloatHistory(saccoCode, totalFloat, currentLocked) {
  const weeks = 12;
  const nowMs = Date.now();
  const currentRatio = totalFloat > 0 ? currentLocked / totalFloat : 0.3;
  const isRisingStory = saccoCode === "BTY";
  const startFrom = isRisingStory ? 0.32 : currentRatio;
  const drift = isRisingStory ? currentRatio - startFrom : 0;
  const waveFreq = isRisingStory ? 0.9 : 1.3;
  const waveAmp = isRisingStory ? 0.015 : 0.02;

  const points = [];
  for (let i = weeks; i >= 0; i--) {
    const t = weeks - i; // 0 = oldest, weeks = newest
    const progress = t / weeks;
    const wave = Math.sin(t * waveFreq) * waveAmp;
    const ratio = Math.max(0.05, Math.min(0.95, startFrom + drift * progress + wave));
    const locked = Math.round(ratio * totalFloat);
    const date = new Date(nowMs - i * 7 * 24 * 60 * 60 * 1000).toISOString();
    points.push({ date, event: "snapshot", amount: 0, totalFloat, locked });
  }
  return points;
}

function ensureFloatHistorySeeded(state) {
  let next = state;
  Object.values(next.saccos).forEach((sacco) => {
    const existing = next.floatHistory[sacco.code] || [];
    if (existing.length === 0) {
      const seeded = seedFloatHistory(sacco.code, sacco.totalFloat, sacco.locked);
      next = { ...next, floatHistory: { ...next.floatHistory, [sacco.code]: seeded } };
    }
  });
  return next;
}

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return ensureFloatHistorySeeded(mergeWithDefaults(JSON.parse(saved)));
  } catch (e) {
    console.warn("Failed to load saved state:", e);
  }
  return ensureFloatHistorySeeded(defaultInitialState);
}

function findMember(state, saccoCode, memberNo) {
  return (state.membersBySacco[saccoCode] || []).find((m) => m.memberNo === memberNo);
}

// Masks a member's name for display in a pre-check result — enough for
// the borrower to visually recognize the right person, without handing
// back a full name to someone who hasn't proven any relationship yet.
function maskName(name) {
  if (!name) return "";
  const parts = String(name).trim().split(/\s+/);
  return parts
    .map((p, i) => {
      if (parts.length === 1) return p[0] + "*".repeat(Math.max(p.length - 1, 1));
      if (i === parts.length - 1 && p.length > 2) return p[0] + "*".repeat(Math.max(p.length - 2, 1)) + p.slice(-1);
      return p[0] + "*".repeat(Math.max(p.length - 1, 1));
    })
    .join(" ");
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

// Appends a dated committed-float snapshot for a SACCO — the raw
// material the CLF forecast is built from. Called every time a
// FLOAT/* action actually changes a SACCO's numbers, right after the
// change, so each entry reflects the float position as it stood at
// that moment.
function appendFloatHistory(state, saccoCode, entry) {
  const list = state.floatHistory[saccoCode] || [];
  return { ...state, floatHistory: { ...state.floatHistory, [saccoCode]: [...list, entry] } };
}

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

// Ticket ids (TK-...) and ticket message ids (m-...).
function makeTicketId(prefix = "TK") {
  const timePart = Date.now().toString(36);
  const rand = typeof crypto !== "undefined" && crypto.getRandomValues
    ? (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0).toString(36).padStart(6, "0")
    : Math.floor(Math.random() * 2 ** 32).toString(36).padStart(6, "0");
  return `${prefix}-${timePart}-${rand}`;
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

  "FLOAT/LOCK": (state, { saccoCode, amount }) => {
    const next = updateSacco(state, saccoCode, (sacco) => ({ ...sacco, locked: sacco.locked + amount }));
    const sacco = next.saccos[saccoCode];
    if (!sacco) return next;
    return appendFloatHistory(next, saccoCode, { date: new Date().toISOString(), event: "lock", amount, totalFloat: sacco.totalFloat, locked: sacco.locked });
  },

  "FLOAT/RELEASE": (state, { saccoCode, amount }) => {
    const next = updateSacco(state, saccoCode, (sacco) => ({ ...sacco, locked: Math.max(0, sacco.locked - amount) }));
    const sacco = next.saccos[saccoCode];
    if (!sacco) return next;
    return appendFloatHistory(next, saccoCode, { date: new Date().toISOString(), event: "release", amount, totalFloat: sacco.totalFloat, locked: sacco.locked });
  },

  "FLOAT/SETTLE": (state, { saccoCode, amount }) => {
    const next = updateSacco(state, saccoCode, (sacco) => ({
      ...sacco,
      locked: Math.max(0, sacco.locked - amount),
      totalFloat: sacco.totalFloat - amount,
    }));
    const sacco = next.saccos[saccoCode];
    if (!sacco) return next;
    return appendFloatHistory(next, saccoCode, { date: new Date().toISOString(), event: "settle", amount, totalFloat: sacco.totalFloat, locked: sacco.locked });
  },

  "FLOAT/CREDIT": (state, { saccoCode, amount }) => {
    const next = updateSacco(state, saccoCode, (sacco) => ({ ...sacco, totalFloat: sacco.totalFloat + amount }));
    const sacco = next.saccos[saccoCode];
    if (!sacco) return next;
    return appendFloatHistory(next, saccoCode, { date: new Date().toISOString(), event: "credit", amount, totalFloat: sacco.totalFloat, locked: sacco.locked });
  },

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

  "TICKET/CREATE": (state, { ticket }) => ({ ...state, tickets: { ...state.tickets, [ticket.id]: ticket } }),

  "TICKET/REPLY": (state, { ticketId, message, status }) => {
    const t = state.tickets[ticketId];
    if (!t) return state;
    return {
      ...state,
      tickets: { ...state.tickets, [ticketId]: { ...t, messages: [...t.messages, message], status: status || t.status, updatedAt: message.at } },
    };
  },

  "TICKET/STATUS": (state, { ticketId, status, at }) => {
    const t = state.tickets[ticketId];
    if (!t) return state;
    return { ...state, tickets: { ...state.tickets, [ticketId]: { ...t, status, updatedAt: at } } };
  },

  "AUTH/LOGIN": (state, { saccoCode }) => ({
    ...state,
    sessionAuth: { ...state.sessionAuth, [saccoCode]: true },
  }),
  "AUTH/LOGOUT": (state, { saccoCode }) => {
    const next = { ...state.sessionAuth };
    delete next[saccoCode];
    return { ...state, sessionAuth: next };
  },

  "STATE/REPLACE": (_state, { nextState }) => nextState,

  "AUDIT": (state, { entry }) => ({ ...state, auditLog: [...state.auditLog, { ...entry, time: now() }] }),
};

function reducer(state, action) {
  const reduce = reducerHandlers[action.type];
  return reduce ? reduce(state, action) : state;
}

const SakonetContext = createContext(null);

// ---- CLF forecast math ----
// Kept as plain functions (not hooks) so they're easy to unit-test in
// isolation from the store/dispatch machinery.

const CLF_DANGER_RATIO = 0.85; // committed float / total float — above this, float is under real strain
const CLF_TARGET_RATIO = 0.65; // the buffer a top-up aims to restore

function linearRegression(points) {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumXX - sumX * sumX || 1;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

// Model A — historical baseline: short moving average of the most
// recent committed-float ratios. The floor every fancier model has to
// beat before it's worth using.
function baselinePredict(series) {
  const w = series.slice(-3);
  return w.reduce((s, p) => s + p.y, 0) / w.length;
}

// Model B — trend-weighted forecast: a stand-in for a gradient-boosted
// tree model (e.g. XGBoost). A full XGBoost pipeline needs a
// server-side ML runtime this client-only prototype doesn't have, so
// this exercises the same feature set (recent lags + trend) through a
// simple weighted regression instead, to demonstrate the same
// baseline-vs-model comparison and chronological backtest the real
// pipeline would run.
function trendPredict(series) {
  const recent = series.slice(-6);
  const { slope, intercept } = linearRegression(recent);
  const nextX = recent[recent.length - 1].x + 1;
  return slope * nextX + intercept;
}

// Chronological (never random) one-step-ahead backtest: for each of
// the last few known points, predict it using only the data that came
// before it, and measure the error. This is what decides which model
// actually gets used — never a random train/test split, which would
// leak future information into a time series.
function backtestError(ratios, predictFn) {
  let totalErr = 0;
  let count = 0;
  const start = Math.max(4, ratios.length - 5);
  for (let cut = start; cut < ratios.length; cut++) {
    const trainSeries = ratios.slice(0, cut);
    if (trainSeries.length < 3) continue;
    const actual = ratios[cut].y;
    const predicted = predictFn(trainSeries);
    totalErr += Math.abs(actual - predicted);
    count++;
  }
  return count > 0 ? totalErr / count : Infinity;
}

function computeClfForecast(state, saccoCode) {
  const sacco = state.saccos[saccoCode];
  const rawHistory = state.floatHistory?.[saccoCode] || [];
  const history = rawHistory.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!sacco || history.length < 4) {
    return { ready: false, saccoCode, reason: "Not enough float history yet to forecast reliably." };
  }

  const ratios = history.map((h, i) => ({
    x: i,
    y: h.totalFloat > 0 ? h.locked / h.totalFloat : 0,
  }));

  // --- feature engineering: lags, rolling mean, time-of-month ---
  const lag1 = ratios[ratios.length - 1].y;
  const lag2 = ratios[ratios.length - 2]?.y ?? lag1;
  const rollingWindow = ratios.slice(-4);
  const rollingMean = rollingWindow.reduce((s, p) => s + p.y, 0) / rollingWindow.length;
  const dayOfMonth = new Date().getDate();
  const timeOfMonthBucket = dayOfMonth <= 10 ? "early" : dayOfMonth <= 20 ? "mid" : "late";

  // --- model comparison via chronological backtest ---
  const baselineErr = backtestError(ratios, baselinePredict);
  const trendErr = backtestError(ratios, trendPredict);
  const useTrend = trendErr <= baselineErr;
  const chosenErr = useTrend ? trendErr : baselineErr;

  const predictedRatio = Math.max(0, Math.min(1, useTrend ? trendPredict(ratios) : baselinePredict(ratios)));
  const projectedLocked = predictedRatio * sacco.totalFloat;

  // --- suggested top-up: only when the forecast crosses the danger line ---
  let suggestedTopUp = 0;
  if (predictedRatio >= CLF_DANGER_RATIO) {
    const requiredFloat = projectedLocked / CLF_TARGET_RATIO;
    suggestedTopUp = Math.max(0, Math.round(requiredFloat - sacco.totalFloat));
  }

  // --- expected timing: weeks until the ratio is projected to cross the danger line ---
  const { slope } = linearRegression(ratios.slice(-6));
  let weeksToThreshold = null;
  if (lag1 >= CLF_DANGER_RATIO) {
    weeksToThreshold = 0;
  } else if (slope > 0.0005) {
    weeksToThreshold = Math.max(1, Math.round((CLF_DANGER_RATIO - lag1) / slope));
  }

  const uncertainty = Math.round(chosenErr * sacco.totalFloat) || Math.round(sacco.totalFloat * 0.03);

  const factors = [
    `Committed float ratio has moved from ${(ratios[0].y * 100).toFixed(0)}% to ${(lag1 * 100).toFixed(0)}% over the last ${ratios.length} recorded snapshots.`,
    `Recent 4-snapshot rolling average sits at ${(rollingMean * 100).toFixed(0)}%, ${rollingMean > lag2 ? "still climbing" : "holding steady"}.`,
    `Current snapshot falls in the ${timeOfMonthBucket} part of the month — tracked as a seasonal factor alongside the trend.`,
    `Selected model: ${useTrend ? "trend-weighted forecast" : "historical baseline"} — lower one-step-ahead error in chronological backtesting (${(chosenErr * 100).toFixed(1)}% avg. error vs ${((useTrend ? baselineErr : trendErr) * 100).toFixed(1)}%).`,
  ];

  return {
    ready: true,
    saccoCode,
    currentRatio: lag1,
    predictedRatio,
    dangerRatio: CLF_DANGER_RATIO,
    targetRatio: CLF_TARGET_RATIO,
    suggestedTopUp,
    weeksToThreshold,
    uncertainty,
    factors,
    modelUsed: useTrend ? "trend" : "baseline",
    snapshots: ratios.length,
  };
}

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

  const loginSaccoNetwork = useCallback((saccoCode, pin) => {
    const result = authenticateSaccoApi(saccoCode, pin);
    if (result.ok) dispatch({ type: "AUTH/LOGIN", saccoCode });
    return result;
  }, [authenticateSaccoApi]);

  const logoutSaccoNetwork = useCallback((saccoCode) => {
    dispatch({ type: "AUTH/LOGOUT", saccoCode });
  }, []);

  const createLoan = useCallback(({ borrowerMemberNo, borrowerSacco, product, amount, term, purpose, documents, incomeProofType }) => {
    const id = makeLoanId();
    const borrower = findMember(state, borrowerSacco, borrowerMemberNo);
    const borrowerSaccoName = state.saccos[borrowerSacco]?.name || borrowerSacco;

    dispatch({
      type: "LOAN/CREATE",
      loan: { id, borrowerMemberNo, borrowerSacco, product, amount, term, purpose, documents: documents || {}, incomeProofType: incomeProofType || null, stage: "guarantors", repayment: "pending", guarantors: [] },
    });

    log({ from: borrower?.name || "Borrower", to: borrowerSaccoName, text: `Loan application ${id} started — ${product}, KES ${amount.toLocaleString("en-KE")}.`, kind: "internal" });
    return id;
  }, [state, log]);

  const addLocalGuarantor = useCallback((loanId, guarantor) => {
    const loan = state.loans[loanId];
    if (!loan) return;
    dispatch({ type: "LOAN/ADD_GUARANTOR", loanId, guarantor: { ...guarantor, mode: "local", status: "accepted" } });
    dispatch({ type: "LOAN/CHECK_COVERAGE", loanId });
    setTimeout(() => dispatch({ type: "LOAN/ADVANCE_TO_APPROVED", loanId }), 900);
  }, [state]);

  // ---- precheckGuarantor ----
  // The pre-check lookup: a stateless, automatic system-to-system check
  // run before any formal guarantee request exists. It never dispatches
  // anything — nothing is created, logged, or stored — so it can be
  // repeated freely as the borrower corrects details. It answers a
  // bounded question (does this member exist, can they cover this
  // amount) and returns only a masked name, never the real name, never
  // a raw capacity figure — the guarantor hasn't been contacted or
  // consented to anything at this point.
  const precheckGuarantor = useCallback((guarantorSaccoCode, guarantorMemberNo, amount) => {
    const sacco = state.saccos[guarantorSaccoCode];
    if (!sacco || !sacco.onboarded || sacco.status !== "active") {
      return { found: false };
    }
    const member = findMember(state, guarantorSaccoCode, guarantorMemberNo);
    if (!member) return { found: false };

    const capacity = Number(member.capacity ?? member.shares ?? 0);
    const requested = Number(amount || 0);
    const sufficientCapacity = requested > 0 && capacity >= requested;

    return { found: true, sufficientCapacity, maskedName: maskName(member.name) };
  }, [state]);

  // ---- getClfForecast ----
  // Read-only, like precheckGuarantor: never dispatches, just computes
  // a fresh forecast from the current float history each time it's
  // called, so the operator console can call it on every render without
  // worrying about stale results.
  const getClfForecast = useCallback((saccoCode) => computeClfForecast(state, saccoCode), [state]);

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

  // ---- Customer service tickets ----
  const raiseTicket = useCallback(({ saccoCode, raisedByType, memberNo, name, category, priority, subject, description, linkedId }) => {
    const sub = String(subject || "").trim();
    const desc = String(description || "").trim();
    if (!sub) return { ok: false, error: "Enter a subject." };
    if (!desc) return { ok: false, error: "Describe the issue." };
    const id = makeTicketId();
    const at = new Date().toISOString();
    dispatch({
      type: "TICKET/CREATE",
      ticket: {
        id, saccoCode, raisedByType, memberNo: memberNo || null, raisedByName: name,
        category, priority, subject: sub, description: desc,
        linkedId: String(linkedId || "").trim() || null,
        status: "open", createdAt: at, updatedAt: at,
        messages: [{ id: makeTicketId("m"), from: raisedByType, name, text: desc, at }],
      },
    });
    const saccoName = state.saccos[saccoCode]?.name || saccoCode;
    log({ from: name, to: "SAKONET Support", text: `Ticket ${id} raised (${category}, ${priority}) — ${sub}. Source: ${raisedByType === "member" ? `member at ${saccoName}` : saccoName}.`, kind: "network" });
    return { ok: true, ticketId: id };
  }, [state, log]);

  const replyToTicket = useCallback((ticketId, { from, name, text }) => {
    const t = state.tickets[ticketId];
    const body = String(text || "").trim();
    if (!t) return { ok: false, error: "Ticket not found." };
    if (!body) return { ok: false, error: "Write a reply first." };
    const at = new Date().toISOString();
    // A reply reopens a finished ticket; an operator's first reply moves it to in progress.
    const status = (t.status === "resolved" || t.status === "closed") ? "open"
      : (t.status === "open" && from === "operator") ? "in_progress" : t.status;
    dispatch({ type: "TICKET/REPLY", ticketId, message: { id: makeTicketId("m"), from, name, text: body, at }, status });
    if (t.memberNo && from !== "member") {
      notify(t.memberNo, { type: "sacco", title: `Update on ticket ${t.id}`, body: `${name} replied: ${body.slice(0, 120)}` });
    }
    return { ok: true };
  }, [state, notify]);

  const setTicketStatus = useCallback((ticketId, status, by = "Support") => {
    const t = state.tickets[ticketId];
    if (!t) return;
    dispatch({ type: "TICKET/STATUS", ticketId, status, at: new Date().toISOString() });
    log({ from: by, to: "SAKONET Support", text: `Ticket ${ticketId} marked ${status.replace("_", " ")}.`, kind: "network" });
    if (t.memberNo) notify(t.memberNo, { type: "sacco", title: `Ticket ${t.id} ${status.replace("_", " ")}`, body: `Your ticket "${t.subject}" is now ${status.replace("_", " ")}.` });
  }, [state, log, notify]);

  const value = useMemo(() => ({
    state,
    authenticateSaccoApi,
    loginSaccoNetwork,
    logoutSaccoNetwork,
    createLoan,
    addLocalGuarantor,
    precheckGuarantor,
    getClfForecast,
    sendGuarantorRequest,
    reviewGuarantorRequest,
    reviewBeautyIncomingRequest,
    respondToRequest,
    disburseLoan,
    simulateDefault,
    settleClaim,
    simulateRepaid,
    raiseTicket,
    replyToTicket,
    setTicketStatus,
    notify,
    markRead,
    log,
  }), [state, authenticateSaccoApi, loginSaccoNetwork, logoutSaccoNetwork, createLoan, addLocalGuarantor, precheckGuarantor, getClfForecast, sendGuarantorRequest, reviewGuarantorRequest, reviewBeautyIncomingRequest, respondToRequest, disburseLoan, simulateDefault, settleClaim, simulateRepaid, raiseTicket, replyToTicket, setTicketStatus, notify, markRead, log]);

  return <SakonetContext.Provider value={value}>{children}</SakonetContext.Provider>;
}

export function useSakonet() {
  const ctx = useContext(SakonetContext);
  if (!ctx) throw new Error("useSakonet must be used inside <SakonetProvider>");
  return ctx;
}