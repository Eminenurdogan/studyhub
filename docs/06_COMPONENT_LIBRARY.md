---
title: Component Library
version: 1.0
status: Draft
---

# 06_COMPONENT_LIBRARY

> This document describes the UI components currently present in the uploaded StudyHub project. Future components are explicitly marked as planned.

## Component Philosophy

Every component must be:

- Reusable
- Responsive
- Accessible
- Consistent with the Design System
- Independent whenever possible

## Current Components

### Application Shell: dashboard

**Purpose**

Provides the responsive structural foundation for future dashboard modules.

**Rules**
- Keep dashboard styles scoped to `.dashboard-page`.
- Preserve the shared design tokens.
- Keep module content independent from the application shell.

### Navigation: app-sidebar

**Purpose**

Provides desktop navigation and an accessible off-canvas navigation pattern on mobile and tablet layouts.

**Rules**
- Keep focus inside the open mobile sidebar.
- Restore focus when the sidebar closes.
- Keep active and disabled navigation states distinguishable.

### Header: dashboard-header

**Purpose**

Presents the active page title.

**Rules**
- Show only the active page title; do not repeat the Dashboard label.

### Dashboard: today-summary-card

**Purpose**

Presents a compact visual summary of the current day's study activity.

**Rules**
- Use static presentation only until the data layer is implemented.
- Preserve the shared card foundation and the `1 → 2 → 4` responsive summary grid.
- Use meaningful Lucide icons with the existing pastel accent tokens.

### Dashboard: today-plan-card

**Purpose**

Presents the visual structure of the current day's planned study sessions.

**Rules**
- Keep time and session details semantic.
- Do not add task or timer behavior inside this component.

### Dashboard: today-upcoming-card

**Purpose**

Presents a short visual list of upcoming tasks.

**Rules**
- Keep this component read-only until Task Management is implemented.
- Use semantic list and time elements.

### Dashboard: today-motivation-card

**Purpose**

Provides a lightweight motivational message within the Today experience.

**Rules**
- Keep the content visually secondary to the study plan.
- Preserve the existing pastel design language.

### Task Management: task-workspace

**Purpose**

Provides the structural UI for searching, filtering and listing tasks.

**Rules**
- Preserve the responsive single-column and multi-column toolbar layouts.
- Keep all task-specific styles scoped below `.dashboard-page`.
- Render saved task records in the list and show the empty state only when no records exist.

### Task Management: task-status-tabs

**Purpose**

Presents the available task status views: all, pending, in progress and completed.

**Rules**
- Use `aria-pressed` to represent the selected visual state.
- Filter task records by the selected state without discarding the other active filters.
- Keep each status count synchronized with persisted task data.

### Task Management: task-empty-state

**Purpose**

Communicates that no task records are currently available.

**Rules**
- Keep the message actionable without implying saved data.
- Hide the empty state when at least one saved task is rendered.
- Use a separate no-results state when tasks exist but active filters return no matches.

### Task Management: task-create-panel

**Purpose**

Provides the accessible right-side task creation flow.

**Rules**
- Open the panel from the right with backdrop, Escape and explicit close controls.
- Trap focus while open and restore focus to the trigger when closed.
- Require a task name, course and due date before saving.
- Close and reset the form only after LocalStorage persistence succeeds.
- Keep field-level validation messages programmatically associated with their controls.
- Reuse the same form for creation and editing, with a clear mode-specific title and submit label.
- Populate course controls from the shared course store.

### Task Management: task-item

**Purpose**

Presents a persisted task and its planning metadata in the task list.

**Rules**
- Build user-entered content with DOM text nodes; do not inject it as HTML.
- Display the saved course, due date, priority and optional planning details.
- Allow status changes, editing and confirmed deletion.
- Keep drag-and-drop outside the MVP; expose due-date data to Calendar as read-only records.

### Calendar: calendar-grid

**Purpose**

Projects due-dated tasks into an accessible monthly view.

**Rules**
- Read from `studyhub.tasks.v1`; never create or persist calendar-owned data.
- Render six Monday-based weeks and preserve one keyboard tab stop.
- Support arrow-key day navigation, previous/next month, and return to today.
- Distinguish today from the selected date.

### Calendar: calendar-day

**Purpose**

Communicates a date, its task count, and priority intensity.

**Rules**
- Use mint, peach, and coral tokens for low, medium, and high priority.
- Keep indicators visible without making task data editable.
- Provide the full date and task count through an accessible label.

### Calendar: calendar-day-panel

**Purpose**

Lists the selected date's tasks and their course, priority, status, and due date.

**Rules**
- Sort higher-priority tasks first.
- Show a dedicated empty state when the selected date has no tasks.
- Keep all task actions in Task Management.

### Pomodoro: pomodoro-timer-card

**Purpose**

Runs task-linked or free-study focus and break sessions.

**Rules**
- Persist active timer state using an absolute end timestamp.
- Allow start, pause, resume, reset, and suggested break flows.
- Require an active task only in task-linked work mode.

### Pomodoro: pomodoro-goal-card

**Purpose**

Shows today's completed work sessions, configurable goal, and equivalent study time.

**Rules**
- Derive daily progress from completed work sessions.
- Preserve the goal across days while daily progress resets naturally by date.
- Continue counting when the goal is exceeded.

### Pomodoro: pomodoro-session

**Purpose**

Stores reusable completed work and break records for future analytics.

**Rules**
- Record type, mode, duration, start, completion, date, and optional task identity.
- Update task study metrics only for task-linked work sessions.
- Never update a task for free-study or break sessions.

### Analytics: analytics-insight-card

**Purpose**

Communicates one concise, factual learning insight.

**Rules**
- Render exactly three insights in the minimal Analytics view.
- Integrate equal-period trend information naturally instead of creating a separate trend section.
- Calculate every statement from stored task and completed Pomodoro records.
- Use neutral text when previous-period data is insufficient.
- Keep comparison functions reusable for future reports and coaching features.

### Account: account-profile-card

**Purpose**

Presents the user's identity, profile image, account metadata, and biography.

**Rules**
- Persist editable profile information only under the versioned profile key.
- Validate image type and size before storing a data URL.
- Keep email and join date read-only in the MVP.

### Account: account-achievement

**Purpose**

Shows basic milestone state derived from existing task and Pomodoro records.

**Rules**
- Never persist calculated achievement state.
- Distinguish completed and locked milestones accessibly without animation.

### Settings: settings-section

**Purpose**

Groups appearance, Pomodoro, notification, language, data, and account preferences into accessible categories.

**Rules**
- Persist preferences under versioned LocalStorage keys.
- Apply theme changes immediately while preserving light, dark, and system choices.
- Keep notification controls preference-only until a notification service exists.
- Keep Turkish as the only enabled language while retaining an extensible selector.

### Settings: settings-data-actions

**Purpose**

Provides reset and local-data clearing actions without browser-native dialogs.

**Rules**
- Use the shared confirmation dialog before destructive changes.
- Restore valid default settings after clearing local application data.
- Treat account deletion as interface-only until authentication and backend support exist.

### Courses: course-workspace

**Purpose**

Lists persisted course records and communicates total or empty state.

**Rules**
- Render user content with DOM text nodes.
- Keep course cards responsive and scoped below `.courses-page`.
- Show the empty state only when the shared course store has no records.

### Courses: course-drawer

**Purpose**

Provides the shared creation and editing form for courses.

**Rules**
- Require a unique learning-area name.
- Reuse the same drawer for create and edit modes.
- Close and reset only after persistence succeeds.
- Trap focus while open and restore focus when closed.

### Courses: course-card

**Purpose**

Presents a flexible learning area through its name, description and token-based color.

**Rules**
- Provide edit and confirmed delete actions.
- Warn before deleting a course referenced by saved tasks.
- Never delete linked tasks as a side effect of course deletion.
- Do not introduce university-specific metadata such as course codes, instructors, semesters, credits, faculties, departments, or class years.

### Shared: confirmation-dialog

**Purpose**

Requests explicit confirmation before destructive operations across Dashboard modules.

**Rules**
- Never use browser-native `alert()`, `confirm()`, or `prompt()`.
- Use `role="alertdialog"`, `aria-modal`, an accessible title, and an associated description.
- Focus the cancel action by default, trap focus while open, and restore focus after closing.
- Close without confirming on Escape, backdrop click, or the cancel action.
- Use the shared Triangle Alert icon and danger action styling.
- Add contextual details without replacing the core destructive-action warning.

### Header: header

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: hero

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: features

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: how-it-works

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: modules

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: testimonials

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Section: cta

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Button: login-btn

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Button: register-btn

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Button: startButton

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Button: discoverButton

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.

### Button: primary-btn

**Purpose**

Describe or preserve this component's current responsibility. Do not redesign it unless requested.

**Rules**
- Keep spacing consistent.
- Reuse CSS variables.
- Preserve responsive behavior.



### Landing: authenticated-user-menu

**Purpose**

Replaces guest authentication actions with profile-aware navigation when a local session exists.

**Rules**
- Use native links and buttons for full keyboard activation.
- Keep `aria-expanded` synchronized with the dropdown state.
- Close on Escape and outside click, restoring trigger focus after Escape.
- Prefer the saved profile photo and fall back to the user's initial.
- Keep authentication state separate from learning-module data.

## Planned Components

These are planned only and are not implemented in the current project.

- Dashboard Card
- Calendar Widget
- Task Card
- Statistics Card
- Notification Badge
- Settings Panel
- Profile Menu
- Modal
- Toast Notification
- Empty State
- Loading Skeleton

## Global Component Rules

1. Never duplicate an existing component.
2. Modify before replacing.
3. Keep class names meaningful.
4. Prefer semantic HTML.
5. Every interactive element must have hover and focus states.
6. New components must follow the Design System.
7. Avoid inline styles.
8. Keep JavaScript isolated to the owning page unless shared intentionally.

## Agent Checklist

Before creating a new component:

- Search for an existing equivalent.
- Reuse existing CSS variables.
- Match typography.
- Match spacing.
- Test responsiveness.
- Do not break existing layout.
