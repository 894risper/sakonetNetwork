# SAKONET Demo Routes

Run the app from this directory:

```bash
npm install
npm run dev
```

Vite serves the React SPA and supports direct navigation to these routes:

- http://localhost:5173/
- http://localhost:5173/beauty/member
- http://localhost:5173/mkulima/staff
- http://localhost:5173/beauty/staff
- http://localhost:5173/sakonet
- http://localhost:5173/sacco/network/MKU
- http://localhost:5173/sacco/network/BTY
- http://localhost:5173/sacco/network/JEN
- http://localhost:5173/sacco/network/BAR
- http://localhost:5173/gt10/network

The Mkulima and Beauty staff dashboards remain full SACCO dashboards. Guarantee approval/decline is a staff-dashboard function; the SACCO SAKONET network workspace remains read-only and shows the same live requests/committed-float view for every onboarded SACCO (MKU, BTY, JEN, BAR, GT10).

Jenga SACCO (JEN) and Baraka SACCO (BAR) are the **float-management demo pair**: Jenga's Michael Wafula (JN-2004) is the borrower and Baraka's Naomi Chepkoech (BR-3004) is the guarantor on a live, already-secured Sakonet Boresha loan (`L-DEMO-JB1`), so their SAKONET network login screens show real committed/uncommitted float balances (Baraka has KES 180,000 committed) out of the box — no need to run the full application journey to see it. Neither SACCO has a full staff dashboard yet; only their SAKONET network login (float view) is wired up in the nav.

GT10 SACCO remains the dedicated SACCO for the **onboarding/network-login demo** — creating a SACCO from scratch and issuing its network PIN.

The standalone audit trail view has been removed from the SAKONET operator console and from each SACCO's network workspace.
