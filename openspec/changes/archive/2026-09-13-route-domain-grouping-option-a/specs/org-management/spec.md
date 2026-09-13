## Purpose

Provides a dedicated enterprise organization governance domain covering hierarchical department structure and job post or position management under the unified `/org` namespace.

## ADDED Requirements

### Requirement: Hierarchical Department Navigation
The organization management domain SHALL provide department tree browsing, node creation, editing, and deletion under the `/org/dept` route.

#### Scenario: User navigates to department management
- **WHEN** an authorized user selects the Department Management menu item
- **THEN** the application SHALL route to `/org/dept` and render the department tree hierarchy

### Requirement: Employee and Staff Account Navigation
The organization management domain SHALL provide enterprise employee account administration, department assignment, and profile management under the `/org/users` route.

#### Scenario: User navigates to employee management
- **WHEN** an authorized user selects the Employee Management menu item
- **THEN** the application SHALL route to `/org/users` and render the employee account ProTable
### Requirement: Job Post and Position Navigation
The organization management domain SHALL provide post and position configuration, status toggling, and assignment under the `/org/post` route.

#### Scenario: User navigates to post management
- **WHEN** an authorized user selects the Post Management menu item
- **THEN** the application SHALL route to `/org/post` and render the post management ProTable


