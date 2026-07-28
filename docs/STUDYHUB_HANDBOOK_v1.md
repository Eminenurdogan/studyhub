
# StudyHub Handbook
Version: 1.0 (Draft)

> This handbook is the primary reference for every AI coding agent working on StudyHub.
> It is based on the current uploaded project and previously established project goals.

# 1. Product Vision

StudyHub is a Turkish study planning platform for university students.
The objective is to build a production-quality frontend portfolio project with clean architecture,
excellent UI/UX and maintainable code.

## Primary Goals

- Modern landing page
- Clean authentication experience
- Dashboard (planned)
- Responsive on all devices
- Modular Vanilla JavaScript
- Beautiful pastel design

# 2. Current Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Git
- GitHub
- VS Code

# 3. Current Architecture

Current pages

- index.html
- login.html

Current scripts

- assets/js/index.js
- assets/js/login.js

Current stylesheet

- assets/css/style.css

# 4. Design Tokens

## Colors
- --color-mint: #63e6be
- --color-sky: #74c0fc
- --color-lavender: #b197fc
- --color-coral: #ff8fab
- --color-pink: #f6c7d7
- --color-peach: #ffc078
- --color-background: #f8fafc
- --color-surface: #ffffff
- --color-text: #1e293b
- --color-text-secondary: #64748b
- --color-border: #e2e8f0

## Fonts
- --font-heading: "Plus Jakarta Sans", sans-serif
- --font-body: "Inter", sans-serif

## Radius
- --radius-sm: 8px
- --radius-md: 12px
- --radius-lg: 20px
- --radius-xl: 28px

## Spacing
- --space-xs: 8px
- --space-sm: 16px
- --space-md: 24px
- --space-lg: 32px
- --space-xl: 48px


# 5. Design Philosophy

- Soft pastel palette
- Rounded corners
- Minimal visual noise
- Spacious layout
- Smooth transitions
- Accessible typography

# 6. Implemented Features

- Landing page
- Login page
- Sticky header
- Smooth scrolling
- Scroll reveal animation
- Login validation
- Password visibility toggle

# 7. Planned Features

These are planned only.

- Register page
- Forgot password
- Dashboard
- Sidebar
- Calendar
- Tasks
- Analytics
- Settings
- Dark mode
- Firebase integration

# 8. Agent Rules

## Always

- Read documentation before editing.
- Preserve existing functionality.
- Reuse CSS variables.
- Keep JavaScript modular.
- Prefer semantic HTML.
- Preserve responsive behaviour.
- Use existing typography.
- Reuse existing spacing values.
- Write readable code.
- Explain planned changes before implementation.

## Never

- Remove working functionality.
- Duplicate CSS.
- Hardcode colors when variables exist.
- Rename files without approval.
- Introduce frameworks.
- Change the design language.
- Create unnecessary files.

# 9. Coding Standards

HTML
- Semantic elements first.
- Accessible labels.
- Meaningful class names.

CSS
- Variables first.
- Mobile-first mindset.
- Avoid repetition.

JavaScript
- One responsibility per file.
- Clear function names.
- No global pollution.

# 10. Roadmap

Phase 1
- Landing
- Login

Phase 2
- Hero improvements
- Better responsiveness

Phase 3
- Dashboard
- Sidebar
- Task management

Phase 4
- Analytics
- Firebase
- Production polish

# 11. AI Workflow

1. Read this handbook.
2. Inspect current files.
3. Explain implementation plan.
4. Implement only requested feature.
5. Test mentally against existing architecture.
6. Suggest a commit message.

# 12. Living Document

This handbook must be updated whenever:
- architecture changes
- design system changes
- new components are added
- coding rules change
- roadmap changes
