## Context

While runtime config and domain service layers are now established, the frontend application needs standard enterprise-grade capabilities inspired by Ant Design Pro: a centralized brand configuration, modularized header navigation widgets, a dedicated account settings and security management center, an enterprise notification and task center, and rich dashboard analytics.

## Goals / Non-Goals

**Goals:**
- Centralize brand and layout default properties into typed `config/defaultSettings.ts` files across `admin` and `portal`.
- Decompose `actionsRender` and `avatarProps` from `app.tsx` into standalone modular widgets under `components/RightContent/` (`AvatarDropdown`, `SelectLang`, `ThemeSwitch`, `NoticeIcon`).
- Implement a dedicated `/account/settings` page featuring basic profile management (`BaseView`) and password/security management (`SecurityView`).
- Introduce an enterprise-grade `NoticeIcon` widget with multi-category tabs (Notifications, Messages, Tasks), unread counts, and clear-all actions.
- Enhance the administrative dashboard with visual metrics, trends, and order conversion statistics.

**Non-Goals:**
- Modifying backend database DDL or introducing breaking backend API changes.
- Replacing existing authentication or JWT mechanisms.

## Decisions

### Decision 1: Centralized `config/defaultSettings.ts`
- **Design**: Create a typed configuration file:
  ```ts
  import type { ProSettings } from '@ant-design/pro-components';

  export interface DefaultSettings extends ProSettings {
    logo?: string;
    title?: string;
  }
  ```
- **Rationale**: Eliminates hardcoded brand strings across contexts and layouts, allowing single-file customization for multi-tenant rebranding.

### Decision 2: Modular `components/RightContent/` Architecture
- **Design**:
  - `RightContent/AvatarDropdown.tsx`: Displays avatar, real name, role tags, links to `/account/settings`, and handles logout.
  - `RightContent/SelectLang.tsx`: Encapsulates locale switching dropdown with icons and labels.
  - `RightContent/ThemeSwitch.tsx`: Toggles light and realDark navThemes.
  - `RightContent/NoticeIcon.tsx`: Popover rendering Notifications, Messages, and Tasks with unread badges.
  - `RightContent/index.tsx`: Assembles the widgets.
- **Rationale**: Allows `app.tsx` to remain a pure, concise declaration shell (~60 lines) rather than an inline UI implementation.

### Decision 3: `/account/settings` Page Design
- **Design**:
  - Registered in `src/config/routes.ts` under `/account/settings` with `hideInMenu: true`.
  - Responsive two-column / tabbed layout containing:
    - **BaseView**: Real name, username, email, phone number, and avatar presentation.
    - **SecurityView**: Current password, new password with strength meter, and password confirmation.
- **Rationale**: Replaces simple modal popups with a standard enterprise self-service center, directly accessible from `AvatarDropdown`.

### Decision 4: Enterprise `NoticeIcon` Notification Popover
- **Design**:
  - Built with Ant Design `<Badge>`, `<Popover>`, `<Tabs>`, and `<List>`.
  - Pre-populates categorized notices (system maintenance, audit approvals, order reviews) with interactive "Mark as read" and "Clear" states.
- **Rationale**: Fulfills standard corporate requirements for notification dispatching.

## Risks / Trade-offs

- **[Risk] Route Resolution**: Adding `/account/settings` must integrate with the dynamic menu fallback.
  - **Mitigation**: Mark `hideInMenu: true` on `/account/settings` in `routes.ts`, and ensure layout breadcrumb and title render correctly.
