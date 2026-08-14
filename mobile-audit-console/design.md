# Octiva Audit Console — Mobile Design Plan

## Product Intent

Octiva Audit Console is a **local-first, evidence-led audit workspace** for reviewing whether the Octiva Studios product truthfully integrates ACE-Step 1.5, SongGeneration 2 / LeVo 2, and DiffRhythm 2. The experience is designed for a technical auditor working on a phone: it foregrounds the readiness verdict, the most urgent evidence gaps, and the exact remediation tasks rather than presenting the audit as a generic project dashboard.

## Screen List

| Screen | Primary content and functionality |
| --- | --- |
| **Audit Home** | An executive readiness verdict, engine verification progress, finding severity summary, and a short list of the next audit actions. The primary action opens the engine evidence workspace. |
| **Engines** | A segmented engine review showing upstream status, local adapter evidence, verified capabilities, runtime acceptance state, hardware viability, and license risk per engine. |
| **Capability Matrix** | A compact, scrollable three-engine matrix that labels each requested capability as Supported, Partial, Unsupported, or Unknown and distinguishes source evidence from product claims. |
| **Findings** | A filterable finding register with CRITICAL, HIGH, MEDIUM, and LOW rows. Selecting a row exposes the file/area, problem, evidence, impact, and required fix in a bottom-sheet-style detail view. |
| **Audit Areas** | A check-list-style audit scope covering AUTO routing, persistence/history, security, runtime acceptance, hardware feasibility, licenses, UI/UX, and test coverage. |
| **Fix Queue** | A prioritized, implementation-ready remediation list formatted around priority, file/area, problem, evidence, and required fix. |

## Mobile Layout and One-Handed Interaction

The design assumes a **9:16 portrait viewport** and follows a native iOS hierarchy. The main screens use a large, left-aligned title with a compact status pill below it, followed by vertically stacked cards with a minimum 44-point touch target. The tab bar remains at the bottom for thumb reach and exposes only the four most frequent destinations: Audit, Engines, Findings, and Fixes. Secondary drill-downs open from rows or cards and use standard back navigation.

The Audit Home places the readiness verdict and the next action inside the upper third of the screen. Severity filters are horizontally scrollable, while engine evidence and findings use compact list rows rather than desktop-style tables. The capability matrix is optimized as a horizontal content strip with an engine selector, avoiding a full-width table that would be difficult to read or manipulate one-handed.

## Key User Flows

| Flow | Steps |
| --- | --- |
| **Review readiness** | Open Audit Home → read current verdict and proof state → select a flagged audit area → inspect what remains unproven. |
| **Validate an engine** | Open Engines → choose ACE-Step, SongGeneration, or DiffRhythm → inspect upstream, adapter, and runtime acceptance evidence → open capability details. |
| **Triage risk** | Open Findings → select a severity filter → open a finding → review its evidence and required fix → switch to Fixes for the engineer-ready instruction. |
| **Compare claims against evidence** | Open Engines → select Capability Matrix → select an engine → scan product claim versus upstream evidence status. |

## Color Choices

The visual identity uses a restrained investigation palette: **Midnight Ink `#0B1220`** for high-attention headers and dark surfaces, **Audit Blue `#2563EB`** for verified navigation and selected controls, **Evidence Teal `#0F766E`** for documented/verified proof, **Risk Amber `#B45309`** for warnings and evidence gaps, and **Critical Red `#B91C1C`** for blocking findings. Light surfaces use **Paper `#F8FAFC`** and card borders use **Slate Line `#D9E2EC`**. This gives audit status a clear semantic hierarchy without mimicking a consumer music-production interface.

## Accessibility and States

Every status uses a text label in addition to color and maintains readable contrast against Paper and Midnight Ink. Long technical identifiers wrap rather than truncate, rows expose descriptive accessibility labels, and empty states are explicit: an absent runtime record is labeled **Not yet proven**, never treated as a passing result. Loading, blocked, and no-evidence states are represented as distinct interface states to prevent a polished UI from implying verified integration.
