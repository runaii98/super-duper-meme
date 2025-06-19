# Cloud Provider Management API - Implemented Endpoints

This document lists all the API endpoints that have been implemented and tested in the Cloud Provider Management System.

## Core Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/` | GET | Health check | ✅ Working |
| `/api/v1/os-images` | GET | List available OS images | ✅ Working |
| `/api/v1/find-cheapest-instance` | POST | Find optimal VM instances | ✅ Working |
| `/api/v1/provision-vm` | POST | Provision a new VM | ✅ Working |
| `/api/v1/instances` | GET | List all instances | ✅ Working |

## Cloud Provider Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/providers/aws/regions` | GET | List AWS regions | ✅ Working |
| `/api/providers/gcp/regions` | GET | List GCP regions | ✅ Working |
| `/api/providers/fetch-vm-provider` | POST | Fetch VM instances by criteria | ✅ Working |
| `/api/providers/cached-vm-instances` | GET | Get cached VM instances | ✅ Working |
| `/api/v1/create-security-feature` | POST | Create an AWS Security Group or GCP Firewall Rule | ✅ Working |
| `/api/v1/aws/security-groups/:groupId/rules` | PATCH | Add or remove rules from an AWS Security Group | ✅ Working |
| `/api/v1/delete-firewall-rule` | DELETE | Delete a GCP firewall rule | 🚧 Partial |

## Instance Management Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/instances/:instanceId` | GET | Get instance details | ✅ Working |
| `/api/v1/instances/:instanceId/console-output` | GET | Get instance console output | ✅ Working |
| `/api/v1/instances/:instanceId/metrics` | GET | Get instance metrics | ✅ Working |
| `/api/v1/instances/:instanceId/log-groups/:logGroupName/streams` | GET | Get instance log streams | ✅ Working |
| `/api/v1/instances/:instanceId/start/:provider` | POST | Start a running instance | ✅ Working |
| `/api/v1/instances/:instanceId/stop/:provider` | POST | Stop a running instance | ✅ Working |
| `/api/v1/instances/:instanceId/reboot/:provider` | POST | Reboot a running instance | ✅ Working |
| `/api/v1/instances/:instanceId/:provider` | DELETE | Terminate (delete) an instance | ✅ Working |
| `/api/v1/vm-storage` | PATCH | Modify an instance's root/boot disk size | ✅ Working |
| `/api/v1/instances/:instanceId/change-vm-type/:provider` | PATCH | Change an instance's type (must be stopped) | ✅ Working |

## Snapshot Management Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/instances/:instanceId/snapshots/:provider` | POST | Create a snapshot from an instance's volume | ✅ Working |
| `/api/v1/snapshots/:provider` | GET | List all snapshots for a provider | ✅ Working |
| `/api/v1/snapshots/:snapshotId/:provider` | DELETE | Delete a specific snapshot | ✅ Working |

## Monitoring Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/monitoring/instances/:instanceId/configure` | POST | Configure monitoring agent | ✅ Working |
| `/api/v1/monitoring/instances/:instanceId/agent-status` | GET | Get monitoring agent status | ✅ Working |

## Security Management Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/create-security-feature` | POST | Create an AWS Security Group or GCP Firewall Rule | ✅ Working |
| `/api/v1/aws/security-groups/:groupId/rules` | PATCH | Add or remove rules from an AWS Security Group | ✅ Working |
| `/api/v1/delete-firewall-rule` | DELETE | Delete a GCP firewall rule | 🚧 Partial |

## Authentication Endpoints

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/v1/auth/signup` | POST | Create a new user account | ✅ Working |
| `/api/v1/auth/login` | POST | Log in to an existing account | ✅ Working |

## Testing Status

All endpoints have been tested using:

1. Basic API tests (`test_basic_endpoints.js`)
2. Comprehensive API tests (`tests/test_api_endpoints.js`)

The tests verify that the endpoints return the expected responses and handle errors appropriately.

## Credential Management

The system supports dynamic credential handling for multiple cloud providers:

- AWS credentials are loaded from `main_server/credentials/aws.json`
- GCP credentials are loaded from `main_server/credentials/gcp.json`

The system will work with limited functionality if credentials for one or more providers are missing or invalid. 