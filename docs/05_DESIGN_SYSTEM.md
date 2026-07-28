# 05_DESIGN_SYSTEM.md

> Source: Current StudyHub project (generated from the uploaded codebase)

## Design Philosophy

StudyHub uses a clean, modern and soft visual language aimed at university students.
The interface should feel calm, organized and motivating instead of corporate or playful.

## Design Principles

- Soft pastel colors
- Rounded corners
- Plenty of whitespace
- Clear typography
- Minimal visual noise
- Mobile-first responsive layout
- Reusable CSS variables

## CSS Design Tokens

| Variable | Value |
|---|---|
| `--color-mint` | `#63e6be` |
| `--color-sky` | `#74c0fc` |
| `--color-lavender` | `#b197fc` |
| `--color-coral` | `#ff8fab` |
| `--color-pink` | `#f6c7d7` |
| `--color-peach` | `#ffc078` |
| `--color-background` | `#f8fafc` |
| `--color-surface` | `#ffffff` |
| `--color-text` | `#1e293b` |
| `--color-text-secondary` | `#64748b` |
| `--color-border` | `#e2e8f0` |
| `--font-heading` | `"Plus Jakarta Sans", sans-serif` |
| `--font-body` | `"Inter", sans-serif` |
| `--radius-sm` | `8px` |
| `--radius-md` | `12px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `28px` |
| `--space-xs` | `8px` |
| `--space-sm` | `16px` |
| `--space-md` | `24px` |
| `--space-lg` | `32px` |
| `--space-xl` | `48px` |


## Layout

Current container:

- max-width: **1200px**
- width: 100%
- horizontal padding uses CSS spacing variables

## Typography

Heading font:
- Plus Jakarta Sans

Body font:
- Inter

## Current Components Found

- Header
- Logo
- Hero
- Hero Buttons
- Preview Card
- User Card
- Progress Section
- Statistics Section

## Rules For Agents

1. Never hardcode colors if a CSS variable exists.
2. Reuse spacing variables.
3. Preserve rounded design language.
4. Do not replace typography.
5. Keep the pastel palette consistent.
6. Preserve container-based layout.
7. New components must follow the same spacing and radius scale.
