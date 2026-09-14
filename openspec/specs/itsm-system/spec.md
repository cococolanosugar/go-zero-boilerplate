# ITSM System Specification

## Purpose

Provides enterprise IT service management (ITSM) capabilities including visual BPMN 2.0 workflow modeling, dynamic ticket forms, field-level permission control, ticket lifecycle execution, visual trajectory tracking, and SLA service level governance.

## Requirements

### Requirement: BPMN Process Modeling and Definition
The system SHALL provide visual BPMN 2.0 modeling capabilities enabling administrators to create, validate, version, and deploy workflow definitions with custom node extensions.

#### Scenario: Successfully deploy a new workflow definition
- **WHEN** an administrator saves and deploys a valid BPMN 2.0 XML diagram with configured user tasks and gateways
- **THEN** the system SHALL validate the process topology, assign an incremented version number, and mark the process definition as active for ticket initiation

#### Scenario: Reject invalid process definition
- **WHEN** an administrator attempts to deploy a BPMN diagram missing a start event, an end event, or having disconnected flow paths
- **THEN** the system SHALL reject deployment with actionable validation errors highlighting the invalid node identifiers

### Requirement: Dynamic Form Definition and Node-Level Field Permissions
The system SHALL support dynamic form schemas bound to service catalog items, enforcing node-specific field permissions (hidden, readonly, writable, required) during ticket progression.

#### Scenario: Initiate ticket with schema validation
- **WHEN** a user fills out a dynamic service request form and submits
- **THEN** the system SHALL validate all required form fields against the schema and instantiate a new ticket linked to the process definition

#### Scenario: Enforce field permissions at approval node
- **WHEN** an approver views and operates on a ticket task at a designated approval node
- **THEN** the system SHALL render fields designated as readonly as uneditable, display required review fields as mandatory, and hide any fields marked as hidden for that node

### Requirement: Ticket Lifecycle and Task Transition Execution
The system SHALL manage the complete ticket state machine, supporting standard human workflow operations including claim, approve, reject, reassign, counter-sign (会签), delegate, and cancel.

#### Scenario: Single-approver task completion
- **WHEN** the designated assignee completes an approval task with an approve decision
- **THEN** the system SHALL mark the current task as completed, evaluate outgoing sequence flow conditions, and activate subsequent process nodes

#### Scenario: Counter-sign consensus evaluation
- **WHEN** multiple assignees participate in a multi-instance user task
- **THEN** the system SHALL collect individual votes according to configured consensus rules (all-pass or percentage threshold) before transitioning to the next node

#### Scenario: Reject ticket to applicant
- **WHEN** an approver rejects the ticket back to the initiator
- **THEN** the system SHALL reactivate the initiation node in revise status, notify the initiator, and record the rejection reason in the audit trail

### Requirement: Visual Workflow Trajectory Tracking
The system SHALL render read-only BPMN diagrams highlighting historical, active, and rejected nodes with contextual task execution details.

#### Scenario: Render execution trajectory on ticket detail
- **WHEN** any authorized stakeholder opens the ticket details page
- **THEN** the system SHALL display the BPMN diagram with executed nodes highlighted in green, active tasks highlighted in warning/blue, and hovering on each node presents task assignees, comments, and duration

### Requirement: SLA Service Level Agreement Governance
The system SHALL calculate response and resolution SLA deadlines based on ticket priority and service calendar rules, updating status and triggering alerts upon warning or breach thresholds.

#### Scenario: SLA countdown with calendar awareness
- **WHEN** a ticket with priority P1 is submitted under an 8x5 working hours calendar
- **THEN** the system SHALL compute response and resolution deadlines excluding non-working hours and holidays, updating elapsed and remaining time in real time

#### Scenario: SLA breach escalation
- **WHEN** a ticket's pending task exceeds the calculated resolution SLA deadline
- **THEN** the system SHALL transition ticket SLA status to BREACHED and dispatch escalation notifications to managers via configured notification channels
