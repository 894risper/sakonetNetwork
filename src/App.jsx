import { useEffect, useState } from "react";
import { SakonetProvider } from "./components/store";
import MkulimaMemberApp from "./components/borrower";
import MkulimaStaffDashboard from "./components/mkulimaSacco";
import BeautySaccoMemberApp from "./components/guarantor";
import BeautyStaffDashboard from "./components/beautySacco";
import SakonetOperatorConsole, { SaccoNetworkLogin } from "./components/sakonet";

// Demo is scoped to two SACCOs only: Mkulima (borrower side) and Beauty
// (guarantor side), integrated through SAKONET. No header/nav — open
// each app directly by path:
//   /                  -> SAKONET network operator console (root)
//   /mkulima/member    -> David's App (Mkulima member / borrower)
//   /beauty/member     -> Phoebe's App (Beauty member / guarantor)
//   /mkulima/staff     -> Mkulima SACCO staff dashboard
//   /beauty/staff      -> Beauty SACCO staff dashboard
//   /sacco/network/MKU -> Mkulima's read-only SAKONET network view
//   /sacco/network/BTY -> Beauty's read-only SAKONET network view
//
// Side-by-side demo views — staff dashboard and member phone app in one
// window, so nothing needs alt-tabbing between separate browser tabs
// while presenting:
//   /mkulima           -> Mkulima staff dashboard (left) + David's App (right)
//   /beauty            -> Beauty staff dashboard (left) + Phoebe's App (right)

function SplitView({ staff: Staff, member: Member }) {
  return (
    <div style={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        <Staff />
      </div>
      <div
        style={{
          flexShrink: 0,
          borderLeft: "1px solid #00000014",
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          padding: "24px 20px",
          background: "#DCE3DA",
        }}
      >
        <Member />
      </div>
    </div>
  );
}

function RouterShell() {
  const [path, setPath] = useState(window.location.pathname || "/");
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const renderRoute = () => {
    if (path === "/mkulima") return <SplitView staff={MkulimaStaffDashboard} member={MkulimaMemberApp} />;
    if (path === "/beauty") return <SplitView staff={BeautyStaffDashboard} member={BeautySaccoMemberApp} />;
    if (path === "/mkulima/member") return <MkulimaMemberApp />;
    if (path === "/mkulima/staff") return <MkulimaStaffDashboard />;
    if (path === "/beauty/member") return <BeautySaccoMemberApp />;
    if (path === "/beauty/staff") return <BeautyStaffDashboard />;
    if (path === "/sacco/network/MKU") return <SaccoNetworkLogin saccoCode="MKU" />;
    if (path === "/sacco/network/BTY") return <SaccoNetworkLogin saccoCode="BTY" />;
    return <SakonetOperatorConsole />; // "/" and any unmatched path
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#DCE3DA" }}>
      {renderRoute()}
    </div>
  );
}

export default function App() {
  return <SakonetProvider><RouterShell /></SakonetProvider>;
}