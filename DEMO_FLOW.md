# SAKONET Demo Flow

## External guarantee: Mkulima member → Beauty guarantor

1. David applies for a loan in the Mkulima SACCO member app.
2. For **Sakonet Boresha**, David can select an onboarded external SACCO member as guarantor. The demo network includes Beauty, Jenga and Baraka as onboarded participants; GT10 is added during the presentation and then becomes available too.
3. For Mkulima's other loan products, the borrower cannot choose an external SACCO guarantor.
4. Mkulima SACCO staff handle their own SACCO-side review. SAKONET is the interoperability layer and does not approve the member's loan.
5. When an external guarantee is used, SAKONET routes the request SACCO-to-SACCO. The receiving SACCO verifies its member and then communicates with that member.
6. The guarantor member accepts or declines through their own SACCO/member channel.
7. The guarantor SACCO sends the official SACCO-to-SACCO response through SAKONET.
8. SAKONET routes the confirmation back to the borrower SACCO.
9. On acceptance, the guaranteed amount is marked **Secured** and the guarantor SACCO's float is committed according to the guarantee rules.
10. The borrower SACCO then updates its member's loan/guarantee status and notifies the member.

## Network login rule for the demo

- Mkulima, Beauty, Jenga and Baraka are preloaded as onboarded demo SACCO network participants.
- **GT10 SACCO is available directly in the demo without a network PIN/login.** It remains a read-only network workspace for presentation purposes.
- Jenga and Baraka are displayed in the top demo header so the presenter can switch directly to their SACCO network views.
- After GT10 is added, its SACCO network view becomes available in the same header.
- Mkulima and Beauty remain local SACCO/member applications used to demonstrate the operational loan and guarantor flow.

## Operator management demo

The SAKONET Operator console demonstrates:
- requests touching a SACCO;
- incoming and outgoing guarantee requests;
- committed and uncommitted float;
- guarantee request analysis;
- cross-SACCO borrowers and external guarantors;
- active guarantees, claims and settlements;
- network-level loan and guarantee visibility.

Jenga and Baraka are fully seeded demo network participants, with network credentials and management data such as requests, borrowers, guarantees, committed float and uncommitted float. Their records are there specifically so one presenter can demonstrate how a SACCO views network data without needing a second operator.

## Eligibility validation

The loan application validates the requested amount against the member's eligible amount. If the borrower enters an amount above the eligible limit, the application displays an error and prevents the borrower from continuing until the amount is corrected.

## Loan-product guarantor rule

- **Sakonet Boresha:** external/intersacco guarantors are available from onboarded SACCOs. Before GT10 is added, the seeded Beauty/Jenga/Baraka members can be used; after GT10 is added, GT10 members can be used too.
- **Other Mkulima loan products:** external SACCO selection is not offered; guarantors are handled within the SACCO's normal process.

## Review-step cover rule

The review screen distinguishes between:
- the borrower's own savings applied to the loan;
- cover already secured;
- cover still awaiting guarantor action;
- total secured percentage.

This prevents a pending guarantor amount from being incorrectly displayed as already secured.
