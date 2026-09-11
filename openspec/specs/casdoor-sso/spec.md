# casdoor-sso Specification

## Purpose
Provides centralized Single Sign-On (SSO) authentication and automated user provisioning for the monorepo applications using Casdoor as the Identity and Access Management platform.

## Requirements

### Requirement: SSO Single Sign-On Redirection
The system SHALL provide an enterprise SSO entry point on all frontend client applications that redirects unauthenticated users to the centralized Casdoor authentication page with state validation.

#### Scenario: User initiates SSO login
- **WHEN** user clicks the "Enterprise SSO Login" action on Admin or Portal login page
- **THEN** system redirects the browser to Casdoor authorization URL with valid client ID, response_type=code, scope, and generated anti-CSRF state

### Requirement: OIDC Authorization Code Exchange
The API gateway SHALL expose a dedicated endpoint to exchange the temporary Casdoor authorization code for user identity claims and return system-native authentication credentials.

#### Scenario: Successful code exchange
- **WHEN** client application submits a valid authorization code and matching state to `/api/v1/system/auth/casdoor/login`
- **THEN** gateway verifies the code against Casdoor, retrieves verified user profile claims (sub, username, email, displayName), and returns standard system JWT token with user RBAC permissions

#### Scenario: Invalid or expired authorization code
- **WHEN** client application submits an expired, reused, or invalid authorization code
- **THEN** gateway rejects the request with HTTP 400 status and descriptive authentication error message

### Requirement: Just-In-Time (JIT) User Account Provisioning
The system SHALL automatically provision or link internal user accounts upon successful authentication via Casdoor when the account does not yet exist locally.

#### Scenario: First-time SSO login
- **WHEN** a user successfully authenticates via Casdoor whose identity does not exist in local user records
- **THEN** user service automatically creates a new user profile using Casdoor claims, binds default organization department, assigns default base role, and returns initialized session

#### Scenario: Returning SSO login
- **WHEN** an existing provisioned user logs in via Casdoor
- **THEN** user service synchronizes latest profile metadata (avatar, real name, email) and returns active roles and permission codes

### Requirement: Dual-Mode Authentication Fallback
The system SHALL maintain existing username/password authentication alongside SSO to ensure disaster recovery and local emergency administrative access.

#### Scenario: Administrative login without SSO
- **WHEN** system administrator authenticates using root credentials at the local login form
- **THEN** system validates credentials against internal database and issues standard JWT token without contacting Casdoor

### Requirement: Multi-Application Unified Session Invalidation
The system SHALL allow users to log out from the local client application with the option to invalidate the upstream Casdoor centralized session.

#### Scenario: User initiates logout
- **WHEN** authenticated user clicks logout
- **THEN** local session tokens and cached permissions are cleared, and user is redirected to public landing page or Casdoor logout endpoint
