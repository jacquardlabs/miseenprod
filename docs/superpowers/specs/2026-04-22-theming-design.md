# Theming: Blue Hour — light mode re-theme

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** `content/themes/miseenprod/assets/css/style.css` — CSS custom properties and body background only

## Problem

The current palette (`#f5f5f5` background, `#C45D2C` burnt-orange accent) reads as generic AI-generated. The goal is a distinctive, non-default aesthetic that still feels minimal.

## Decision

Replace the 9 color tokens in `:root` and add a dot-grid texture to `body`. No structural changes to layout, typography, or components. Light mode only — no `prefers-color-scheme` dark mode.

## Color tokens

| Token | Old | New |
|---|---|---|
| `--color-bg` | `#f5f5f5` | `#f6fafe` |
| `--color-text` | `#1a1a1a` | `#081420` |
| `--color-text-secondary` | `#666` | `#4e7a96` |
| `--color-accent` | `#C45D2C` | `#0369a1` |
| `--color-accent-hover` | `#a34a22` | `#024e7a` |
| `--color-border` | `#ddd` | `#9cc4d8` |
| `--color-code-bg` | `#e8e8e8` | `rgba(255,255,255,0.8)` |
| `--color-code-block-bg` | `#1e1e1e` | `#deeef8` |
| `--color-code-block-text` | `#d4d4d4` | `#081420` |

## Dot grid background

Added to `body` rule:

```css
background-image: radial-gradient(circle, #ccdfe9 1px, transparent 1px);
background-size: 14px 14px;
```

Dot color (`#ccdfe9`) is intentionally ghosted — texture felt rather than seen, so it never competes with text.

## Separator weight

- `site-header` `border-bottom` → `2px solid var(--color-border)`
- Post list item `border-bottom` → `2px solid var(--color-border)`
- All other borders remain `1px`

## What does not change

- Fonts (`--font-body`, `--font-heading`, `--font-mono`)
- Layout variables (`--content-width`, `--gap`)
- All component structure and spacing
- Ghost template variables (`--gh-font-heading`, `--gh-font-body`)
- Prism syntax highlighting (`prism-warm.css` — unchanged)

## Files changed

- `content/themes/miseenprod/assets/css/style.css` — `:root` tokens, `body` background, two border widths
