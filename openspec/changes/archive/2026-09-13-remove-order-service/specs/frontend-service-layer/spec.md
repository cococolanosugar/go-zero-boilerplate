## MODIFIED Requirements

### Requirement: Domain-Partitioned API Service Organization
The frontend API SDK SHALL organize API call methods by distinct business domains rather than a single monolithic file, while maintaining full backward-compatible root exports.

#### Scenario: Module import by business domain
- **WHEN** a business page or component imports API functions
- **THEN** it SHALL be able to import from active domain-specific service namespaces (such as auth, user, task, and system services) as well as the root SDK package, with decommissioned order services completely removed
