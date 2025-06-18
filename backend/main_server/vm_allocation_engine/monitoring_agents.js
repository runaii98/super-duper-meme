const YAML = require('js-yaml');
const cloudWatchAgentConfig = {
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "metrics": {
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_user",
                    "cpu_usage_system",
                    "cpu_usage_iowait",
                    "cpu_usage_guest"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": true
            },
            "disk": {
                "measurement": [
                    "used_percent",
                    "inodes_free"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "/"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent",
                    "mem_available_percent"
                ],
                "metrics_collection_interval": 60
            }
        },
        "append_dimensions": {
            "ImageId": "${aws:ImageId}",
            "InstanceId": "${aws:InstanceId}",
            "InstanceType": "${aws:InstanceType}",
            "AutoScalingGroupName": "${aws:AutoScalingGroupName}"
        },
        "aggregation_dimensions" : [["InstanceId", "InstanceType"], ["InstanceId"], ["AutoScalingGroupName"]],
        "prometheus": {
            "log_group_name": "/ec2/instance/${aws:InstanceId}/prometheus",
            "prometheus_config_path": "/opt/aws/amazon-cloudwatch-agent/etc/prometheus.yaml",
            "metric_declaration": [
                {
                    "source_labels": ["job"],
                    "label_matcher": "^cadvisor$",
                    "dimensions": [["InstanceId", "InstanceType", "container_name"]],
                    "metric_selectors": [
                        "^container_cpu_usage_seconds_total$",
                        "^container_memory_usage_bytes$",
                        "^container_network_receive_bytes_total$",
                        "^container_network_transmit_bytes_total$"
                    ]
                },
                {
                    "source_labels": ["job"],
                    "label_matcher": "^dcgm$",
                    "dimensions": [["InstanceId", "InstanceType", "gpu", "device"]],
                    "metric_selectors": [
                        "^DCGM_FI_DEV_POWER_USAGE$",
                        "^DCGM_FI_DEV_GPU_UTIL$",
                        "^DCGM_FI_DEV_MEM_COPY_UTIL$",
                        "^DCGM_FI_DEV_FB_FREE_PERCENT$",
                        "^DCGM_FI_DEV_FB_USED$"
                    ]
                }
            ]
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/syslog",
                        "log_group_name": "/ec2/instance/${aws:InstanceId}/syslog",
                        "log_stream_name": "{instance_id}_{hostname}_{ip_address}/syslog",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/auth.log",
                        "log_group_name": "/ec2/instance/${aws:InstanceId}/authlog",
                        "log_stream_name": "{instance_id}_{hostname}_{ip_address}/authlog",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/cloud-init-output.log",
                        "log_group_name": "/ec2/instance/${aws:InstanceId}/cloud-init-output",
                        "log_stream_name": "{instance_id}_{hostname}_{ip_address}/cloud-init",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log",
                        "log_group_name": "/ec2/instance/${aws:InstanceId}/cwagent-log",
                        "log_stream_name": "{instance_id}_{hostname}_{ip_address}/cwagent",
                        "timezone": "UTC"
                    }
                ]
            }
        },
        "log_stream_name": "{instance_id}_{hostname}_{ip_address}",
        "force_flush_interval" : 15
    }
};

const gcpOpsAgentConfig = {
    logging: {
        receivers: {
            syslog_receiver: {
                type: 'files',
                include_paths: ['/var/log/syslog', '/var/log/messages']
            },
            auth_receiver: {
                type: 'files',
                include_paths: ['/var/log/auth.log']
            },
            docker_json_receiver: {
                type: 'files',
                include_paths: ['/var/lib/docker/containers/*/*-json.log']
            }
        },
        processors: {
            // Example: Add metadata to Docker logs
            // add_docker_metadata: {
            //    type: "modify_fields",
            //    fields: {
            //        "labels.instance_id": {static_value: "INSTANCE_ID_PLACEHOLDER"}, // Replace with actual instance ID if possible
            //        "labels.hostname": {static_value: "HOSTNAME_PLACEHOLDER"} // Replace with actual hostname
            //    }
            // }
        },
        service: {
            pipelines: {
                default_pipeline: {
                    receivers: ['syslog_receiver', 'auth_receiver']
                },
                docker_pipeline: {
                    receivers: ['docker_json_receiver']
                }
            }
        }
    },
    metrics: {
        receivers: {
            hostmetrics: {
                type: 'hostmetrics',
                collection_interval: '60s'
            },
            docker_metrics: {
                type: 'docker',
                collection_interval: '60s'
            },
            dcgm_prometheus_receiver: {
                type: 'prometheus',
                config: {
                    scrape_configs: [
                        {
                            job_name: 'dcgm-exporter',
                            scrape_interval: '60s',
                            static_configs: [
                                {
                                    targets: ['localhost:9400']
                                }
                            ]
                        }
                    ]
                }
            }
        },
        processors: {
            // Example for adding instance metadata to all metrics:
            // add_instance_metadata: {
            //    type: "modify_fields",
            //    metric_name_prefix: "custom.googleapis.com/", // Or another prefix
            //    fields: {
            //        "labels.instance_id": {static_value: "INSTANCE_ID_PLACEHOLDER"},
            //        "labels.zone": {static_value: "ZONE_PLACEHOLDER"}
            //    }
            // }
        },
        service: {
            pipelines: {
                default_pipeline: {
                    receivers: ['hostmetrics', 'docker_metrics', 'dcgm_prometheus_receiver']
                }
            }
        }
    }
};

const awsPrometheusScrapeConfig = `
global:
  scrape_interval: 60s
scrape_configs:
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['localhost:8080']
  - job_name: 'dcgm'
    static_configs:
      - targets: ['localhost:9400']
`;

/**
 * Generates the UserData script for installing and configuring the AWS CloudWatch Agent.
 * @param {string} osImage - The generic OS image name (e.g., "ubuntu-22.04").
 * @param {string} instanceType - The instance type of the VM.
 * @returns {string} Base64 encoded UserData script.
 */
function getAwsAgentUserData(osImage, instanceType) {
    let dockerInstallScript = "";
    if (osImage.startsWith("ubuntu")) {
        dockerInstallScript = `
# Install Docker (Ubuntu/Debian)
sudo apt-get update -y
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo \\
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \\
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker
sudo systemctl start docker
`;
    } else if (osImage.startsWith("amzn") || osImage.startsWith("amazon")) {
        dockerInstallScript = `
# Install Docker (Amazon Linux 2 / 2023)
sudo yum update -y
sudo yum install -y docker
sudo systemctl enable docker
sudo systemctl start docker
# For Amazon Linux 2023, group management might be different (no 'docker' group by default to add ec2-user to)
# sudo usermod -a -G docker ec2-user # For AL2, might need if running docker commands as ec2-user
`;
    } else {
        dockerInstallScript = "# Docker installation skipped: OS not recognized for automated Docker install from this script";
    }

    const prometheusSetupScript = `
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/prometheus.yaml <<\'PROMEOF\'
${awsPrometheusScrapeConfig}
PROMEOF
`;

    const cAdvisorRun = `
# Run cAdvisor container for Docker metrics (Prometheus target)
# Ensure Docker is running before this
if sudo docker ps -a | grep -q cadvisor; then
    echo "cAdvisor container already exists. Restarting..."
    sudo docker restart cadvisor
else
    echo "Starting cAdvisor container..."
    sudo docker run \\
      --volume=/:/rootfs:ro \\
      --volume=/var/run:/var/run:rw \\
      --volume=/sys:/sys:ro \\
      --volume=/var/lib/docker/:/var/lib/docker:ro \\
      --volume=/dev/disk/:/dev/disk:ro \\
      --publish=8080:8080 \\
      --detach=true \\
      --name=cadvisor \\
      --privileged \\
      --device=/dev/kmsg \\\
      gcr.io/cadvisor/cadvisor:latest
fi
`;

    let gpuSpecificScript = "";
    if (instanceType && (instanceType.startsWith("g") || instanceType.startsWith("p") || instanceType.startsWith("inf"))) {
        if (osImage.startsWith("ubuntu")) {
            gpuSpecificScript = `
# NVIDIA Driver & DCGM Installation (Ubuntu 22.04 for GPU instances)
echo "Starting NVIDIA Driver and DCGM setup..."
sudo apt-get update -y
sudo apt-get install -y software-properties-common
sudo add-apt-repository ppa:graphics-drivers/ppa -y
sudo apt-get update -y

# Install NVIDIA driver (e.g., 535 server series, adjust if needed)
# Using recommended server branch driver
sudo apt-get install -y nvidia-driver-535-server
# Alternatively, for latest CUDA toolkit compatible driver:
# sudo apt-get install -y cuda-drivers

# Install DCGM
# Ref: https://developer.nvidia.com/dcgm#Downloads
# Setup CUDA network repository if not already done for drivers
# Check if CUDA repo key exists
if ! sudo apt-key list | grep -q "cuda-keyring"; then
    wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
    sudo dpkg -i cuda-keyring_1.1-1_all.deb
    sudo apt-get update -y
    rm cuda-keyring_1.1-1_all.deb
fi
sudo apt-get install -y datacenter-gpu-manager

echo "NVIDIA drivers and DCGM installed. Rebooting to load drivers..."
# IMPORTANT: A reboot is typically required for kernel drivers to load correctly.
# Cloud-init should handle reboots if the script exits with a specific code, or just issue reboot.
# This script will continue after reboot if cloud-init re-runs scripts, or parts need to be idempotent.
# For simplicity here, we issue a reboot. Production scripts might need more sophisticated handling.
sudo reboot # UNCOMMENTED for AWS GPU instances
# Instead of reboot, try to load modules and start service, may work for some setups
# sudo modprobe nvidia
# sudo systemctl enable nvidia-dcgm
# sudo systemctl restart nvidia-dcgm || sudo systemctl start nvidia-dcgm # Try restart, then start
# echo "DCGM service started/restarted."
`;
        } else {
            gpuSpecificScript = "# GPU instance type detected, but OS is not Ubuntu. Skipping NVIDIA/DCGM setup.";
        }
    }

    const userData = `#!/bin/bash
set -e
echo "Starting UserData script..."

# Update packages
sudo apt-get update -y || sudo yum update -y # Attempt apt then yum

# Install prerequisites for CloudWatch Agent
if command -v apt-get >/dev/null; then
    sudo apt-get install -y ruby-full wget
elif command -v yum >/dev/null; then
    sudo yum install -y ruby wget
else
    echo "Package manager not found. Cannot install prerequisites."
    exit 1
fi
echo "CloudWatch agent prerequisites installed."

# Download and install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb || wget https://s3.amazonaws.com/amazoncloudwatch-agent/latest/amazon-cloudwatch-agent.rpm -O /tmp/amazon-cloudwatch-agent.rpm

if [ -f /tmp/amazon-cloudwatch-agent.deb ]; then
    sudo dpkg -i -E /tmp/amazon-cloudwatch-agent.deb
elif [ -f /tmp/amazon-cloudwatch-agent.rpm ]; then
    sudo rpm -U /tmp/amazon-cloudwatch-agent.rpm
else
    echo "Failed to download CloudWatch agent package."
    exit 1
fi
echo "CloudWatch agent downloaded and installed."

${dockerInstallScript}
echo "Docker installation script executed."

${gpuSpecificScript}
echo "GPU specific script part executed."

${prometheusSetupScript}
echo "Prometheus config for CloudWatch agent written."

${cAdvisorRun}
echo "cAdvisor container started/restarted."

echo "Writing CloudWatch agent configuration..."
sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo tee /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<\'CWAGENTEOF\'
${JSON.stringify(cloudWatchAgentConfig, null, 2)}
CWAGENTEOF
echo "CloudWatch agent configuration written."

echo "Starting CloudWatch agent..."
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
echo "CloudWatch agent started."

echo "UserData script finished."
`;
    return Buffer.from(userData).toString('base64');
}

/**
 * Generates the startup script for installing and configuring the GCP Ops Agent.
 * @param {string} osImage - The generic OS image name (e.g., "ubuntu-22.04", "debian-11").
 * @param {string} instanceType - The instance type of the VM.
 * @returns {string} Startup script string.
 */
function getGcpAgentStartupScript(osImage, instanceType) {
    // Create a deep copy to avoid modifying the global object
    let gcpOpsAgentConfigWithDynamicValues = JSON.parse(JSON.stringify(gcpOpsAgentConfig));

    // Dynamically add GPU metrics receiver if the instance type suggests GPUs
    // This is a heuristic. A more robust way would be to have actual instance specs.
    if (instanceType && (instanceType.includes('gpu') || instanceType.startsWith('a2-') || instanceType.startsWith('g2-') || instanceType.startsWith('n1-standard-') && (instanceType.endsWith('-vws') || instanceType.includes('p100') || instanceType.includes('v100') || instanceType.includes('t4') || instanceType.includes('a100')) )) {
        console.log(`[AgentConfig] Instance type ${instanceType} suggests GPU presence. Adding DCGM receiver to GCP Ops Agent config.`);
        if (!gcpOpsAgentConfigWithDynamicValues.metrics.receivers.dcgm_prometheus_receiver) {
             gcpOpsAgentConfigWithDynamicValues.metrics.receivers.dcgm_prometheus_receiver = {
                type: 'prometheus',
                config: {
                    scrape_configs: [
                        {
                            job_name: 'dcgm-exporter',
                            scrape_interval: '60s',
                            static_configs: [ { targets: ['localhost:9400'] } ]
                        }
                    ]
                }
            };
        }
        // Ensure the pipeline includes it
        if (!gcpOpsAgentConfigWithDynamicValues.metrics.service.pipelines.default_pipeline.receivers.includes('dcgm_prometheus_receiver')) {
            gcpOpsAgentConfigWithDynamicValues.metrics.service.pipelines.default_pipeline.receivers.push('dcgm_prometheus_receiver');
        }
    } else {
        console.log(`[AgentConfig] Instance type ${instanceType} does not suggest GPU presence or is unknown. Skipping DCGM receiver for GCP Ops Agent.`);
        // Optionally remove it if it exists from a base config and isn't needed
        delete gcpOpsAgentConfigWithDynamicValues.metrics.receivers.dcgm_prometheus_receiver;
        if (gcpOpsAgentConfigWithDynamicValues.metrics.service.pipelines.default_pipeline.receivers.includes('dcgm_prometheus_receiver')) {
            gcpOpsAgentConfigWithDynamicValues.metrics.service.pipelines.default_pipeline.receivers = 
                gcpOpsAgentConfigWithDynamicValues.metrics.service.pipelines.default_pipeline.receivers.filter(r => r !== 'dcgm_prometheus_receiver');
        }
    }
    
    const opsAgentConfigYaml = YAML.dump(gcpOpsAgentConfigWithDynamicValues); // Changed YAML.stringify to YAML.dump

    let installCommands = "";
    let gpuInstallCommands = "";

    // OS-specific installation commands
    if (osImage.startsWith("ubuntu") || osImage.startsWith("debian")) {
        installCommands = `
# Install Ops Agent (Ubuntu/Debian)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install
`;
        // GPU specific setup for Ubuntu/Debian
        if (instanceType && (instanceType.includes('gpu') || instanceType.startsWith('a2-') || instanceType.startsWith('g2-'))) {
            gpuInstallCommands = `
# Install NVIDIA drivers (example for Ubuntu, might need adjustments for specific OS version/kernel)
# This is a complex process and ideally handled by GCP's provided images or scripts.
# This is a placeholder for what would be needed.
# Ensure non-interactive frontend for installs
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -y
# Install prerequisites. On some minimal images, even gcc/make might be missing for driver builds.
sudo apt-get install -y build-essential gcc make dkms linux-headers-$(uname -r) pciutils
# Add NVIDIA CUDA repository (example for CUDA 12.x)
# Check official NVIDIA & GCP docs for the right versions for your instance/GPU
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt-get update -y
sudo apt-get -y install cuda-drivers # Installs latest suitable driver from CUDA repo

# Install DCGM
# Instructions from: https://developer.nvidia.com/dcgm#Downloads
# For Ubuntu/Debian:
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
  && curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list > /dev/null
    sudo apt-get update -y
sudo apt-get install -y datacenter-gpu-manager # Installs DCGM
sudo systemctl enable nvidia-dcgm
sudo systemctl start nvidia-dcgm
`;
        }
    } else if (osImage.startsWith("rhel") || osImage.startsWith("centos") || osImage.startsWith("rocky")) {
        installCommands = `
# Install Ops Agent (RHEL/CentOS/Rocky)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install --rpm
`;
        // GPU specific setup for RHEL/CentOS/Rocky
        if (instanceType && (instanceType.includes('gpu') || instanceType.startsWith('a2-') || instanceType.startsWith('g2-'))) {
             gpuInstallCommands = `
# Install NVIDIA drivers (example for RHEL/CentOS, consult NVIDIA/GCP docs)
# This is a placeholder. Driver installation on RHEL-likes can be involved.
sudo yum install -y kernel-devel-$(uname -r) kernel-headers-$(uname -r) gcc make pciutils
# Add CUDA repo (example, verify for your specific OS version)
sudo yum-config-manager --add-repo https://developer.download.nvidia.com/compute/cuda/repos/rhel8/x86_64/cuda-rhel8.repo
sudo yum install -y nvidia-driver-latest-dkms # Or specific driver version

# Install DCGM (RHEL/CentOS)
# Instructions from: https://developer.nvidia.com/dcgm#Downloads
# For RHEL/CentOS:
# Example for RHEL 8, adjust for your version
distribution=$(. /etc/os-release;echo $ID$VERSION_ID) \
   && curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg \
   && curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/${distribution}/nvidia-container-toolkit.repo | \
      sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo > /dev/null
sudo yum install -y datacenter-gpu-manager
sudo systemctl enable nvidia-dcgm
sudo systemctl start nvidia-dcgm
`;
        }
    } else if (osImage.startsWith("sles")) {
        installCommands = `
# Install Ops Agent (SLES)
curl -sSO https://dl.google.com/cloudagents/add-google-cloud-ops-agent-repo.sh
sudo bash add-google-cloud-ops-agent-repo.sh --also-install --sles
`;
        // GPU specific setup for SLES (Placeholder)
        if (instanceType && (instanceType.includes('gpu') || instanceType.startsWith('a2-') || instanceType.startsWith('g2-'))) {
            gpuInstallCommands = "# GPU Driver and DCGM install for SLES: Consult NVIDIA/GCP documentation.";
        }
    } else {
        return "# Startup script for GCP Ops Agent: OS not recognized for automated agent install.";
        }

    // Combine install commands and agent configuration
    const startupScript = `#!/bin/bash
echo "Starting GCP Ops Agent installation and configuration..."

# Install Ops Agent
${installCommands}

# Install GPU drivers and DCGM if applicable
${gpuInstallCommands}

# Configure Ops Agent
sudo mkdir -p /etc/google-cloud-ops-agent/
sudo tee /etc/google-cloud-ops-agent/config.yaml > /dev/null <<EOF
${opsAgentConfigYaml}
EOF

# Restart Ops Agent to apply the new configuration
# Use systemctl if available, otherwise try service
if command -v systemctl &> /dev/null && systemctl list-units --full -all | grep -q 'google-cloud-ops-agent.service'; then
    sudo systemctl restart google-cloud-ops-agent || echo "Failed to restart google-cloud-ops-agent via systemctl, it might not be running or installed correctly."
    sudo systemctl status google-cloud-ops-agent || true
else
    # Fallback for systems without systemd or if service name differs (less common now)
    if sudo service google-cloud-ops-agent restart; then
        echo "Ops Agent restarted via service."
    else
        echo "Failed to restart google-cloud-ops-agent via service. Check agent status manually."
        # Attempt to start if not running
        sudo service google-cloud-ops-agent start || echo "Failed to start google-cloud-ops-agent via service."
    fi
fi
echo "GCP Ops Agent installation and configuration script finished."
`;
    return startupScript;
}

module.exports = {
    getAwsAgentUserData,
    getGcpAgentStartupScript,
    cloudWatchAgentConfig,
    gcpOpsAgentConfig,
    awsPrometheusScrapeConfig
}; 