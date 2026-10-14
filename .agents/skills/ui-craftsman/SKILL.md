---
name: ui-craftsman
description: Build, fix, or refactor Sagana Mobile screens and shared UI using existing Expo Router, Uniwind, and component conventions. Covers maintainable component boundaries, forms, sheets, accessibility, and UI verification. Use for application UI work, not backend-only or documentation-only tasks.
---

# Sagana Mobile UI

## Establish the target

1. Read the affected route, its layout, imported components and data hooks. For a shared component change, locate its callers before editing.
2. Follow the user's brief and existing screen conventions. If a Figma reference is supplied, read [figma-design-to-code](../figma-design-to-code/SKILL.md) and inspect only the relevant flow/states.
3. Inspect current tokens and APIs rather than copying stale values from project notes. Read `docs/guide/ui-status.md` when feature completion or mock data matters. Paths in this skill, except linked skills, are relative to the repository root.

## Maintainable implementation

- Keep screens responsible for route composition and screen state. Put reusable presentation in `src/components/`, data operations in `src/hooks/` and `src/api/`, and schemas in `src/types/`.
- Reuse existing Button, Input, Card, modal, sheet and feedback components before creating another. Use their actual props. Add a variant only for a real repeated requirement; do not force every component to use cva or primitives.
- Extract a component when it has a clear responsibility or real reuse. Avoid giant configurable components, speculative wrappers, arbitrary file-length limits, and broad rewrites.
- Derive values from existing state where possible. Keep form/wizard state local; use existing TanStack Query hooks for server data. Preserve invalidation, pending state and error handling.
- Use explicit types and existing schemas. Do not add `any`, unsafe route casts, or duplicate contracts to bypass errors. Preserve React hook ordering and clean up subscriptions/timers introduced by the change.
- Keep styles and rendering readable. Use StyleSheet or inline styles when native APIs, dynamic measurements or animations require them; prefer Uniwind utilities for ordinary static styling.
- Preserve mock/live boundaries. Do not show a saved/registered/finished success state for an unimplemented operation. Keep requested mock behavior explicit and document the integration gap.
- Introduce dependencies only when existing components/native APIs cannot satisfy the task. A UI change does not authorize backend, firmware or release work.

## Design system

- Read `global.css` and relevant exports from `src/constants/colors.ts`. Reuse semantic tokens and native color constants; do not maintain another copied palette in this skill.
- Use local Spotify Mix font utilities. Root `Montserrat-*` aliases point to Spotify Mix; do not add a font package to reproduce those aliases.
- Reuse the existing control geometry or supplied design. Do not assume `rounded-2xl` equals an exact 14px measurement.
- Use existing Lucide and custom SVG icons. Preserve supplied assets and copy. Avoid decorative UI, invented metrics, or new controls outside the requested flow.
- Follow the flow's existing feedback mechanism: custom `useToast` is used in profile/settings; other flows use `burnt`. Do not add a third notification system.
- Use existing motion and opt-in haptics where they communicate feedback. Respect reduced motion and avoid haptics on every keystroke by default.

## Navigation, layout and forms

- Use Expo Router routes/parameters and the existing layouts. Tabs are Home (`index`), Machines (`machines`) and Account (`profile`). Inspect actual files before adding links.
- Keep auth/onboarding guards in the existing root/protected layouts. Preserve back/dismiss behavior, optional `machineId` parameters and nested machine routes.
- Use `useDynamicLayout()`: `scrollPaddingBottom` for tabs, `stackScrollPadding` for other stacks, and `floatingBottom` for controls above tabs. Use its insets/header offset as appropriate; avoid duplicate inset calculations and fixed clearance values.
- Let content reflow on narrow phones and with larger text. Avoid fixed text-container heights that clip translated or scaled content. Use virtualized lists for long data sets when needed.
- Keep inputs and submit actions reachable with the keyboard open. Follow the current screen's keyboard avoidance and scrolling pattern; do not stack competing keyboard handlers.
- Preserve sheet dismissal, focus restoration where supported, Android back behavior, and unsaved-change confirmation where the flow needs it.
- Validate required fields with existing schemas. Show useful inline errors, prevent duplicate submissions and preserve entered values after recoverable errors.

## Accessibility and state coverage

- Label icon-only controls; set appropriate accessibility roles, selected/disabled states and meaningful reading order. Do not expose decorative icons as duplicate controls.
- Provide touch areas of at least 44pt on iOS and 48dp on Android where applicable, without overlapping adjacent targets.
- Check text contrast, dynamic text scaling, screen-reader labels and keyboard focus on web. Do not communicate status through color alone.
- Cover applicable loading, empty, error, offline, disabled, pending and success states. Render an explanatory state for missing data instead of a silent blank screen. Add recovery actions only when they actually work.
- When a supplied design conflicts with usable contrast, scaling or interaction, explain the specific issue and make the smallest task-appropriate correction; do not silently redesign the flow.

## Verify and hand off

1. Run `pnpm run typecheck` and `pnpm exec eslint <changed-files>` for application changes. Separate pre-existing failures from regressions; avoid whole-repo autofix.
2. Use focused tests for changed validation, state transitions or data behavior when meaningful. Do not add snapshots or tests that only mirror styling.
3. When a runtime is available, render the changed flow and exercise its actions, back navigation, keyboard, sheets and relevant error/loading states. Check a narrow screen and larger text; test affected platforms when available.
4. For Figma work, compare actual rendered output with the reference. Web previews do not prove native keyboard, BLE, permission or device behavior.
5. If tooling, credentials or hardware prevent runtime checks, finish independent work and report the exact unverified behavior. Do not claim visual parity or working hardware without evidence.
6. Update affected VitePress guidance when routes, shared UI contracts or feature status change. Report changed files, reused components, checks and remaining limits concisely.
