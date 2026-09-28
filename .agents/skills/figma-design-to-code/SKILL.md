# Figma MCP Design-to-Code Skill

## Purpose

This skill defines the mandatory workflow for implementing Figma designs into the existing codebase.

Whenever Figma MCP is used to inspect, understand, or implement a Figma design, these rules MUST be followed.

The objective is:

> **Translate the Figma design into the existing application as faithfully as possible.**

Figma is the **visual source of truth**.

Do not treat Figma as inspiration or a general reference.

---

# 1. WHEN THIS SKILL APPLIES

Activate this skill whenever the task involves:

- A Figma URL
- A Figma frame/node
- Figma MCP
- Implementing a Figma design
- Converting Figma to React/HTML/CSS/Tailwind/etc.
- Recreating a Figma screen
- Matching an existing application to a Figma design
- Updating an existing UI based on Figma

If Figma MCP is involved, this skill takes priority over the agent's normal assumptions about UI implementation.

---

# 2. NON-NEGOTIABLE PRINCIPLE

## Figma is the source of truth.

The implementation must attempt to faithfully reproduce:

- Layout
- Component hierarchy
- Dimensions
- Positioning
- Spacing
- Padding
- Margins
- Gaps
- Typography
- Font family
- Font size
- Font weight
- Line height
- Letter spacing
- Colors
- Backgrounds
- Borders
- Border radius
- Shadows
- Icons
- Images
- Illustrations
- Component proportions
- Alignment
- Responsive behavior
- Visual hierarchy

Do not redesign the interface.

Do not improve the design.

Do not simplify the design.

Do not invent UI.

Do not substitute your own design preferences.

If the user wants a redesign or improvement, that is a separate request.

---

# 3. MANDATORY FIGMA WORKFLOW

Never immediately start coding after receiving a Figma URL.

Always follow:

```text
Figma URL
    ↓
Identify exact target node/frame
    ↓
Retrieve Figma design context
    ↓
Retrieve/inspect visual screenshot/reference
    ↓
Inspect existing codebase
    ↓
Inspect existing components
    ↓
Inspect existing design system
    ↓
Inspect assets and fonts
    ↓
Map Figma → existing code
    ↓
Create implementation plan
    ↓
Implement
    ↓
Run application
    ↓
Visually compare implementation against Figma
    ↓
Identify discrepancies
    ↓
Fix discrepancies
    ↓
Render again
    ↓
Verify
```

The first implementation is never automatically considered finished.

---

# 4. IDENTIFY THE EXACT FIGMA TARGET

When a Figma URL is provided:

1. Determine the exact frame/node referenced.
2. Do not assume the entire Figma file needs to be implemented.
3. Do not implement unrelated frames.
4. Preserve the target frame's hierarchy.
5. Inspect surrounding structure only when necessary to understand the target.

If the target cannot be determined reliably, ask for clarification instead of implementing the wrong design.

---

# 5. USE STRUCTURED DATA + VISUAL REFERENCE

Do not rely on only one representation of the Figma design.

Use:

```text
Figma design context
+
Figma visual screenshot/reference
```

The structured design information helps understand:

- hierarchy
- dimensions
- styles
- components
- variables
- relationships

The screenshot helps understand:

- visual hierarchy
- proportions
- alignment
- spacing
- overall appearance
- relationships that may not be obvious from raw design data

Both should be considered before implementation.

---

# 6. INSPECT THE EXISTING CODEBASE FIRST

Before creating components, inspect the project.

Determine:

- Framework
- Routing
- Component architecture
- Styling system
- Tailwind/CSS configuration
- Existing UI library
- Design tokens
- Typography
- Colors
- Spacing system
- Existing components
- Asset directories
- Icon system
- Existing layouts

Search for reusable components before creating new ones.

Do not duplicate functionality that already exists.

---

# 7. MAP FIGMA TO THE EXISTING PROJECT

Before implementation, mentally or explicitly establish:

```text
Figma component
        ↓
Existing project component

Figma asset
        ↓
Existing/local asset

Figma color/token
        ↓
Existing project token

Figma typography
        ↓
Existing project typography

Figma layout
        ↓
Existing layout structure
```

Reuse existing project components when they can accurately reproduce the Figma design.

If they cannot, create a specialized component.

Do not force an existing component to behave incorrectly simply to avoid creating another component.

---

# 8. ASSETS MUST BE ACCURATE

Whenever possible, use the actual assets represented by the Figma design.

This includes:

- Logos
- SVGs
- Icons
- Images
- Illustrations
- Avatars
- Background graphics
- Decorative elements

Do NOT replace them with arbitrary alternatives.

Avoid:

- Placeholder images
- Random stock images
- Emoji
- Random icon libraries
- CSS approximations
- Generic SVGs
- Manually recreated graphics

unless the original asset is genuinely unavailable.

If an asset cannot be retrieved, clearly identify it as a limitation.

---

# 9. TYPOGRAPHY IS PART OF THE DESIGN

Inspect and reproduce:

- Font family
- Font size
- Font weight
- Line height
- Letter spacing
- Text casing
- Text alignment
- Text wrapping

Do not casually substitute fonts.

Typography affects:

- Element width
- Element height
- Wrapping
- Button dimensions
- Vertical alignment
- Overall spacing

Therefore typography must be treated as a structural design requirement.

---

# 10. LAYOUT MUST FOLLOW DESIGN INTENT

Pay close attention to:

- Container width
- Maximum width
- Grid structure
- Flex behavior
- Auto Layout relationships
- Gap
- Padding
- Margin
- Alignment
- Element dimensions
- Vertical rhythm
- Horizontal rhythm

Do not randomly choose values simply because they visually seem acceptable.

Prefer values derived from the Figma design or the project's established design tokens.

---

# 11. AUTO LAYOUT / RESPONSIVE INTENT

When Figma provides Auto Layout or responsive information, use it to understand the intended behavior.

Determine:

- Fixed vs fluid dimensions
- Stretch behavior
- Alignment
- Spacing
- Wrapping
- Stacking
- Content growth
- Minimum/maximum dimensions
- Visibility behavior

Do not simply reproduce the desktop screenshot with hardcoded positions.

Implement the underlying layout behavior when the design indicates it.

---

# 12. DO NOT INVENT UI

Only implement what is present in the Figma design or required by the existing application's functionality.

Do not automatically add:

- Buttons
- Search fields
- Breadcrumbs
- Filters
- Cards
- Modals
- Tooltips
- Extra navigation
- Empty states
- Additional sections
- Additional controls

because they seem useful or conventional.

If it isn't specified, don't invent it.

---

# 13. DO NOT REDESIGN

Do not make independent aesthetic decisions such as:

> "This would look better."

Do not independently change:

- Colors
- Typography
- Spacing
- Layout
- Component shape
- Navigation
- Button design
- Card structure
- Visual hierarchy

The implementation task is not a design task.

Follow the source design.

---

# 14. MINIMAL, SURGICAL CODE CHANGES

Respect the existing architecture.

Prefer:

```text
small targeted changes
```

over:

```text
large rewrites
```

Do not introduce unnecessary:

- Libraries
- Frameworks
- State managers
- UI libraries
- Abstractions
- Architecture layers
- Dependencies

Use the existing project's technology whenever possible.

---

# 15. PRESERVE FUNCTIONALITY

Visual implementation must not unnecessarily break existing functionality.

Before modifying shared components, determine:

- Where they are used
- Their existing props
- Their behavior
- Their dependencies
- Whether they are shared

If a Figma implementation can be achieved locally, prefer a local change instead of modifying a global component.

---

# 16. IMPLEMENT IN LOGICAL SECTIONS

For large designs, divide implementation into logical sections.

Example:

```text
Page
├── Header
├── Sidebar
├── Hero
├── Statistics
├── Main Content
├── Table
└── Footer
```

Do not blindly generate a huge page without validating its structure.

---

# 17. VISUAL VERIFICATION IS MANDATORY

This is a required step.

After implementation:

1. Run the application.
2. Navigate to the implemented screen.
3. Render the actual UI.
4. Compare it with the Figma reference.
5. Identify differences.
6. Fix them.
7. Render again.
8. Compare again.

Do not declare success simply because:

- The code compiles.
- TypeScript passes.
- The page loads.
- The route works.
- The component exists.

Technical correctness does not mean visual correctness.

---

# 18. VISUAL COMPARISON CHECKLIST

When comparing the implementation against Figma, inspect:

### Structure

- Correct sections?
- Correct hierarchy?
- Correct element order?

### Dimensions

- Correct widths?
- Correct heights?
- Correct container size?

### Positioning

- Correct alignment?
- Correct placement?
- Correct vertical/horizontal relationships?

### Spacing

- Correct padding?
- Correct margins?
- Correct gaps?
- Correct section spacing?

### Typography

- Correct font?
- Correct size?
- Correct weight?
- Correct line height?
- Correct letter spacing?

### Colors

- Correct background?
- Correct text color?
- Correct border color?
- Correct accent colors?

### Components

- Correct radius?
- Correct borders?
- Correct shadows?
- Correct proportions?

### Assets

- Correct image?
- Correct icon?
- Correct logo?
- Correct scale/crop?

### Responsive behavior

- Correct resizing?
- Correct stacking?
- Correct wrapping?
- Correct visibility?

---

# 19. FIX THE BIGGEST DIFFERENCES FIRST

When visual discrepancies are discovered, prioritize:

```text
1. Wrong page structure
2. Wrong major dimensions
3. Wrong positioning
4. Wrong typography
5. Wrong spacing
6. Wrong colors
7. Wrong components
8. Wrong assets
9. Alignment issues
10. Minor pixel differences
```

Do not spend time fixing tiny details while major layout differences remain.

---

# 20. NEVER CLAIM VISUAL ACCURACY WITHOUT CHECKING

Do not say:

> "It matches Figma."

unless the rendered implementation has actually been compared against the Figma reference.

If visual verification has not happened, say that implementation is complete but verification is still required.

---

# 21. HANDLE LIMITATIONS HONESTLY

If exact reproduction is impossible because something is unavailable, state the limitation.

Examples:

```text
The original Figma asset was unavailable, so a temporary fallback was used.
```

or:

```text
The exact font is not available in the project, so the closest existing font was used.
```

Do not silently substitute something and pretend it is exact.

---

# 22. DO NOT OVERENGINEER

The goal is accurate implementation, not architectural complexity.

Do not introduce new infrastructure just because it is technically possible.

Use the simplest implementation that:

1. Matches Figma.
2. Fits the existing project.
3. Preserves functionality.
4. Remains maintainable.

---

# 23. COMMUNICATION

Before implementation, provide a short summary:

```text
Figma target:
[frame/node]

Existing components to reuse:
[...]

New components required:
[...]

Important visual requirements:
[...]

Implementation approach:
[short summary]
```

Do not overwhelm the user with internal reasoning.

After implementation:

```text
Implemented:
[...]

Reused:
[...]

Verified:
[...]

Remaining limitations:
[only if applicable]
```

---

# 24. REQUIRED DECISION HIERARCHY

When deciding how to implement something, use this priority:

```text
1. Figma design
2. Existing application requirements
3. Existing project architecture
4. Existing components/design system
5. Simplicity and maintainability
6. Agent preference
```

Agent preference must NEVER override the Figma design.

---

# 25. FINAL QUALITY GATE

Before considering a Figma implementation complete, verify:

[ ] Correct Figma frame/node

[ ] Figma design context inspected

[ ] Visual reference inspected

[ ] Existing codebase inspected

[ ] Existing components considered

[ ] Assets correctly mapped

[ ] Typography correctly mapped

[ ] Layout correctly implemented

[ ] Spacing correctly implemented

[ ] Colors correctly implemented

[ ] Components visually match

[ ] Responsive behavior considered

[ ] Existing functionality preserved

[ ] Application successfully runs

[ ] Rendered UI visually compared against Figma

[ ] Major discrepancies corrected

[ ] Final implementation verified

Only after these checks should the task be considered complete.

---

# ABSOLUTE RULE

Whenever Figma MCP is used:

> **INSPECT → UNDERSTAND → MAP → IMPLEMENT → RENDER → COMPARE → CORRECT → VERIFY**

Never skip:

**RENDER → COMPARE → CORRECT**

That is the most important part of this skill.

The objective is not:

> "Generate a UI similar to Figma."

The objective is:

> **"Faithfully implement the Figma design in the existing application."**