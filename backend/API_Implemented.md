# Implemented APIs

This document lists the API endpoints that have been developed for the project, including details on their usage, how they work, example Postman requests, and their current working status.

## Instance Information APIs

Source: `main_server/routes/instance_info_routes.js`

The APIs in this section provide information about virtual machine instances running on cloud providers.

---

### 1. Describe Instance

*   **Endpoint:** `GET /api/v1/instances/:instanceId`
*   **Usage:** Describes a specific VM instance.
*   **How it works:** This endpoint fetches detailed information about a specified virtual machine instance from the cloud provider (AWS or GCP). It requires the instance ID and relevant provider-specific location information.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/v1/instances/i-0a1590f1f558f012a`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `provider`: `AWS` or `GCP`
        *   `region`: (for AWS) e.g., `us-east-1`
        *   `zone`: (for GCP) e.g., `us-central1-a`
*   **Example Response:**
    ```json
    {
      "InstanceId": "i-0a1590f1f558f012a",
      "State": {
        "Code": 16,
        "Name": "running"
      },
      "InstanceType": "t2.micro",
      "PublicIpAddress": "44.204.168.46",
      "PrivateIpAddress": "172.31.89.247",
      // Additional instance details...
    }
    ```

### 2. Get Console Output

*   **Endpoint:** `GET /api/v1/instances/:instanceId/console-output`
*   **Usage:** Retrieves the console output for a specific VM instance.
*   **How it works:** This endpoint fetches the console output logs from a virtual machine, which can be useful for debugging issues, especially during instance startup.
*   **Status:** ⚠️ PARTIALLY WORKING - Some instance types like t2.micro don't support console output retrieval
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/v1/instances/i-0a1590f1f558f012a/console-output`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `provider`: `AWS` or `GCP`
        *   `region`: (for AWS) e.g., `us-east-1`
        *   `zone`: (for GCP) e.g., `us-central1-a`
*   **Example Response:**
    ```json
    {
      "output": "console output text..."
    }
    ```
    **or Error Response:**
    ```json
    {
      "error": "This instance type does not support retrieving the latest console logs"
    }
    ```

### 3. Get Instance Metrics

*   **Endpoint:** `GET /api/v1/instances/:instanceId/metrics`
*   **Usage:** Lists available metrics for a specific VM instance.
*   **How it works:** This endpoint retrieves monitoring metrics data for a specific instance from the cloud provider's monitoring service (like CloudWatch for AWS or Cloud Monitoring for GCP).
*   **Status:** ✅ WORKING - Returns an empty array for new instances without metrics history
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/v1/instances/i-0a1590f1f558f012a/metrics`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `provider`: `AWS` or `GCP`
        *   `region`: (for AWS) e.g., `us-east-1`
        *   `zone`: (for GCP) e.g., `us-central1-a`
        *   `namespace`: (optional) e.g., `AWS/EC2`
*   **Example Response:**
    ```json
    [
      {
        "name": "CPUUtilization",
        "unit": "Percent",
        "timestamps": ["2025-05-25T06:00:00Z", "2025-05-25T06:05:00Z"],
        "values": [2.5, 3.2]
      }
    ]
    ```

### 4. List Log Streams

*   **Endpoint:** `GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams`
*   **Usage:** Lists log streams within a specific log group for an instance.
*   **How it works:** This endpoint retrieves a list of log streams from the specified log group associated with the instance, useful for monitoring application logs.
*   **Status:** ⚠️ PARTIALLY WORKING - Requires log groups to be configured first
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/v1/instances/i-0a1590f1f558f012a/log-groups/cloud-init-output/streams`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `provider`: `AWS` or `GCP`
        *   `region`: (for AWS) e.g., `us-east-1`
        *   `zone`: (for GCP) e.g., `us-central1-a`
*   **Example Response:**
    ```json
    {
      "streams": [
        {
          "logStreamName": "i-0a1590f1f558f012a/cloud-init-output",
          "creationTime": 1716628800000,
          "firstEventTimestamp": 1716628810000,
          "lastEventTimestamp": 1716629100000
        }
      ]
    }
    ```

## VM Provisioning API

Source: `main_server/routes/instance_provisioning_routes.js`

The API in this section is used to create new virtual machine instances.

---

### 1. Provision VM

*   **Endpoint:** `POST /api/v1/provision-vm`
*   **Usage:** Creates a new virtual machine instance on the specified cloud provider.
*   **How it works:** This endpoint provisions a new VM on AWS or GCP based on the provided specifications. It handles the creation of the instance, SSH key generation, and initial configuration.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3006/api/v1/provision-vm`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
          "provider": "AWS",
          "name": "test-vm-example",
          "instance_type": "t2.micro",
          "region": "us-east-1",
          "osImage": "ubuntu-22.04",
          "pricingModel": "OnDemand",
          "rootDiskSizeGB": 10,
          "userData": "#!/bin/bash\necho \"Hello from userdata\" > /tmp/test.txt",
          "password": "SecurePassword123"
        }
        ```
*   **Example Response:**
    ```json
    {
      "success": true,
      "provider": "AWS",
      "instanceId": "i-0a1590f1f558f012a",
      "instanceName": null,
      "status": "pending",
      "keyPairName": "server-generated-key-1748154211183",
      "publicIpAddress": null,
      "privateIpAddress": "172.31.89.247",
      "note": "IMPORTANT: The privateKeyPem should be saved immediately by the client and not stored long-term by this server. Public IP might take a moment to become active."
    }
    ```

## Monitoring APIs

Source: `main_server/routes/monitoring_routes.js`

The APIs in this section are used to configure and check monitoring agents on VMs.

---

### 1. Configure Monitoring Agent

*   **Endpoint:** `POST /api/v1/monitoring/instances/:instanceId/configure`
*   **Usage:** Configures monitoring agents on a specific VM instance.
*   **How it works:** This endpoint installs and configures a monitoring agent (like CloudWatch Agent for AWS or Ops Agent for GCP) on the specified VM instance.
*   **Status:** ⚠️ PARTIALLY WORKING - Requires instance to be in the correct state
*   **Postman Request:**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3006/api/v1/monitoring/instances/i-0a1590f1f558f012a/configure`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
          "provider": "AWS",
          "region": "us-east-1",
          "agentConfiguration": {
            "agent": {
              "metrics_collection_interval": 60,
              "run_as_user": "cwagent"
            },
            "metrics": {
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 60,
                  "totalcpu": true
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 60,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 60
                }
              }
            }
          }
        }
        ```
*   **Example Response:**
    ```json
    {
      "success": true,
      "message": "Monitoring agent configuration started",
      "commandId": "command-1234567890"
    }
    ```

### 2. Get Monitoring Agent Status

*   **Endpoint:** `GET /api/v1/monitoring/instances/:instanceId/agent-status`
*   **Usage:** Checks the status of the monitoring agent on a specific VM instance.
*   **How it works:** This endpoint queries the status of the monitoring agent installation and configuration process on the specified instance.
*   **Status:** ⚠️ NOT TESTED - Requires monitoring agent to be installed first
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/v1/monitoring/instances/i-0a1590f1f558f012a/agent-status`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `provider`: `AWS` or `GCP`
        *   `region`: `us-east-1` (for AWS) or zone like `us-central1-a` (for GCP)
        *   `commandId`: (for AWS) ID of the command used to install the agent
*   **Example Response:**
    ```json
    {
      "status": "Success",
      "details": "Agent installed and configured successfully"
    }
    ```

## Authentication APIs

Source: `main_server/routes/auth.js`

The APIs in this section handle user authentication.

---

### 1. User Signup

*   **Endpoint:** `POST /api/v1/auth/signup`
*   **Usage:** Registers a new user in the system.
*   **How it works:** This endpoint creates a new user account with the provided credentials.
*   **Status:** ❌ NOT IMPLEMENTED - Returns 404 Not Found
*   **Postman Request:**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3006/api/v1/auth/signup`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
          "username": "testuser",
          "email": "test@example.com",
          "password": "SecurePassword123"
        }
        ```
*   **Example Response (Expected):**
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "userId": "user-123456"
    }
    ```

### 2. User Login

*   **Endpoint:** `POST /api/v1/auth/login`
*   **Usage:** Authenticates a user and issues a session token.
*   **How it works:** This endpoint verifies user credentials and provides a token for authenticated API access.
*   **Status:** ❌ NOT IMPLEMENTED - Returns 404 Not Found
*   **Postman Request:**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3006/api/v1/auth/login`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
          "usernameOrEmail": "testuser",
          "password": "SecurePassword123"
        }
        ```
*   **Example Response (Expected):**
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "user-123456",
        "username": "testuser",
        "email": "test@example.com"
      }
    }
    ```

## Cloud Provider Integration APIs

Source: `main_server/routes/cloud_provider_routes.js`

The APIs in this section provide access to cloud provider resources and support the VM launch flow.

---

### 1. Fetch VM Provider Options

*   **Endpoint:** `POST /api/providers/fetch-vm-provider`
*   **Usage:** Searches for VM options across multiple cloud providers based on user requirements.
*   **How it works:** This endpoint integrates with the VM allocation engine to find optimal VM configurations matching the specified hardware requirements. It can filter by provider, region, and zone if specified, and returns categorized results by instance type.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `POST`
    *   **URL:** `http://localhost:3006/api/providers/fetch-vm-provider`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Body:**
        ```json
        {
          "vCPU": 4,
          "ramGB": 16,
          "gpuType": "nvidia-t4",
          "gpuCount": 1
        }
        ```
*   **Example Response:**
    ```json
    {
      "success": true,
      "totalResults": 10,
      "categorizedResults": {
        "gpus": [
          {
            "provider": "AWS",
            "region": "us-east-1",
            "instance_type": "g4dn.xlarge",
            "vcpu": 4,
            "ram_gb": 16,
            "gpu_type": "NVIDIA T4",
            "gpu_count": 1,
            "pricing_model": "OnDemand",
            "compute_price_per_hour": 0.526
          },
          // Other GPU instances...
        ],
        "generalPurpose": [
          {
            "provider": "GCP",
            "region": "us-central1",
            "instance_type": "n2-standard-4-gpu-nvidia-tesla-t4-1",
            "vcpu": 4,
            "ram_gb": 16,
            "gpu_type": "nvidia-tesla-t4",
            "gpu_count": 1,
            "pricing_model": "OnDemand",
            "compute_price_per_hour": 0.5412
          },
          // Other general purpose instances...
        ]
      }
    }
    ```

### 2. Get AWS Regions

*   **Endpoint:** `GET /api/providers/aws/regions`
*   **Usage:** Returns a list of available AWS regions.
*   **How it works:** Queries the AWS SDK to retrieve all available regions for AWS services.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/aws/regions`
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Example Response:**
    ```json
    [
      {
        "id": "us-east-1",
        "name": "us-east-1"
      },
      {
        "id": "us-west-2",
        "name": "us-west-2"
      }
      // Other regions...
    ]
    ```

### 3. Get AWS Availability Zones

*   **Endpoint:** `GET /api/providers/aws/zones`
*   **Usage:** Returns availability zones for a specified AWS region.
*   **How it works:** Queries the AWS SDK to retrieve all available zones within the specified region.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/aws/zones`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `region`: `us-east-1`
*   **Example Response:**
    ```json
    [
      {
        "id": "us-east-1a",
        "name": "us-east-1a"
      },
      {
        "id": "us-east-1b",
        "name": "us-east-1b"
      }
      // Other availability zones...
    ]
    ```

### 4. Get AWS Instance Types

*   **Endpoint:** `GET /api/providers/aws/instance-types`
*   **Usage:** Returns available AWS instance types for a specified region.
*   **How it works:** Queries the AWS SDK to retrieve instance types with their specifications.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/aws/instance-types`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `region`: `us-east-1`
*   **Example Response:**
    ```json
    [
      {
        "id": "t2.micro",
        "name": "t2.micro",
        "description": "t2.micro - generalPurpose instance",
        "series": "t2",
        "category": "generalPurpose",
        "vcpu": 1,
        "ramGB": 1,
        "pricePerHour": "0.0116"
      }
      // Other instance types...
    ]
    ```

### 5. Get AWS Storage Options

*   **Endpoint:** `GET /api/providers/aws/storage-options`
*   **Usage:** Returns available AWS storage options for a specified region.
*   **How it works:** Returns a list of EBS volume types with their specifications and pricing estimates.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/aws/storage-options`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `region`: `us-east-1`
*   **Example Response:**
    ```json
    [
      {
        "id": "gp3",
        "name": "General Purpose SSD (gp3)",
        "type": "SSD",
        "description": "Baseline of 3,000 IOPS and 125 MiB/s at any volume size",
        "pricePerGBMonth": 0.08,
        "baselineIOPS": 3000
      }
      // Other storage options...
    ]
    ```

### 6. Get GCP Regions

*   **Endpoint:** `GET /api/providers/gcp/regions`
*   **Usage:** Returns a list of available GCP regions.
*   **How it works:** Queries the GCP Compute SDK to retrieve all available regions.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/gcp/regions`
    *   **Headers:**
        *   `Content-Type: application/json`
*   **Example Response:**
    ```json
    [
      {
        "id": "us-central1",
        "name": "Us Central1",
        "status": "UP"
      },
      {
        "id": "us-east1",
        "name": "Us East1",
        "status": "UP"
      }
      // Other regions...
    ]
    ```

### 7. Get GCP Zones

*   **Endpoint:** `GET /api/providers/gcp/zones`
*   **Usage:** Returns available zones for a specified GCP region.
*   **How it works:** Queries the GCP Compute SDK to retrieve all available zones within the specified region.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/gcp/zones`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `region`: `us-central1`
*   **Example Response:**
    ```json
    [
      {
        "id": "us-central1-a",
        "name": "us-central1-a"
      },
      {
        "id": "us-central1-b",
        "name": "us-central1-b"
      }
      // Other zones...
    ]
    ```

### 8. Get GCP Machine Types

*   **Endpoint:** `GET /api/providers/gcp/machine-types`
*   **Usage:** Returns available GCP machine types for a specified zone.
*   **How it works:** Queries the GCP Compute SDK to retrieve machine types with their specifications.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/gcp/machine-types`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `zone`: `us-central1-a`
*   **Example Response:**
    ```json
    [
      {
        "id": "e2-standard-2",
        "name": "e2-standard-2",
        "description": "E2 standard machine with 2 vCPUs and 8GB memory",
        "series": "e2",
        "category": "generalPurpose",
        "vcpu": 2,
        "ramGB": 8,
        "pricePerHour": "0.0767"
      }
      // Other machine types...
    ]
    ```

### 9. Get GCP Disk Types

*   **Endpoint:** `GET /api/providers/gcp/disk-types`
*   **Usage:** Returns available GCP disk types for a specified zone.
*   **How it works:** Queries the GCP Compute SDK to retrieve disk types with their specifications and pricing estimates.
*   **Status:** ✅ WORKING
*   **Postman Request:**
    *   **Method:** `GET`
    *   **URL:** `http://localhost:3006/api/providers/gcp/disk-types`
    *   **Headers:**
        *   `Content-Type: application/json`
    *   **Query Parameters:**
        *   `zone`: `us-central1-a`
*   **Example Response:**
    ```json
    [
      {
        "id": "pd-standard",
        "name": "Standard persistent disk",
        "type": "HDD",
        "description": "Standard persistent disk (HDD)",
        "pricePerGBMonth": 0.04
      }
      // Other disk types...
    ]
    ```

## Testing API Endpoints with Postman

This section provides complete test requests for the Cloud Provider Integration APIs that can be directly imported into Postman.

### 1. Fetch VM Provider Options

```
POST http://localhost:3006/api/providers/fetch-vm-provider
Content-Type: application/json

{
  "vCPU": 4,
  "ramGB": 16,
  "gpuType": "nvidia-t4",
  "gpuCount": 1
}
```

### 2. Get AWS Regions

```
GET http://localhost:3006/api/providers/aws/regions
Content-Type: application/json
```

### 3. Get AWS Availability Zones

```
GET http://localhost:3006/api/providers/aws/zones?region=us-east-1
Content-Type: application/json
```

### 4. Get AWS Instance Types

```
GET http://localhost:3006/api/providers/aws/instance-types?region=us-east-1
Content-Type: application/json
```

### 5. Get AWS Storage Options

```
GET http://localhost:3006/api/providers/aws/storage-options?region=us-east-1
Content-Type: application/json
```

### 6. Get GCP Regions

```
GET http://localhost:3006/api/providers/gcp/regions
Content-Type: application/json
```

### 7. Get GCP Zones

```
GET http://localhost:3006/api/providers/gcp/zones?region=us-central1
Content-Type: application/json
```

### 8. Get GCP Machine Types

```
GET http://localhost:3006/api/providers/gcp/machine-types?zone=us-central1-a
Content-Type: application/json
```

### 9. Get GCP Disk Types

```
GET http://localhost:3006/api/providers/gcp/disk-types?zone=us-central1-a
Content-Type: application/json
```

**Postman Collection Import**

You can also import the complete collection of API endpoints into Postman using the following steps:

1. In Postman, click on "Import" in the top left corner
2. Select "Raw text" and paste the following JSON:

```json
{
  "info": {
    "name": "Cloud Provider Integration APIs",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Fetch VM Provider Options",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"vCPU\": 4,\n  \"ramGB\": 16,\n  \"gpuType\": \"nvidia-t4\",\n  \"gpuCount\": 1\n}"
        },
        "url": {
          "raw": "http://localhost:3006/api/providers/fetch-vm-provider",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "fetch-vm-provider"]
        }
      }
    },
    {
      "name": "Get AWS Regions",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/aws/regions",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "aws", "regions"]
        }
      }
    },
    {
      "name": "Get AWS Availability Zones",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/aws/zones?region=us-east-1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "aws", "zones"],
          "query": [
            {
              "key": "region",
              "value": "us-east-1"
            }
          ]
        }
      }
    },
    {
      "name": "Get AWS Instance Types",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/aws/instance-types?region=us-east-1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "aws", "instance-types"],
          "query": [
            {
              "key": "region",
              "value": "us-east-1"
            }
          ]
        }
      }
    },
    {
      "name": "Get AWS Storage Options",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/aws/storage-options?region=us-east-1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "aws", "storage-options"],
          "query": [
            {
              "key": "region",
              "value": "us-east-1"
            }
          ]
        }
      }
    },
    {
      "name": "Get GCP Regions",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/gcp/regions",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "gcp", "regions"]
        }
      }
    },
    {
      "name": "Get GCP Zones",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/gcp/zones?region=us-central1",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "gcp", "zones"],
          "query": [
            {
              "key": "region",
              "value": "us-central1"
            }
          ]
        }
      }
    },
    {
      "name": "Get GCP Machine Types",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/gcp/machine-types?zone=us-central1-a",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "gcp", "machine-types"],
          "query": [
            {
              "key": "zone",
              "value": "us-central1-a"
            }
          ]
        }
      }
    },
    {
      "name": "Get GCP Disk Types",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "url": {
          "raw": "http://localhost:3006/api/providers/gcp/disk-types?zone=us-central1-a",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3006",
          "path": ["api", "providers", "gcp", "disk-types"],
          "query": [
            {
              "key": "zone",
              "value": "us-central1-a"
            }
          ]
        }
      }
    }
  ]
}
```

3. Click "Import" to add all the endpoints as a collection in Postman

This collection contains all the necessary requests to test the Cloud Provider Integration APIs with appropriate headers and example payloads.

## Summary

| API Endpoint | Status | Notes |
|--------------|--------|-------|
| GET /api/v1/instances/:instanceId | ✅ WORKING | Successfully retrieves instance details |
| GET /api/v1/instances/:instanceId/console-output | ⚠️ PARTIALLY WORKING | Only works with certain instance types |
| GET /api/v1/instances/:instanceId/metrics | ✅ WORKING | Returns empty array for new instances |
| GET /api/v1/instances/:instanceId/log-groups/:logGroupName/streams | ⚠️ PARTIALLY WORKING | Requires log groups to be configured |
| POST /api/v1/provision-vm | ✅ WORKING | Successfully creates new VM instances |
| POST /api/v1/monitoring/instances/:instanceId/configure | ⚠️ PARTIALLY WORKING | Instance must be in correct state |
| GET /api/v1/monitoring/instances/:instanceId/agent-status | ⚠️ NOT TESTED | Depends on monitoring agent installation |
| POST /api/v1/auth/signup | ❌ NOT IMPLEMENTED | Returns 404 Not Found |
| POST /api/v1/auth/login | ❌ NOT IMPLEMENTED | Returns 404 Not Found |

## VM Provisioning

### POST `/api/v1/provision-vm`

Provisions a virtual machine on the specified cloud provider (AWS or GCP).

**Request Body (JSON):**

*   `provider` (string, required): Cloud provider. Accepted values: `"aws"`, `"gcp"`.
*   `instance_type` (string, required): The machine type for the instance (e.g., `"t2.micro"` for AWS, `"e2-medium"` for GCP).
*   `osImage` (string, required): A generic OS image identifier (e.g., `"ubuntu-22.04"`, `"windows-server-2019"`). The server maps this to provider-specific image IDs.
*   `instanceName` (string, optional for GCP, required for AWS): Desired name for the instance. If not provided for GCP, a unique name will be generated. For AWS, this is also used as the basis for the EC2 Key Pair name.
*   `region` (string, required for AWS): The AWS region (e.g., `"us-east-1"`).
*   `zone` (string, required for GCP): The GCP zone (e.g., `"us-central1-a"`).
*   `storage_size_gb` (integer, optional): Desired root volume size in GB. Defaults to provider-specific values if not set.
*   `storage_type` (string, optional): Type of storage (e.g., `"gp3"` for AWS; `"pd-standard"`, `"pd-ssd"` for GCP). Defaults to provider-specific values.
*   `pricingModel` (string, optional): VM pricing model. Accepted values: `"OnDemand"`, `"Spot"`. Defaults to `"OnDemand"`.
    *   If `"Spot"` is chosen for AWS, `spotMaxPrice` must also be provided.
    *   If `"Spot"` is chosen for GCP, the instance will be configured as preemptible.
*   `spotMaxPrice` (string, optional): The maximum hourly price for an AWS Spot instance (e.g., `"0.03"`). Required if `pricingModel` is `"Spot"` for AWS.
*   `tags` (object, optional): Key-value pairs to set as tags (AWS) or labels (GCP) for the instance. Example: `{"environment": "dev", "project": "alpha"}`.

**Success Response (200 OK or 201 Created):**

```json
{
  "message": "VM provisioning initiated successfully.",
  "provider": "aws",
  "instanceId": "i-xxxxxxxxxxxxxxxxx",
  "instanceName": "my-aws-instance",
  "status": "pending",
  "ipAddress": "xx.xx.xx.xx",
  "privateKeyPem": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----",
  "region": "us-east-1"
}
```
Or, for GCP if an existing instance is found:
```json
{
  "message": "Existing instance found and details returned.",
  "provider": "gcp",
  "instanceId": "XXXXXXXXXXXXXXXXXXX",
  "instanceName": "my-gcp-instance",
  "status": "RUNNING",
  "ipAddress": "xx.xx.xx.xx",
  "privateKeyPem": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----", // This will be present if the creation attempt generated a new key
  "zone": "us-central1-a"
}
```


**Error Responses:**

*   **400 Bad Request:** If required parameters are missing or invalid.
    ```json
    {
      "error": "Invalid input",
      "details": "Missing required parameter: instance_type"
    }
    ```
*   **500 Internal Server Error:** If an error occurs during provisioning on the backend.
    ```json
    {
      "error": "Failed to provision VM",
      "details": "Provider specific error message..."
    }
    ```

**Example `curl` requests:**

**AWS OnDemand:**
```bash
curl -X POST http://localhost:3000/api/v1/provision-vm \
-H "Content-Type: application/json" \
-d '{
  "provider": "aws",
  "instance_type": "t2.micro",
  "osImage": "ubuntu-22.04",
  "instanceName": "my-ubuntu-vm-aws",
  "region": "us-east-1",
  "storage_size_gb": 30,
  "storage_type": "gp3",
  "pricingModel": "OnDemand",
  "tags": {
    "Environment": "Development",
    "Project": "Phoenix"
  }
}'
```

**AWS Spot:**
```bash
curl -X POST http://localhost:3000/api/v1/provision-vm \
-H "Content-Type: application/json" \
-d '{
  "provider": "aws",
  "instance_type": "t2.micro",
  "osImage": "ubuntu-22.04",
  "instanceName": "my-ubuntu-spot-aws",
  "region": "us-east-1",
  "storage_size_gb": 20,
  "storage_type": "gp3",
  "pricingModel": "Spot",
  "spotMaxPrice": "0.015",
  "tags": {
    "Purpose": "Testing"
  }
}'
```

**GCP OnDemand:**
```bash
curl -X POST http://localhost:3000/api/v1/provision-vm \
-H "Content-Type: application/json" \
-d '{
  "provider": "gcp",
  "instance_type": "e2-micro",
  "osImage": "ubuntu-22.04",
  "instanceName": "my-ubuntu-vm-gcp",
  "zone": "us-central1-a",
  "storage_size_gb": 25,
  "storage_type": "pd-standard",
  "pricingModel": "OnDemand",
  "tags": {
    "service": "webapp",
    "tier": "frontend"
  }
}'
```

**GCP Spot (Preemptible):**
```bash
curl -X POST http://localhost:3000/api/v1/provision-vm \
-H "Content-Type: application/json" \
-d '{
  "provider": "gcp",
  "instance_type": "e2-micro",
  "osImage": "ubuntu-22.04",
  "instanceName": "my-ubuntu-spot-gcp",
  "zone": "us-central1-a",
  "pricingModel": "Spot",
  "tags": {
    "job": "batch-processing"
  }
}'
``` 