import { useEffect, useRef, useState } from "react";
import { SakonetProvider, useSakonet } from "./components/store";
import MkulimaMemberApp from "./components/borrower";
import MkulimaStaffDashboard from "./components/mkulimaSacco";
import BeautySaccoMemberApp from "./components/guarantor";
import BeautyStaffDashboard from "./components/beautySacco";
import SakonetOperatorConsole, { SaccoNetworkLogin, SaccoCreationPage } from "./components/sakonet";

// Flat single-row demo nav. Jenga and Baraka open directly into their
// preloaded read-only network views; only the SACCO login flow that is
// explicitly required for the presentation remains behind authentication.
const navGroups = [
  { type: "link", path: "/", label: "David's App" },
  { type: "link", path: "/beauty/member", label: "Joseph's App" },
  { type: "link", path: "/mkulima/staff", label: "Mkulima SACCO" },
  { type: "link", path: "/beauty/staff", label: "Beauty SACCO" },
  { type: "link", path: "/sacco/network/JEN", label: "Jenga SACCO" },
  { type: "link", path: "/sacco/network/BAR", label: "Baraka SACCO" },
  { type: "link", path: "/gt10/network", label: "GT10 SACCO" },
  { type: "link", path: "/sakonet", label: "SAKONET" },
];

function navigate(path) {
  if (window.location.pathname !== path) window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const navBtnStyle = (active) => ({
  fontFamily: "Inter, sans-serif",
  fontSize: 12.5,
  fontWeight: 600,
  padding: "7px 14px",
  borderRadius: 8,
  color: active ? "#16201B" : "#C9D1CB",
  background: active ? "#fff" : "transparent",
  border: "none",
  cursor: "pointer",
  whiteSpace: "nowrap",
});

function NavDropdown({ label, items, path, onNavigate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = items.some((item) => item.path === path);

  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button onClick={() => setOpen((v) => !v)} style={navBtnStyle(active)}>
        {label} <span style={{ fontSize: 10, opacity: 0.8 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, minWidth: 210, background: "#fff", borderRadius: 10, boxShadow: "0 12px 28px rgba(0,0,0,.18)", padding: 6, zIndex: 50 }}>
          {items.map((item) => (
            <button
              key={item.path}
              onClick={() => { onNavigate(item.path); setOpen(false); }}
              style={{ display: "block", width: "100%", textAlign: "left", fontFamily: "Inter, sans-serif", fontSize: 12.5, fontWeight: 600, padding: "8px 10px", borderRadius: 7, color: item.path === path ? "#fff" : "#16201B", background: item.path === path ? "#16201B" : "transparent", border: "none", cursor: "pointer", marginBottom: 2 }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RouterShell() {
  const { state } = useSakonet();
  const [path, setPath] = useState(window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const renderRoute = () => {
    if (path === "/mkulima/staff") return <MkulimaStaffDashboard />;
    if (path === "/beauty/member") return <BeautySaccoMemberApp />;
    if (path === "/beauty/staff") return <BeautyStaffDashboard />;
    if (path === "/sakonet") return <SakonetOperatorConsole />;
    if (path === "/gt10/network") {
      // GT10 is the live onboarding demo: before activation show a clean
      // onboarding form; only after activation does the SACCO login appear.
      const gt10 = state.saccos?.GT10;
      return gt10?.onboarded ? <SaccoNetworkLogin saccoCode="GT10" /> : <SaccoCreationPage onBack={() => navigate("/sakonet")} />;
    }
    if (path.startsWith("/sacco/network/")) {
      const saccoCode = path.split("/").pop();
      // Demo SACCOs open directly; no login interruption during the presentation.
      return <SaccoNetworkLogin saccoCode={saccoCode} autoOpen />;
    }
    return <MkulimaMemberApp />;
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#DCE3DA" }}>
      <div className="flex items-center justify-center gap-2 py-3" style={{ background: "#16201B", width: "100%" }}>
        {navGroups.map((entry) =>
          entry.type === "link" ? (
            <button key={entry.path} onClick={() => navigate(entry.path)} style={navBtnStyle(path === entry.path)}>
              {entry.label}
            </button>
          ) : (
            <NavDropdown key={entry.label} label={entry.label} items={entry.items} path={path} onNavigate={navigate} />
          )
        )}
      </div>
      {renderRoute()}
    </div>
  );
}

export default function App() {
  return <SakonetProvider><RouterShell /></SakonetProvider>;
}
