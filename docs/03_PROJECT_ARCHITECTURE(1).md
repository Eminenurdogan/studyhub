---
title: Project Architecture
version: 1.0
status: Draft
---

# 03_PROJECT_ARCHITECTURE

> Generated from the current uploaded StudyHub project.

## Purpose

This document describes the current frontend architecture exactly as implemented in the uploaded project. Planned features are marked separately.

## Current Folder Structure

```text
StudyHub/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   ├── index.js
│   │   └── login.js
│   ├── images/
│   ├── icons/
│   └── fonts/
├── index.html
└── login.html
```

## Current Pages

### index.html
Landing page.

Responsibilities:

- First impression
- Brand presentation
- Hero section
- Feature presentation
- Navigation to Login

### login.html

Authentication UI.

Responsibilities:

- User login
- Form validation
- Password visibility toggle

## JavaScript Responsibilities

| File | Responsibility |
|------|----------------|
| index.js | Landing page interactions |
| login.js | Login interactions |
| style.css | Shared design system |

## Layout Sections Found

- Header
- Hero
- Features
- Footer

## CSS Tokens Found

- `--color-mint` = `#63e6be`
- `--color-sky` = `#74c0fc`
- `--color-lavender` = `#b197fc`
- `--color-coral` = `#ff8fab`
- `--color-pink` = `#f6c7d7`
- `--color-peach` = `#ffc078`
- `--color-background` = `#f8fafc`
- `--color-surface` = `#ffffff`
- `--color-text` = `#1e293b`
- `--color-text-secondary` = `#64748b`
- `--color-border` = `#e2e8f0`
- `--font-heading` = `"Plus Jakarta Sans", sans-serif`
- `--font-body` = `"Inter", sans-serif`
- `--radius-sm` = `8px`
- `--radius-md` = `12px`
- `--radius-lg` = `20px`
- `--radius-xl` = `28px`
- `--space-xs` = `8px`
- `--space-sm` = `16px`
- `--space-md` = `24px`
- `--space-lg` = `32px`
- `--space-xl` = `48px`


## Architecture Rules

1. One responsibility per JavaScript file.
2. Landing page logic must remain inside index.js.
3. Login logic must remain inside login.js.
4. Shared logic should only be extracted when used by multiple pages.
5. Do not duplicate CSS already defined in style.css.

## Planned Architecture (Not Implemented Yet)

- Dashboard
- Sidebar
- Calendar
- Task Manager
- Analytics
- Settings
- LocalStorage abstraction
- Firebase integration (optional)

Every planned feature must preserve the current visual language and architecture.
