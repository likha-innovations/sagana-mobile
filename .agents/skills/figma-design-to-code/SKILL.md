---
name: figma-design-to-code
description: Implement a supplied Figma screen or flow in Sagana Mobile using design context, screenshots, existing components, and visual comparison. Use when a task includes a Figma URL, node, or explicit Figma fidelity requirement.
---

# Figma to Sagana Mobile

Use with [ui-craftsman](../ui-craftsman/SKILL.md). This skill adds design extraction and comparison; shared implementation and accessibility rules live there.

## Read the relevant design

1. Identify the requested frame/node and parent flow. Inspect adjacent states needed for the assignment, not the entire file. Clarify only if the target cannot be determined.
2. Use the available Figma tools to retrieve structured design context and a visual reference. Tool names vary: discover supported capabilities instead of assuming a particular MCP method exists.
3. Inspect relevant component variants and states: idle, edited, focused, loading, disabled, validation/server errors, confirmation and success. Distinguish shown states from unspecified behavior.
4. Map layout/Auto Layout, typography, spacing, colors, radii, assets and exact copy to existing Sagana tokens and components. Record only consequential decisions and gaps.

## Implement faithfully

- Preserve the requested hierarchy, assets, copy and interaction intent. Reuse components where their contracts fit; use a focused local component where they do not.
- Implement layout behavior rather than fixed screenshot coordinates. Preserve text scaling, safe areas and keyboard access.
- Avoid unrelated redesigns, new controls, invented assets and guessed backend actions. When a required state is absent from Figma, use established app patterns and state the assumption.
- Preserve working functionality. If visual changes affect shared components, check their callers.
- User instructions, accessibility and functional requirements remain constraints. Explain meaningful design conflicts rather than following an unusable reference blindly.
- If design access or an asset is unavailable, report the precise gap and use only user-provided or existing references. Do not claim an inspected design when tools failed.

## Compare actual output

1. Render the implemented screen in an available runtime and compare with the inspected reference at a comparable viewport.
2. Check structure, spacing, fonts, wrapping, assets, component states, keyboard/sheets and navigation. Fix meaningful differences within the assigned scope.
3. Run the checks in ui-craftsman. Report the platform and states actually inspected.

A successful typecheck is not visual verification. When rendering is unavailable, explicitly mark visual comparison pending and explain what is needed. Do not claim pixel-perfect or state-complete implementation without evidence.
