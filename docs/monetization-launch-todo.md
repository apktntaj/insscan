# Monetization Launch Checklist — Landing & Cek LARTAS

## Completed in this iteration

- [x] Use one offer everywhere: 10 HS-code checks/day; Pro Rp26.000/month.
- [x] Clarify that one HS code equals one check and duplicate codes are processed once.
- [x] Add pricing, trust, data-source, privacy, and regulatory disclaimer sections.
- [x] Replace the ambiguous mode switch with an accessible segmented control.
- [x] Add first-use instructions and explain supported Excel input.
- [x] Improve mobile file-upload actions and separate Check from Export.
- [x] Remove the initial-state warning before a file is selected.
- [x] Show tariff fields in batch results and exports.
- [x] Improve dialog semantics and live status announcements.
- [x] Verify the production build.

## Required before accepting paid subscriptions

- [ ] Add authenticated accounts or organization workspaces.
- [ ] Store subscriptions and usage in a durable server-side database.
- [ ] Enforce quota and Pro entitlement inside `/api/hs-code` routes, never in `localStorage`.
- [ ] Integrate a payment provider and webhook-based activation.
- [ ] Add invoice/receipt, renewal, cancellation, and entitlement-recovery flows.
- [ ] Replace access-code format validation with opaque, revocable server-issued licenses.
- [ ] Add rate limiting and abuse monitoring at the API boundary.

## Business inputs still needed

- [ ] Confirm legal business/operator name, address, and support email.
- [ ] Publish reviewed Terms of Service, Privacy Policy, and Refund/Cancellation Policy.
- [ ] Confirm whether “unlimited” is commercially sustainable or define a fair-use allowance.
- [ ] Obtain permission before publishing customer logos, names, or testimonials.
- [ ] Add verified product metrics only after analytics has collected real data.
