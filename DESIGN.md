---
version: 1.0
name: Karaa Audience Demo Design Contract
product: Karaa
system: Android-native project intelligence and audience demonstration
colors:
  primary: "#1E2521"
  canvas: "#F8F5EE"
  paper: "#FFFDF8"
  ink: "#1E2521"
  text-secondary: "#46534B"
  text-muted: "#6A706B"
  line: "#D8D0BE"
  accent: "#8C6517"
  accent-pressed: "#6E4F12"
  success: "#2F6546"
  warning: "#A76509"
  error: "#A4362B"
typography:
  display:
    fontFamily: "System sans (use Geist if bundled)"
    fontSize: 34px
    fontWeight: "800"
    lineHeight: 1.08
  headline:
    fontFamily: "System sans (use Geist if bundled)"
    fontSize: 27px
    fontWeight: "800"
    lineHeight: 1.16
  body:
    fontFamily: "System sans"
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 1.45
  label:
    fontFamily: "System sans"
    fontSize: 12px
    fontWeight: "800"
    letterSpacing: "0.10em"
  metadata:
    fontFamily: "System mono only when bundled; otherwise system sans"
    fontSize: 12px
    fontWeight: "600"
rounded:
  sm: 8px
  md: 12px
  lg: 18px
spacing:
  xs: 6px
  sm: 10px
  md: 16px
  lg: 24px
  xl: 36px
  xxl: 52px
---

# Karaa Audience Demo Design Contract

## Precedence

This is the root project design contract for Karaa. It defines the product-specific palette, vocabulary, visual direction, truthfulness, accessibility, state quality, media discipline, and rendered-verification standards. Any more-local `DESIGN.md` added beneath a future product surface overrides this file only for that surface.

## Brief-grounded direction

- **Subject:** a construction/project team converting field evidence into accountable customer assurance and management intervention.
- **Audience:** a first-time decision-maker seeing Karaa in a demo; then an authenticated Customer, Employee, or Manager completing one concrete job.
- **Primary job per surface:**
  - Public tour: explain the evidence-to-decision loop in under one minute.
  - Customer: establish confidence in the current state of one project.
  - Employee: publish a complete, validated field update.
  - Management: choose the project or person needing attention next.
  - Conversation: resolve a concrete project follow-up.
- **Signature element:** a vertical `Evidence → Progress → Decision` trace that appears on the tour and becomes a compact evidence rail in project detail. It is a real hierarchy/navigation treatment, never an animated fake process.
- **System choice:** public product tour plus role-specific product workflows; not a generic dashboard and not a chat-first application.

## Generic-default critique

Karaa must not resemble a random AI SaaS prompt. Therefore it forbids: neon/purple gradients, glass panels, default gray dashboard cards, giant vanity KPIs, animated “live” dots, decorative maps without coordinates, generic avatars, generic three-card feature rows, and fake project outcomes. It earns a warm material palette, documentary-style evidence imagery, timeline/rule layout, and a brass structural accent because the subject is physical delivery and accountable records.

## Visual language

- Canvas is warm ivory; paper is used for actual reading/write surfaces; charcoal anchors hierarchy.
- Brass is the single structural/action accent, not a decorative glow. Green, amber, and red are reserved for real status semantics.
- Prefer a full-width evidence image, timeline/rule, grouping heading, or divider before creating another card. Never exceed two decorative containers from a section to its content.
- Use large type only for a project promise, current delivery state, or page job. All other numbers require source/freshness context.
- No UI text, logo, or numeric/project truth is baked into a generated image. Every generated image gets a visible `Demo visual` caption where its provenance could be misunderstood.
- All narrow layouts are one column with no horizontal data-table scrolling. Long metadata wraps or is condensed into labelled rows.

## Content language

Use concrete, user-controlled labels:

- `Explore the operating loop`, not `Learn more`.
- `View project evidence`, not `Open dashboard`.
- `Publish progress update`, not `Submit`.
- `Saved to Karaa`, not `Success`.
- `Last reported`, not `Live`, when freshness is stale or simulated.
- `Connection unavailable — try again`, not a vague apology.

No content may imply a hosted production system, physical-device verification, live GPS, real project evidence, or real tender/payment record unless backend/runtime evidence proves it.

## Runtime state map

| Surface | idle | loading | completed | blocked/failed | recovery |
| --- | --- | --- | --- | --- | --- |
| Public tour | clear operating-loop story | never blank; reserve image/text geometry | route transition | asset unavailable | static local fallback image |
| Customer evidence | project selector/empty record | evidence-shaped skeleton | server-fetched progress and updates | access/API failure | inline retry |
| Employee update | blank validated form | submit control disabled with `Saving update…` | `Saved to Karaa` only after 201/200 | field, media, location, or connection error | correct field/retry without losing values |
| Management | risk-priority list | list-shaped skeleton | fetched priorities/freshness | no access/API failure | inline retry |
| Conversation | empty prompt to begin project follow-up | message row pending only during request | persisted message row | send failure preserves typed message | explicit retry |

Only states that exist in code may be rendered. Progress, freshness, message delivery, and project status are sourced from API data, not visual theatre.

## Inputs and accessibility

- Every `TextInput` has a visible label above it, helper text where needed, `accessibilityLabel`, keyboard-appropriate entry, adjacent validation/error message, and a minimum 44px tap target.
- Placeholder text must remain at least as legible as `#46534B` against `#F8F5EE`; typed text uses `ink`.
- Status has explicit textual meaning and cannot rely on color alone.
- Images use useful descriptive alt/accessibility text or are marked decorative.
- Loading uses layout-preserving skeletons/labels, not generic spinner-only screens.
- Motion is optional, limited to transform/opacity, and disabled/reduced under the operating-system reduced-motion setting. No perpetual animation.

## Assets and media shot list

| Asset | Surface | Job | Ratio | Constraints | Fallback |
| --- | --- | --- | --- | --- | --- |
| Amaravati hero | public tour/customer header | establish a credible project world | 16:9 | warm early-morning construction site, no people identifiable, no text/logo/watermark, negative space for copy | solid paper image frame + `Demo visual` caption |
| Structural progress | evidence feed | show a mid-project evidence moment | 4:3 | same fictional site, materials/detail, no text/logo | neutral evidence placeholder |
| Installation detail | evidence feed | show verified completion detail | 4:3 | same palette/project language, no false safety claims | neutral evidence placeholder |
| Finished-area detail | public story | show the outcome without claiming completion metrics | 4:3 | same world, no text/logo | neutral image frame |

Generated media is supporting evidence atmosphere only. It cannot replace interactive controls, backend data, readable data visualisation, or a state explanation.

## Verification contract

Before a Karaa UI feature is reported done:

- [ ] This design file and any nearer `DESIGN.md` have been read and linted.
- [ ] The page’s concrete subject, audience, job, signature decision, and no-generic-default critique exist in the feature brief/plan.
- [ ] UI tokens are imported from a shared theme rather than scattered one-off values.
- [ ] Every displayed project/update/location/message state comes from a real API/runtime contract or is visibly labelled demo visual/data.
- [ ] Loading, empty, error, disabled, success, and retry states work where applicable.
- [ ] Rendered screenshots at desktop reference width and Android/emulator mobile reference width show no clipping, unreadable text, hidden content, or overlap.
- [ ] Generated images are inspected, local, attributed, captioned, and do not contain critical text/data.
- [ ] PC-only browser/emulator and API evidence is recorded. Do not make phone, physical-camera, or production-hosting claims.
