## Why

Following the adoption of runtime configurations and domain service layers, the frontend application needs standard enterprise-grade capabilities inspired by Ant Design Pro: a centralized brand and layout configuration, modularized header navigation widgets, a dedicated account settings and security management center, an enterprise notification and task center, and rich dashboard analytics.

This suite provides complete feature parity with Ant Design Pro's flagship capabilities, elevating developer ergonomics, brand customizability, self-service security, and operational monitoring across the enterprise.

## What Changes

- **Centralized Default Settings (`config/defaultSettings.ts`)**: Extract brand logo, application title, navigation layout (`mix`), theme tokens, and layout flags into a single typed configuration file across `admin` and `portal`.
- **Modular Header Widgets (`components/RightContent/`)**: Decompose inline layout actions into standalone components (`AvatarDropdown`, `SelectLang`, `ThemeSwitch`) to reduce `src/app.tsx` from ~400 lines into a clean ~60-line assembly file.
- **Account & Security Settings Center (`/account/settings`)**: Implement a dedicated account management page with tabs for Profile Information (avatar upload, nickname, department, contact info) and Security Settings (password strength & modification, session info).
- **Enterprise Notification Center (`NoticeIcon`)**: Introduce a header notification drawer featuring Notifications, Messages, and Tasks with unread badge counters, clear-all, and quick-action navigation.
- **Advanced Dashboard Analytics (`/dashboard/analysis`)**: Enhance the administrative dashboard with visual metrics, sales trends, mini charts, and order conversion analysis.

## Capabilities

### New Capabilities

- `frontend-pro-features`: Covers centralized layout configuration (`defaultSettings`), modular header widgets (`RightContent`), self-service account settings (`/account/settings`), notification center (`NoticeIcon`), and advanced dashboard analytics.

### Modified Capabilities

None.

## Impact

- `frontend/apps/admin`:
  - New `src/config/defaultSettings.ts`
  - New `src/components/RightContent/` (`AvatarDropdown.tsx`, `SelectLang.tsx`, `ThemeSwitch.tsx`, `NoticeIcon.tsx`, `index.ts`)
  - New `src/pages/Account/Settings/` (`index.tsx`, `BaseView.tsx`, `SecurityView.tsx`)
  - Enhanced `src/pages/Dashboard/`
  - Updated `src/app.tsx` and `src/config/routes.ts`
- `frontend/apps/portal`:
  - New `src/config/defaultSettings.ts`
  - Refactored header actions in `src/app.tsx`
- Backward Compatibility: Fully preserved; all existing routes and permissions remain valid.
