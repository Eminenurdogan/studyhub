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
│   │   ├── dashboard.js
│   │   ├── index.js
│   │   └── login.js
│   ├── images/
│   ├── icons/
│   └── fonts/
├── account.html
├── analytics.html
├── calendar.html
├── courses.html
├── dashboard.html
├── index.html
├── login.html
├── pomodoro.html
├── settings.html
└── tasks.html
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

### dashboard.html

Responsive "Bugün" dashboard experience.

Responsibilities:

- Dashboard page structure
- Sidebar navigation shell
- Dashboard header
- Daily summary presentation
- Today's study plan presentation
- Upcoming tasks presentation
- Motivation presentation
- Accessible mobile sidebar controls

### Dashboard module pages

The following pages currently provide navigable application-shell placeholders only:

- pomodoro.html
- analytics.html
- account.html
- settings.html

Their module features and data are not implemented yet.

The Tasks page is a LocalStorage-backed MVP. It consumes shared course records and supports validated task creation, reload-safe rendering, combined search and filters, status changes and counters, editing, deletion confirmation, empty states, and accessible drawer feedback. Its due-date records are consumed by Calendar as read-only data. Firebase and drag-and-drop remain outside this iteration.

The Courses page is a LocalStorage-backed MVP. It supports validated course creation, editing, confirmed deletion, linked-task warnings, responsive course cards, reload-safe rendering, counts, empty states, and accessible drawer feedback. Its records are the single source for the task course selector and course filter.

The Calendar page is a read-only projection of Task Management data. It renders due-dated tasks in an accessible monthly grid, provides month navigation and today selection, displays priority-based daily intensity, and presents selected-day task details. It never creates or persists calendar-owned records.

## JavaScript Responsibilities

| File | Responsibility |
|------|----------------|
| index.js | Landing page interactions |
| login.js | Login interactions |
| dashboard.js | Mobile dashboard sidebar interactions |
| confirmation-dialog.js | Reusable accessible confirmation dialog for destructive actions |
| course-storage.js | Shared course schema, persistence and duplicate checks |
| courses.js | Course CRUD, validation, linked-task warnings and drawer interactions |
| tasks.js | Task persistence, CRUD, filtering, status and drawer interactions |
| calendar.js | Read-only monthly task projection, date navigation and day details |
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

- Analytics
- Settings
- Shared LocalStorage abstraction
- Firebase integration (optional)

Every planned feature must preserve the current visual language and architecture.
