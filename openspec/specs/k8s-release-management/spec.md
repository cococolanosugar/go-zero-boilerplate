# k8s-release-management Specification

## Purpose

提供 Kubernetes 多集群与多环境纳管、Helm Chart 模板渲染发布、原生 YAML 动态 Apply 与发布版本回滚管理。

## Requirements

### Requirement: Kubernetes Cluster and Environment Management
The system SHALL support managing multiple Kubernetes clusters across environments (dev, test, staging, prod) through KubeConfig or in-cluster ServiceAccount credentials.

#### Scenario: Register a Kubernetes cluster
- **WHEN** an administrator registers a Kubernetes cluster with API endpoint and KubeConfig
- **THEN** the system tests cluster connectivity, discovers available namespaces, and records the cluster configuration

### Requirement: Helm Chart Release and Value Overrides
The system SHALL support deploying microservices to target Kubernetes clusters using Helm Charts with environment-specific dynamic Value overrides.

#### Scenario: Deploy via Helm Chart
- **WHEN** a deployment step runs with target cluster, namespace, chart repository, and overridden values (e.g. image.tag)
- **THEN** the system executes `helm upgrade --install`, waits for release readiness, and records release revision metadata

### Requirement: Native Kubernetes YAML Manifest Deployment
The system SHALL support deploying services by rendering Go template-based YAML manifests (Deployments, Services, Ingresses, ConfigMaps) and executing atomic server-side apply operations.

#### Scenario: Apply native Kubernetes YAML manifest
- **WHEN** a deployment step specifies a YAML template and target namespace
- **THEN** the system parses the template, substitutes runtime variables, performs dry-run validation, and applies the resources to the cluster

### Requirement: Rollback and Release Health Check
The system SHALL monitor the readiness and health status of newly deployed workloads, and support one-click rollback to the previous successful release revision.

#### Scenario: Automatic detection of unhealthy deployment
- **WHEN** pods fail readiness probes or crash loop within the configured health check timeout
- **THEN** the system marks the deployment step as FAILED and offers a rollback trigger to the last healthy revision
