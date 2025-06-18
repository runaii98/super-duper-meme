# PowerShell script for testing monitoring and instance info endpoints
# Make sure the server is running before executing this script

# Set the base URL 
$BASE_URL = "http://localhost:3000/api/v1"

Write-Host "=============================================" -ForegroundColor Blue
Write-Host "Testing Monitoring and Instance Info Endpoints" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

# Sample values - replace with actual values from your environment
# AWS
$AWS_INSTANCE_ID = "i-0123456789abcdef0"
$AWS_REGION = "us-east-1"
$AWS_LOG_GROUP = "/aws/ec2/instance/$AWS_INSTANCE_ID"
$AWS_COMMAND_ID = "11111111-2222-3333-4444-555555555555" # For agent-status endpoint

# GCP
$GCP_INSTANCE_ID = "vm-instance-1"  # Instance name in GCP
$GCP_ZONE = "us-central1-a"
$GCP_LOG_GROUP = "compute.googleapis.com%2Factivity_log"  # URL encoded

# -----------------------------------------------------
# 1. Test instance_info_routes.js endpoints
# -----------------------------------------------------

Write-Host "`n1. Testing Instance Info Endpoints" -ForegroundColor Green

# 1.1 Test describeInstance - AWS
Write-Host "`n1.1 Test GET /instances/$AWS_INSTANCE_ID (AWS)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$AWS_INSTANCE_ID`?provider=aws&region=$AWS_REGION" -Method Get
$response | ConvertTo-Json -Depth 10

# 1.2 Test describeInstance - GCP
Write-Host "`n1.2 Test GET /instances/$GCP_INSTANCE_ID (GCP)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$GCP_INSTANCE_ID`?provider=gcp&zone=$GCP_ZONE" -Method Get
$response | ConvertTo-Json -Depth 10

# 1.3 Test getConsoleOutput - AWS
Write-Host "`n1.3 Test GET /instances/$AWS_INSTANCE_ID/console-output (AWS)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$AWS_INSTANCE_ID/console-output`?provider=aws&region=$AWS_REGION" -Method Get
$response.Substring(0, [Math]::Min(500, $response.Length))

# 1.4 Test getConsoleOutput - GCP
Write-Host "`n1.4 Test GET /instances/$GCP_INSTANCE_ID/console-output (GCP)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$GCP_INSTANCE_ID/console-output`?provider=gcp&zone=$GCP_ZONE" -Method Get
$response.Substring(0, [Math]::Min(500, $response.Length))

# 1.5 Test listMetrics - AWS
Write-Host "`n1.5 Test GET /instances/$AWS_INSTANCE_ID/metrics (AWS)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$AWS_INSTANCE_ID/metrics`?provider=aws&region=$AWS_REGION&namespace=AWS/EC2" -Method Get
$response | ConvertTo-Json -Depth 10

# 1.6 Test listMetrics - GCP
Write-Host "`n1.6 Test GET /instances/$GCP_INSTANCE_ID/metrics (GCP)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$GCP_INSTANCE_ID/metrics`?provider=gcp&zone=$GCP_ZONE&namespace=compute.googleapis.com/instance" -Method Get
$response | ConvertTo-Json -Depth 10

# 1.7 Test listLogStreams - AWS
Write-Host "`n1.7 Test GET /instances/$AWS_INSTANCE_ID/log-groups/$AWS_LOG_GROUP/streams (AWS)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$AWS_INSTANCE_ID/log-groups/$AWS_LOG_GROUP/streams`?provider=aws&region=$AWS_REGION" -Method Get
$response | ConvertTo-Json -Depth 10

# 1.8 Test listLogStreams - GCP
Write-Host "`n1.8 Test GET /instances/$GCP_INSTANCE_ID/log-groups/$GCP_LOG_GROUP/streams (GCP)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/instances/$GCP_INSTANCE_ID/log-groups/$GCP_LOG_GROUP/streams`?provider=gcp&zone=$GCP_ZONE" -Method Get
$response | ConvertTo-Json -Depth 10

# -----------------------------------------------------
# 2. Test monitoring_routes.js endpoints
# -----------------------------------------------------

Write-Host "`n2. Testing Monitoring Endpoints" -ForegroundColor Green

# 2.1 Test configureAgent - AWS
Write-Host "`n2.1 Test POST /monitoring/instances/$AWS_INSTANCE_ID/configure (AWS)" -ForegroundColor Yellow
# Example CloudWatch Agent configuration
$AWS_AGENT_CONFIG = @{
  agent = @{
    metrics_collection_interval = 60
    run_as_user = "cwagent"
  }
  metrics = @{
    namespace = "MyCustomNamespace"
    metrics_collected = @{
      cpu = @{
        resources = @("*")
        measurement = @("cpu_usage_idle", "cpu_usage_user", "cpu_usage_system")
        totalcpu = $true
      }
      mem = @{
        measurement = @("mem_used_percent")
      }
      disk = @{
        resources = @("/")
        measurement = @("disk_used_percent")
        ignore_file_system_types = @("sysfs", "devtmpfs")
      }
    }
  }
}

$body = @{
  provider = "aws"
  region = $AWS_REGION
  agentConfiguration = $AWS_AGENT_CONFIG
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "$BASE_URL/monitoring/instances/$AWS_INSTANCE_ID/configure" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 10

# 2.2 Test configureAgent - GCP
Write-Host "`n2.2 Test POST /monitoring/instances/$GCP_INSTANCE_ID/configure (GCP)" -ForegroundColor Yellow
# Example Ops Agent configuration for GCP
$GCP_AGENT_CONFIG = @{
  metrics = @{
    receivers = @{
      hostmetrics = @{
        type = "hostmetrics"
        collection_interval = "60s"
      }
    }
    processors = @{
      metrics_filter = @{
        type = "exclude_metrics"
        metrics_pattern = @()
      }
    }
    service = @{
      pipelines = @{
        pipeline1 = @{
          receivers = @("hostmetrics")
          processors = @("metrics_filter")
        }
      }
    }
  }
  logging = @{
    receivers = @{
      syslog = @{
        type = "syslog"
        transport_protocol = "tcp"
        listen_address = "localhost:5140"
      }
    }
    service = @{
      pipelines = @{
        pipeline1 = @{
          receivers = @("syslog")
        }
      }
    }
  }
}

$body = @{
  provider = "gcp"
  region = $GCP_ZONE
  agentConfiguration = $GCP_AGENT_CONFIG
} | ConvertTo-Json -Depth 10

$response = Invoke-RestMethod -Uri "$BASE_URL/monitoring/instances/$GCP_INSTANCE_ID/configure" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 10

# 2.3 Test getAgentStatus - AWS
Write-Host "`n2.3 Test GET /monitoring/instances/$AWS_INSTANCE_ID/agent-status (AWS)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/monitoring/instances/$AWS_INSTANCE_ID/agent-status`?provider=aws&region=$AWS_REGION&commandId=$AWS_COMMAND_ID" -Method Get
$response | ConvertTo-Json -Depth 10

# 2.4 Test getAgentStatus - GCP
Write-Host "`n2.4 Test GET /monitoring/instances/$GCP_INSTANCE_ID/agent-status (GCP)" -ForegroundColor Yellow
$response = Invoke-RestMethod -Uri "$BASE_URL/monitoring/instances/$GCP_INSTANCE_ID/agent-status`?provider=gcp&region=$GCP_ZONE" -Method Get
$response | ConvertTo-Json -Depth 10

Write-Host "`n=============================================" -ForegroundColor Blue
Write-Host "   Tests Completed                           " -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue 