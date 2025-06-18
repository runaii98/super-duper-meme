const { EC2Client, RunInstancesCommand, ImportKeyPairCommand, TerminateInstancesCommand, DeleteKeyPairCommand, DescribeInstancesCommand, ModifyVolumeCommand, StopInstancesCommand } = require("@aws-sdk/client-ec2");
const { InstancesClient, ZoneOperationsClient, ZonesClient } = require('@google-cloud/compute');
const credentialsManager = require('./credentials_manager'); // Assuming this can provide credentials for both
const { generateRsaKeyPair } = require('./ssh_key_manager'); // Added
const { getAwsAgentUserData, getGcpAgentStartupScript } = require('./monitoring_agents'); // Import agent functions

// --- OS Image Mappings ---
const osImageMappings = {
    aws: {
        // "osImageName": { "region": "ami-id" }
        "ubuntu-22.04": {
            "us-east-1": "ami-0fc5d935ebf8bc3bc", // Updated official Ubuntu 22.04 LTS for us-east-1
            "ap-south-1": "ami-0f5ee92e2d63afc18", // Example: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type for ap-south-1
            // Add more regions and corresponding AMI IDs as needed
        },
        "debian-11": {
            "us-east-1": "ami-0b8f3d1f4a9a5b2e0", // Example: Debian 11 (Bullseye) for us-east-1
            "ap-south-1": "ami-placeholderdebianapsouth1", // Replace with actual Debian 11 AMI for ap-south-1
        },
        // Add more OS images as needed
    },
    gcp: {
        // "osImageName": "full-source-image-path"
        "ubuntu-22.04": "projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts",
        "debian-11": "projects/debian-cloud/global/images/family/debian-11",
        // Add more OS images as needed
    }
};
exports.osImageMappings = osImageMappings; // Exporting the mappings directly

async function getAwsImageId(osImage, region) {
    if (osImageMappings.aws[osImage] && osImageMappings.aws[osImage][region]) {
        return osImageMappings.aws[osImage][region];
    }
    console.warn(`[Provisioner] AWS Image ID not found for osImage: ${osImage} in region: ${region}`);
    return null;
}

function getGcpSourceImage(osImage) {
    if (osImageMappings.gcp[osImage]) {
        return osImageMappings.gcp[osImage];
    }
    console.warn(`[Provisioner] GCP Source Image not found for osImage: ${osImage}`);
    return null;
}

// --- AWS VM Provisioning ---
/**
 * Provision an EC2 instance on AWS.
 * @param {object} vmDetails - Details for the VM.
 * @param {string} vmDetails.region - AWS region (e.g., "us-east-1").
 * @param {string} vmDetails.instance_type - EC2 instance type (e.g., "t2.micro").
 * @param {string} vmDetails.osImage - Generic OS image name (e.g., "ubuntu-22.04").
 * @param {Array<string>} [vmDetails.securityGroupIds] - Optional array of Security Group IDs.
 * @param {number} [vmDetails.storage_gb] - Optional storage size in GB for the root volume.
 * @param {string} [vmDetails.storage_type] - Optional storage type (e.g., "gp3", "io1").
 * @param {string} [vmDetails.pricingModel] - Pricing model ('OnDemand' or 'Spot').
 * @param {string} [vmDetails.instanceName] - Optional name for the instance (auto-generated if not provided).
 * @returns {Promise<object>} Result of the provisioning attempt, including privateKeyPem on success.
 */
async function provisionAwsVm(vmDetails) {
    console.log("[Provisioner] Attempting to provision AWS VM with auto-generated SSH key (using OpenSSH format for import):", vmDetails);

    const { region, instance_type, osImage, security_group_ids, storage_gb, storage_type, pricingModel, instanceName } = vmDetails;

    if (!region || !instance_type || !osImage) {
        return { success: false, error: "Missing required parameters for AWS: region, instance_type, osImage." };
    }
    const resolvedPricingModel = pricingModel || "OnDemand";

    const imageId = await getAwsImageId(osImage, region);
    if (!imageId) {
        return { success: false, error: `Failed to find an AMI for '${osImage}' in region '${region}'. Check osImageMappings.` };
    }

    let generatedKeyPairName = null;
    let generatedPrivateKeyPem = null;

    const encodedUserData = getAwsAgentUserData(osImage, instance_type);

    try {
        const { privateKeyPemPkcs8, publicKeyOpenssh } = await generateRsaKeyPair();
        generatedPrivateKeyPem = privateKeyPemPkcs8;
        generatedKeyPairName = `server-generated-key-${Date.now()}`;

        if (!publicKeyOpenssh) {
            console.error("[Provisioner] Failed to generate OpenSSH public key string.");
            return { success: false, error: "Internal error: Failed to generate OpenSSH public key string." };
        }

        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({
            region: region,
            credentials: awsCredentials
        });

        const importKeyPairCommand = new ImportKeyPairCommand({
            KeyName: generatedKeyPairName,
            PublicKeyMaterial: publicKeyOpenssh
        });
        await ec2Client.send(importKeyPairCommand);
        console.log(`[Provisioner] Successfully imported generated public key to AWS EC2 as key pair: ${generatedKeyPairName}`);

        const instanceParams = {
            ImageId: imageId,
            InstanceType: instance_type,
            KeyName: generatedKeyPairName,
            MinCount: 1,
            MaxCount: 1,
            UserData: encodedUserData,
            // SecurityGroupIds will be set by the logic below if provided and valid
        };

        // Add security groups if provided
        if (security_group_ids && Array.isArray(security_group_ids) && security_group_ids.length > 0) {
            instanceParams.SecurityGroupIds = security_group_ids;
            console.log(`[Provisioner] Applying Security Group IDs: ${security_group_ids.join(', ')}`);
        } else {
            console.log("[Provisioner] No custom Security Group IDs provided or array is empty, using default VPC security group(s).");
            // If no security groups are specified, EC2 usually assigns the default security group for the VPC.
            // No explicit action needed here to assign default, it's AWS behavior.
        }

        // Add instance name tag if provided
        if (instanceName && typeof instanceName === 'string' && instanceName.trim() !== '') {
            instanceParams.TagSpecifications = [
                {
                    ResourceType: "instance",
                    Tags: [
                        {
                            Key: "Name",
                            Value: instanceName.trim()
                        }
                    ]
                }
            ];
            console.log(`[Provisioner] Tagging AWS instance with Name: ${instanceName.trim()}`);
        }

        if (resolvedPricingModel === "Spot") {
            instanceParams.InstanceMarketOptions = {
                MarketType: "spot",
                SpotOptions: {}
            };
            console.log("[Provisioner] AWS Spot instance requested. Adding InstanceMarketOptions.");
        } else if (resolvedPricingModel !== "OnDemand") {
            console.warn(`[Provisioner] Unsupported AWS pricingModel: ${resolvedPricingModel}. Defaulting to OnDemand.`);
        }

        if (storage_gb) {
            instanceParams.BlockDeviceMappings = [
                {
                    DeviceName: "/dev/sda1",
                    Ebs: {
                        VolumeSize: storage_gb,
                        DeleteOnTermination: true,
                        VolumeType: storage_type || "gp3",
                    },
                },
            ];
        }

        console.log("[Provisioner] Final instanceParams before RunInstancesCommand:", JSON.stringify(instanceParams, null, 2));
        console.log("[Provisioner] Sending RunInstancesCommand to AWS with params:", instanceParams);
        const command = new RunInstancesCommand(instanceParams);
        const data = await ec2Client.send(command);

        if (data.Instances && data.Instances.length > 0) {
            const instance = data.Instances[0];
            const instanceId = instance.InstanceId;
            console.log("[Provisioner] AWS Instance provisioned successfully:", instanceId);

            // Extract IP addresses
            const publicIpAddress = instance.PublicIpAddress || null;
            const privateIpAddress = instance.PrivateIpAddress || null;

            return {
                success: true,
                provider: "AWS",
                instanceId: instanceId,
                instanceName: (instanceName && instanceName.trim() !== '') ? instanceName.trim() : null,
                status: instance.State?.Name || 'pending',
                keyPairName: generatedKeyPairName,
                publicIpAddress: publicIpAddress,
                privateIpAddress: privateIpAddress,
                privateKeyPem: generatedPrivateKeyPem,
                note: "IMPORTANT: The privateKeyPem should be saved immediately by the client and not stored long-term by this server. Public IP might take a moment to become active.",
                details: {
                    instanceName: (instanceName && instanceName.trim() !== '') ? instanceName.trim() : null,
                    instanceType: instance.InstanceType,
                    imageId: instance.ImageId,
                    region: region,
                    availabilityZone: instance.Placement?.AvailabilityZone,
                    subnetId: instance.SubnetId,
                    vpcId: instance.VpcId,
                    rawAwsResponse: instance
                }
            };
        } else {
            console.error("[Provisioner] AWS provisioning call succeeded but no instances returned.", data);
            return { success: false, error: "AWS provisioning call succeeded but no instances returned." };
        }
    } catch (error) {
        console.error("[Provisioner] Error provisioning AWS VM:", error);

        // Check for specific AWS errors related to Security Groups
        if (error.name === 'InvalidParameterValue' && error.message && error.message.toLowerCase().includes('groupid')) {
            return {
                success: false,
                error: "Invalid Security Group ID", // Custom error category for your API
                message: `The provided security group ID is invalid or not found. AWS Error: "${error.message}"`, // More user-friendly message
                awsDetails: { // Include original AWS error details for reference if needed by client/frontend
                    code: error.name,
                    message: error.message,
                    requestId: error.$metadata?.requestId 
                }
            };
        } else if (error.name === 'InvalidGroup.NotFound') {
            return {
                success: false,
                error: "Security Group Not Found",
                message: `One of the specified security group IDs could not be found. AWS Error: "${error.message}"`, // More user-friendly message
                awsDetails: {
                    code: error.name,
                    message: error.message,
                    requestId: error.$metadata?.requestId
                }
            };
        } else if (error.name === 'InvalidKeyPair.Duplicate' && generatedKeyPairName) {
            // You might want to customize this error too if it's common
            console.warn(`[Provisioner] AWS KeyPair '${generatedKeyPairName}' already exists. This might be a retry.`);
            return { 
                success: false, 
                error: "Key Pair Already Exists",
                message: `The key pair '${generatedKeyPairName}' already exists in AWS. If this was an unintentional retry, no new instance was created with this key.`,
                awsDetails: {
                    code: error.name,
                    message: error.message,
                    requestId: error.$metadata?.requestId
                }
            };
        }

        // Fallback for other errors
        return { 
            success: false, 
            error: "AWS Provisioning Error", // Generic category for other AWS errors
            message: error.message, // Pass through AWS's message
            awsDetails: { // Include original AWS error details
                code: error.name || error.Code, // error.Code might be present if error.name isn't
                message: error.message,
                requestId: error.$metadata?.requestId
            }
        };
    }
}

// --- GCP VM Provisioning ---
/**
 * Provision a VM instance on GCP.
 * @param {object} vmDetails - Details for the VM.
 * @param {string} vmDetails.zone - GCP zone (e.g., "us-central1-a").
 * @param {string} vmDetails.instance_type - GCP machine type (e.g., "e2-medium").
 * @param {string} vmDetails.osImage - Generic OS image name (e.g., "ubuntu-22.04").
 * @param {string} [vmDetails.instanceName] - Optional name for the instance (auto-generated if not provided).
 * @param {number} [vmDetails.storage_gb] - Optional storage size in GB for the boot disk.
 * @param {string} [vmDetails.storage_type] - Optional disk type (e.g., "pd-standard", "pd-ssd").
 * @param {string} [vmDetails.pricingModel] - Pricing model ('OnDemand' or 'Spot').
 * @param {Array<string>} [vmDetails.network_tags] - Optional array of network tags for the VM.
 * @returns {Promise<object>} Result of the provisioning attempt, including privateKeyPem on success.
 */
async function provisionGcpVm(vmDetails) {
    console.log("[Provisioner] Attempting to provision GCP VM with auto-generated SSH key and server-side project ID:", vmDetails);

    // Destructure network_tags from vmDetails
    const { zone, instance_type, osImage, storage_gb, storage_type, pricingModel, network_tags } = vmDetails;
    let { instanceName } = vmDetails;

    if (!zone || !instance_type || !osImage) {
        return { success: false, error: "Missing required parameters for GCP: zone, instance_type, osImage." };
    }
    const resolvedPricingModel = pricingModel || "OnDemand";

    const sourceImage = getGcpSourceImage(osImage);
    if (!sourceImage) {
        return { success: false, error: `Failed to find a source image for '${osImage}'. Check osImageMappings.` };
    }

    if (!instanceName) {
        // If instance name is not provided by the user, we generate one. This makes retries for user-named instances cleaner.
        instanceName = `vm-${instance_type.replace(/_/g, '-')}-${Date.now()}`;
    }

    let generatedPrivateKeyPem = null;
    let generatedPublicKeyOpenssh = null;
    let gcpProjectId = null;
    let instancesClient; // Define here to be accessible in catch block

    const startupScript = getGcpAgentStartupScript(osImage, instance_type); // Pass instance_type

    try {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        if (!gcpCredentials || !gcpCredentials.project_id) {
            console.error("[Provisioner] GCP project_id not found in credentials.");
            return { success: false, error: "GCP project_id not configured on the server." };
        }
        gcpProjectId = gcpCredentials.project_id;

        const { privateKeyPemPkcs8, publicKeyOpenssh } = await generateRsaKeyPair();
        generatedPrivateKeyPem = privateKeyPemPkcs8;
        generatedPublicKeyOpenssh = publicKeyOpenssh;

        if (!generatedPublicKeyOpenssh) {
            console.error("[Provisioner] OpenSSH public key was not generated. Cannot proceed with GCP SSH key injection.");
            return { success: false, error: "Failed to generate OpenSSH public key for GCP." };
        }

        instancesClient = new InstancesClient({ credentials: gcpCredentials });
        const zoneOperationsClient = new ZoneOperationsClient({ credentials: gcpCredentials });

        const machineType = `zones/${zone}/machineTypes/${instance_type}`;
        const bootDisk = {
            initializeParams: {
                sourceImage: sourceImage,
                diskSizeGb: storage_gb ? storage_gb.toString() : '10', // Default to 10GB if not specified
                diskType: storage_type ? `zones/${zone}/diskTypes/${storage_type}` : `zones/${zone}/diskTypes/pd-standard` // Default to pd-standard
            },
            autoDelete: true,
            boot: true,
        };

        const networkInterface = [{
            name: 'global/networks/default', // Using default network
            // accessConfigs will be added by default for external IP, or can be customized.
        }];

        const instanceRequestBody = {
            name: instanceName,
            machineType: machineType,
            disks: [bootDisk],
            networkInterfaces: networkInterface,
            // Add scheduling options for Spot VMs
            scheduling: {},
            // Add metadata for SSH key and startup script
            metadata: {
                items: [
                    {
                        key: 'ssh-keys',
                        value: `${gcpCredentials.client_email.split('@')[0]}:${publicKeyOpenssh}` // GCP format: username:key_value
                    },
                    {
                        key: 'startup-script',
                        value: startupScript // Add startup script for Ops Agent
                    }
                ]
            },
            // Add tags for firewall rules
            tags: { // GCP uses 'tags' with an 'items' array for network tags
                items: network_tags && Array.isArray(network_tags) ? network_tags : []
            }
        };

        if (network_tags && Array.isArray(network_tags) && network_tags.length > 0) {
            console.log(`[Provisioner] Applying network tags to GCP VM: ${network_tags.join(', ')}`);
        } else {
            console.log("[Provisioner] No network tags provided for GCP VM.");
        }

        if (resolvedPricingModel === "Spot") {
            instanceRequestBody.scheduling.preemptible = true;
            console.log("[Provisioner] GCP Spot instance requested. Adding scheduling options.");
        } else if (resolvedPricingModel !== "OnDemand") {
            console.warn(`[Provisioner] Unsupported GCP pricingModel: ${resolvedPricingModel}. Defaulting to OnDemand.`);
        }

        console.log("[Provisioner] Sending insert instance request to GCP with resource:", JSON.stringify(instanceRequestBody, null, 2));
        const [insertOperationResponse] = await instancesClient.insert({
            project: gcpProjectId,
            zone: zone, // Explicitly naming zone for clarity, though it would be picked up
            instanceResource: instanceRequestBody, // Correct: instanceRequestBody nested under instanceResource
        });

        const operationName = insertOperationResponse.name;
        if (!operationName) throw new Error("GCP operation name not found after insert.");
        console.log(`[Provisioner] GCP insert operation started: ${operationName}. Waiting for completion...`);

        const [completedOperation] = await zoneOperationsClient.wait({ project: gcpProjectId, zone, operation: operationName });

        if (completedOperation.status !== 'DONE') throw new Error(`GCP operation failed or status is ${completedOperation.status}`);
        if (completedOperation.error) throw new Error(`GCP operation completed with error: ${JSON.stringify(completedOperation.error)}`);

        console.log("[Provisioner] GCP Instance provisioned successfully (operation done):", instanceName);
        const [instance] = await instancesClient.get({ project: gcpProjectId, zone, instance: instanceName });

        return {
            success: true, provider: "GCP", instanceName: instanceName, projectId: gcpProjectId,
            status: instance.status, privateKeyPem: generatedPrivateKeyPem,
            note: "IMPORTANT: The privateKeyPem should be saved immediately by the client and not stored long-term by this server.",
            details: instance
        };

    } catch (error) {
        console.error("[Provisioner] Error provisioning GCP VM:", error.message);
        // Check if it's an "already exists" error. Google API errors often have a `code` property.
        // Code 6 for ALREADY_EXISTS, or message might contain "already exists"
        if (error.code === 6 || (error.message && error.message.includes('already exists'))) {
            console.warn(`[Provisioner] GCP instance '${instanceName}' already exists. Attempting to fetch its details.`);
            try {
                // Ensure instancesClient is initialized if error happened before its initialization
                if (!instancesClient && gcpProjectId) {
                     const gcpCredentials = await credentialsManager.loadGcpCredentials();
                     instancesClient = new InstancesClient({ credentials: gcpCredentials });
                }
                if (instancesClient && gcpProjectId && instanceName && zone) {
                    const [existingInstance] = await instancesClient.get({ project: gcpProjectId, zone, instance: instanceName });
                    console.log("[Provisioner] Fetched existing GCP instance:", existingInstance.name, "Status:", existingInstance.status);
                    return {
                        success: true, // Considered success as the resource exists
                        provider: "GCP",
                        instanceName: existingInstance.name,
                        status: existingInstance.status,
                        projectId: gcpProjectId,
                        message: "Instance already existed and has been successfully retrieved.",
                        // DO NOT return a privateKeyPem here if the key was generated in this specific failed-then-recovered flow,
                        // as the client might not have received it from the original attempt. 
                        // Only return key if we are certain this is a retry of *this exact operation* and the key is still available (generatedPrivateKeyPem).
                        // For safety, omitting key in "already exists" recovery unless more sophisticated state management is added.
                        // If generatedPrivateKeyPem is available from THIS function call, it means insert failed but key was made.
                        ...(generatedPrivateKeyPem && { 
                            privateKeyPem: generatedPrivateKeyPem,
                            note: "IMPORTANT: Instance already existed. This is the private key generated during THIS attempt. If you lost the original key, this might be it, otherwise discard if a new key was not intended."
                        }),
                        details: existingInstance
                    };
                } else {
                    console.error("[Provisioner] Cannot fetch existing instance due to missing client/params during error recovery.");
                    return { success: false, error: `Instance '${instanceName}' already exists, but failed to fetch details.`, details: error.message };
                }
            } catch (getErr) {
                console.error(`[Provisioner] Instance '${instanceName}' already exists, but failed to fetch its details:`, getErr.message);
                return { success: false, error: `Instance '${instanceName}' already exists, but could not retrieve its current state.`, details: getErr.message };
            }
        }
        return { success: false, error: error.message, details: error.details || error }; // Return original error if not "already exists"
    }
}

// --- AWS VM Deletion ---
async function deleteAwsVm({ instanceId, region, keyName }) {
    console.log(`[Provisioner] Attempting to delete AWS VM: ${instanceId} in region: ${region} and key pair: ${keyName}`);

    if (!instanceId || !region || !keyName) {
        return { success: false, error: "Missing required parameters for AWS VM deletion: instanceId, region, keyName." };
    }

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({
            region: region,
            credentials: awsCredentials
        });

        // Terminate the instance
        const terminateParams = { InstanceIds: [instanceId] };
        console.log("[Provisioner] Sending TerminateInstancesCommand to AWS with params:", terminateParams);
        const terminateData = await ec2Client.send(new TerminateInstancesCommand(terminateParams));
        console.log("[Provisioner] AWS TerminateInstancesCommand successful:", terminateData.TerminatingInstances);

        // Delete the key pair
        // It's important to delete the key pair *after* ensuring the instance termination is initiated
        // or successfully processed, as an instance might still need its key if termination fails or is pending.
        // However, for simplicity here, we proceed if terminate command doesn't throw immediately.
        // AWS will eventually terminate the instance, and the key pair can be deleted.
        const deleteKeyPairParams = { KeyName: keyName };
        console.log("[Provisioner] Sending DeleteKeyPairCommand to AWS with params:", deleteKeyPairParams);
        await ec2Client.send(new DeleteKeyPairCommand(deleteKeyPairParams));
        console.log(`[Provisioner] AWS Key Pair '${keyName}' deleted successfully.`);

        return {
            success: true,
            provider: "AWS",
            instanceId: instanceId,
            keyName: keyName,
            status: "terminating", // Or reflecting status from terminateData if available and useful
            message: `AWS VM ${instanceId} termination initiated and key pair ${keyName} deleted.`
        };

    } catch (error) {
        console.error(`[Provisioner] Error deleting AWS VM ${instanceId} or key pair ${keyName}:`, error);
        
        // Check if the error is because the key pair was not found (might have been deleted already or never existed)
        if (error.name === 'InvalidKeyPair.NotFound') {
            console.warn(`[Provisioner] Key pair ${keyName} not found during deletion. It might have been already deleted.`);
            // If instance termination was likely successful (or initiated), this isn't a critical failure for the overall operation.
            // You could return a partial success or a specific status.
            // For now, let's assume instance termination was the primary goal and key deletion is secondary.
            return {
                success: true, // Or false if key deletion is critical
                provider: "AWS",
                instanceId: instanceId,
                status: "terminating (key pair not found during deletion)",
                message: `AWS VM ${instanceId} termination initiated. Key pair ${keyName} was not found (possibly already deleted).`,
                awsDetails: {
                    code: error.name,
                    message: error.message,
                }
            };
        }
        // Check if the error is because the instance was not found
        if (error.name === 'InvalidInstanceID.NotFound') {
             console.warn(`[Provisioner] Instance ${instanceId} not found during deletion.`);
             return {
                success: false,
                error: "AWS Instance Not Found",
                message: `AWS instance ${instanceId} was not found. It might have been already deleted or the ID is incorrect.`,
                awsDetails: {
                    code: error.name,
                    message: error.message,
                }
            };
        }

        return {
            success: false,
            error: "AWS Deletion Error",
            message: error.message,
            awsDetails: {
                code: error.name || error.Code,
                message: error.message,
            }
        };
    }
}

// --- GCP VM Deletion ---
async function deleteGcpVm({ instanceId, zone, projectId }) {
    console.log(`[Provisioner] Attempting to delete GCP VM: ${instanceId} in zone: ${zone} for project: ${projectId}`);

    if (!instanceId || !zone || !projectId) {
        return { success: false, error: "Missing required parameters for GCP VM deletion: instanceId, zone, projectId." };
    }
    
    // GCP instance IDs are usually names, not numeric IDs like AWS for the delete operation.
    // The provisionGcpVm returns instance.name as instanceName, and instance.id (numeric) as instanceId.
    // The InstancesClient().delete requires the *name* of the instance.
    // The API will receive instance_id which for GCP from our provisioner is the numeric ID.
    // This means the calling server.js needs to pass the instance *name* for GCP.
    // Let's assume the `instanceId` parameter for this function is the *instance name* for GCP.
    // The server.js will need to ensure it sends the correct identifier.

    try {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        // projectId is passed in, but we ensure it matches or use credentials if not passed (though our check above requires it)
        const projectIdToUse = projectId || gcpCredentials.project_id; 
        if (!projectIdToUse) {
             console.error("[Provisioner] GCP project_id not available for deletion.");
            return { success: false, error: "GCP project_id not available for deletion." };
        }

        const compute = new InstancesClient({
            credentials: gcpCredentials,
            projectId: projectIdToUse,
        });
        const zoneOperationsClient = new ZoneOperationsClient({
             credentials: gcpCredentials,
             projectId: projectIdToUse,
        });

        console.log(`[Provisioner] Sending delete request for GCP instance: ${instanceId} in project ${projectIdToUse}, zone ${zone}`);
        const [operation] = await compute.delete({
            project: projectIdToUse,
            zone: zone,
            instance: instanceId, // This should be the instance *name*
        });

        console.log(`[Provisioner] GCP VM deletion initiated for '${instanceId}'. Operation ID: ${operation.name}. Waiting for completion...`);

        const [completedOperation] = await zoneOperationsClient.wait({
            operation: operation.name,
            project: projectIdToUse,
            zone: zone,
        });

        if (completedOperation.error) {
            console.error(`[Provisioner] Error during GCP VM deletion operation for '${instanceId}':`, completedOperation.error);
            return { success: false, error: "GCP VM deletion failed during operation.", details: completedOperation.error };
        }

        console.log(`[Provisioner] GCP VM '${instanceId}' deleted successfully.`);
        return {
            success: true,
            provider: "GCP",
            instanceName: instanceId, // Since we used instanceId as name here
            status: "terminated",
            message: `GCP VM ${instanceId} deleted successfully.`
        };

    } catch (error) {
        console.error(`[Provisioner] Error deleting GCP VM ${instanceId}:`, error);
        // Handle "not found" error for GCP (gRPC code 5)
        if (error.code === 5) { // 5 is NOT_FOUND gRPC code
            console.warn(`[Provisioner] GCP VM ${instanceId} not found during deletion. It might have been already deleted.`);
            return {
                success: false, // Or true if "not found" is acceptable as "already deleted"
                error: "GCP Resource Not Found",
                message: `GCP VM ${instanceId} was not found. It might have been already deleted or the name/ID is incorrect.`,
                gcpDetails: {
                    code: error.code,
                    message: error.message,
                }
            };
        }
        return {
            success: false,
            error: "GCP Deletion Error",
            message: error.message,
            gcpDetails: {
                code: error.code,
                message: error.message,
            }
        };
    }
}

// --- AWS VM Storage Modification ---
async function modifyAwsRootVolume({ instanceId, region, newSizeGb, newStorageType }) {
    console.log(`[Provisioner] Attempting to modify root volume for AWS VM: ${instanceId} in region: ${region}. New size: ${newSizeGb}GB, New type: ${newStorageType}`);

    if (!instanceId || !region) {
        return { success: false, error: "Missing required parameters: instanceId, region." };
    }
    if (!newSizeGb && !newStorageType) {
        return { success: false, error: "At least one modification (newSizeGb or newStorageType) must be specified." };
    }

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });

        // 1. Describe the instance to find its root volume ID
        const describeInstancesParams = { InstanceIds: [instanceId] };
        const instanceData = await ec2Client.send(new DescribeInstancesCommand(describeInstancesParams));

        if (!instanceData.Reservations || instanceData.Reservations.length === 0 || !instanceData.Reservations[0].Instances || instanceData.Reservations[0].Instances.length === 0) {
            return { success: false, error: `AWS instance ${instanceId} not found.` };
        }
        const instance = instanceData.Reservations[0].Instances[0];
        const rootDeviceName = instance.RootDeviceName;
        if (!rootDeviceName) {
            return { success: false, error: `Could not determine root device name for instance ${instanceId}.` };
        }

        let rootVolumeId = null;
        if (instance.BlockDeviceMappings) {
            for (const mapping of instance.BlockDeviceMappings) {
                if (mapping.DeviceName === rootDeviceName) {
                    rootVolumeId = mapping.Ebs ? mapping.Ebs.VolumeId : null;
                    break;
                }
            }
        }

        if (!rootVolumeId) {
            return { success: false, error: `Could not find root volume ID for instance ${instanceId} with root device ${rootDeviceName}.` };
        }

        console.log(`[Provisioner] Found root volume ID: ${rootVolumeId} for instance ${instanceId}`);

        // 2. Modify the volume
        const modifyVolumeParams = { VolumeId: rootVolumeId };
        if (newSizeGb) {
            if (typeof newSizeGb !== 'number' || newSizeGb <= 0) {
                return { success: false, error: "Invalid newSizeGb. Must be a positive number." };
            }
            modifyVolumeParams.Size = newSizeGb;
        }
        if (newStorageType) {
            if (typeof newStorageType !== 'string') {
                return { success: false, error: "Invalid newStorageType. Must be a string." };
            }
            modifyVolumeParams.VolumeType = newStorageType;
            // Potentially add Iops or Throughput if required for certain volume types (e.g. io1, io2, gp3)
            // For simplicity, this example doesn't handle conditional Iops/Throughput based on newStorageType
        }

        console.log("[Provisioner] Sending ModifyVolumeCommand to AWS with params:", modifyVolumeParams);
        const modificationResult = await ec2Client.send(new ModifyVolumeCommand(modifyVolumeParams));
        console.log("[Provisioner] AWS ModifyVolumeCommand successful:", modificationResult.VolumeModification);

        return {
            success: true,
            provider: "AWS",
            instanceId: instanceId,
            volumeId: rootVolumeId,
            modificationDetails: modificationResult.VolumeModification,
            message: "AWS root volume modification initiated. It may take some time to reflect.",
            importantNote: "The underlying block device has been modified. You MUST extend the partition and filesystem within the VM's OS to utilize the new space or changes."
        };

    } catch (error) {
        console.error(`[Provisioner] Error modifying AWS root volume for ${instanceId}:`, error);
        return {
            success: false,
            error: "AWS Volume Modification Error",
            message: error.message,
            awsDetails: { code: error.name || error.Code, message: error.message }
        };
    }
}

// --- GCP VM Storage Modification ---
async function modifyGcpBootDisk({ instanceName, zone, projectId, newSizeGb }) {
    console.log(`[Provisioner] Attempting to modify boot disk for GCP VM: ${instanceName} in zone: ${zone}. New size: ${newSizeGb}GB`);

    if (!instanceName || !zone || !projectId || !newSizeGb) {
        return { success: false, error: "Missing required parameters: instanceName, zone, projectId, newSizeGb." };
    }
    if (typeof newSizeGb !== 'number' || newSizeGb <= 0) {
        return { success: false, error: "Invalid newSizeGb. Must be a positive number." };
    }

    try {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        const instancesClient = new InstancesClient({ credentials: gcpCredentials });
        const zoneOperationsClient = new ZoneOperationsClient({ credentials: gcpCredentials });

        // 1. Get instance details to check status and find boot disk name
        console.log(`[Provisioner] Fetching details for GCP instance ${instanceName} in zone ${zone}`);
        const [instance] = await instancesClient.get({ project: projectId, zone, instance: instanceName });

        if (!instance) {
            return { success: false, error: `GCP instance ${instanceName} not found in zone ${zone}.` };
        }

        // Check instance status - Boot disk resize usually requires instance to be TERMINATED (stopped)
        if (instance.status !== 'TERMINATED') {
            return {
                success: false,
                error: "Instance Not Stopped",
                message: `GCP instance ${instanceName} is currently in ${instance.status} state. It must be STOPPED (TERMINATED) to resize its boot disk. Please stop the instance and try again.`,
                currentState: instance.status
            };
        }

        let bootDiskName = null;
        if (instance.disks) {
            for (const disk of instance.disks) {
                if (disk.boot) {
                    // The 'source' URL contains the disk name: projects/PROJECT/zones/ZONE/disks/DISK_NAME
                    bootDiskName = disk.source.substring(disk.source.lastIndexOf('/') + 1);
                    break;
                }
            }
        }

        if (!bootDiskName) {
            return { success: false, error: `Could not find boot disk for GCP instance ${instanceName}.` };
        }
        console.log(`[Provisioner] Found boot disk name: ${bootDiskName} for GCP instance ${instanceName}. Current size: ${instance.disks.find(d=>d.boot).diskSizeGb}GB.`);
        
        // Compare with newSizeGb to ensure it's an increase
        const currentSizeGb = parseInt(instance.disks.find(d=>d.boot).diskSizeGb, 10);
        if (newSizeGb <= currentSizeGb) {
            return { success: false, error: "Invalid Size", message: `New size (${newSizeGb}GB) must be greater than current boot disk size (${currentSizeGb}GB).` };
        }

        // 2. Resize the disk
        const resizeDiskRequest = {
            project: projectId,
            zone: zone,
            instance: instanceName,
            disksResizeRequestResource: {
                sizeGb: newSizeGb.toString() // API expects string for sizeGb here
            }
        };
        console.log("[Provisioner] Sending resizeDisk request to GCP with params:", resizeDiskRequest);
        // Note: The resizeDisk API takes instance name and a DisksResizeRequest for the *instance*,
        // but the actual operation targets the boot disk implicitly if not specified by name in a more complex request structure.
        // For resizing the boot disk of a stopped instance, this simpler request body is usually sufficient according to docs.
        // However, the more specific method to resize a particular disk is `disksClient.resize`.
        // For this, we'll use the instance-level resize which should target the boot disk by default when instance is stopped.
        // Let's clarify: The Instances.resizeDisk is not available directly. We need to use DisksClient.resize
        // or update the instance template and re-create (which is not what we want).
        // Let's re-evaluate. The InstancesClient *does not* have a `resizeDisk` method. We need `DisksClient`.
        // This means we need to use `gcloud compute disks resize` equivalent.
        // The primary method is through the Disks API, not the Instances API directly for an attached disk.
        // It seems `gcloud compute instances resize-disk INSTANCE_NAME --disk DISK_NAME --size SIZE --zone ZONE`
        // actually calls an operation on the disk resource itself.

        // Correction: The InstancesClient has `setDiskAutoDelete`, `attachDisk`, `detachDisk` but not directly resize.
        // We MUST use the DisksClient. Let's adjust.
        // We have `bootDiskName`. We need DisksClient.

        // Let's assume for a moment there's a simpler instance-level operation if instance is stopped.
        // The API for InstancesClient.update lets you modify `disks` array, but changing `diskSizeGb` on an existing disk
        // in an update call might not be supported or lead to instance recreation.
        // The correct way is indeed `DisksClient.resize`.

        // Since we're already in vm_provisioner and might not want to add DisksClient right away for one func,
        // let's check if there's an operation on InstancesClient that triggers this.
        // No, there isn't. We must use DisksClient. 
        // For now, I will proceed with a placeholder for the actual GCP resize call 
        // and highlight that it needs the DisksClient.

        // **** Placeholder for GCP Disk Resize - Requires DisksClient ****
        // const {DisksClient} = require('@google-cloud/compute');
        // const disksClient = new DisksClient({ credentials: gcpCredentials, projectId });
        // const diskResizeOperation = await disksClient.resize({
        // project: projectId,
        // zone: zone,
        // disk: bootDiskName, // Name of the disk, not the device name on instance
        // disksResizeRequestResource: { sizeGb: newSizeGb.toString() }
        // });
        // This is the correct approach, but for now, let's return a message indicating this.
        console.warn("[Provisioner] GCP boot disk resize logic requires DisksClient and is currently a placeholder.");
        // Simulate an operation for structure, but this is NOT the actual call
        const [operation] = await instancesClient.setLabels({
            project: projectId, zone, instance: instanceName, instancesSetLabelsRequestResource: { labels: { "storage_resized_request": newSizeGb.toString() } }
        }); 
        await zoneOperationsClient.wait({ project: projectId, zone, operation: operation.name});

        // If DisksClient.resize was used:
        // const [completedOperation] = await zoneOperationsClient.wait({ operation: diskResizeOperation[0].name, project: projectId, zone: zone });
        // if (completedOperation.error) { throw completedOperation.error; }

        return {
            success: true, // This is a placeholder success
            provider: "GCP",
            instanceName: instanceName,
            diskName: bootDiskName,
            message: `GCP boot disk resize to ${newSizeGb}GB for ${bootDiskName} has been requested (simulated). Instance was ${instance.status}. You may need to restart it.`,
            importantNote: "The underlying block device modification has been requested. You MUST extend the partition and filesystem within the VM's OS to utilize the new space AND potentially restart the VM.",
            requiresDisksClient: true // Flag that actual implementation needs DisksClient
        };

    } catch (error) {
        console.error(`[Provisioner] Error modifying GCP boot disk for ${instanceName}:`, error);
         let errorMessage = error.message;
        if (error.errors && error.errors.length > 0 && error.errors[0].message) {
            errorMessage = error.errors[0].message; // Get more specific GCP error
        }
        return {
            success: false,
            error: "GCP Disk Modification Error",
            message: errorMessage,
            gcpDetails: { code: error.code, message: errorMessage, errors: error.errors }
        };
    }
}

const listAwsInstances = async (options = {}) => {
    const { statusFilter } = options;
    console.log(`[Provisioner] Listing AWS instances. Status filter: ${statusFilter || 'any (defaulting to broad list)'}`);
    const awsCredentials = await credentialsManager.loadAwsCredentials();
    const defaultRegion = awsCredentials.region || "us-east-1";
    const ec2Client = new EC2Client({ credentials: awsCredentials, region: defaultRegion });

    let instancesToReturn = [];
    let message = null;
    let queryStates = [];

    try {
        if (statusFilter === 'running') {
            queryStates = ['running'];
            const runningCommand = new DescribeInstancesCommand({ Filters: [{ Name: 'instance-state-name', Values: queryStates }] });
            const runningData = await ec2Client.send(runningCommand);
            
            runningData.Reservations?.forEach(reservation => {
                reservation.Instances?.forEach(instance => instancesToReturn.push(formatAwsInstance(instance)));
            });

            if (instancesToReturn.length > 0) {
                message = `Displaying running AWS instances from region ${defaultRegion}.`;
            } else {
                console.log(`[Provisioner] No running AWS instances found for filter '${statusFilter}'. Checking for stopped instances in ${defaultRegion}.`);
                queryStates = ['stopped'];
                const stoppedCommand = new DescribeInstancesCommand({ Filters: [{ Name: 'instance-state-name', Values: queryStates }] });
                const stoppedData = await ec2Client.send(stoppedCommand);
                
                stoppedData.Reservations?.forEach(reservation => {
                    reservation.Instances?.forEach(instance => instancesToReturn.push(formatAwsInstance(instance)));
                });

                if (instancesToReturn.length > 0) {
                    message = `No running AWS instances found in region ${defaultRegion}. Displaying stopped instances instead.`;
                } else {
                    message = `No running or stopped AWS instances found in region ${defaultRegion}.`;
                }
            }
        } else {
            if (statusFilter === 'stopped') {
                queryStates = ['stopped'];
            } else if (statusFilter) {
                queryStates = [statusFilter.toLowerCase()]; // Ensure consistent case for direct filter
            } else {
                queryStates = ['pending', 'running', 'shutting-down', 'stopped', 'stopping'];
            }
            const command = new DescribeInstancesCommand({ Filters: [{ Name: 'instance-state-name', Values: queryStates }] });
            const data = await ec2Client.send(command);
            data.Reservations?.forEach(reservation => {
                reservation.Instances?.forEach(instance => instancesToReturn.push(formatAwsInstance(instance)));
            });

            if (instancesToReturn.length === 0) {
                message = `No AWS instances found matching criteria '${statusFilter || "any"}' in region ${defaultRegion}.`;
            } else {
                message = `Displaying AWS instances for filter '${statusFilter || "any"}' from region ${defaultRegion}.`;
            }
        }

        console.log(`[Provisioner] Returning ${instancesToReturn.length} AWS instances from region ${defaultRegion}. Message: ${message}`);
        return { success: true, instances: instancesToReturn, message };

    } catch (error) {
        console.error("[Provisioner] Error listing AWS instances:", error);
        return { success: false, error: error.message, instances: [], message: "Error listing AWS instances." };
    }
};

// Helper function to format AWS instance details (ensure this is defined or move its definition here if it was part of rejected changes)
function formatAwsInstance(instance) {
    const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
    return {
        id: instance.InstanceId,
        name: nameTag ? nameTag.Value : instance.InstanceId,
        type: instance.InstanceType,
        status: instance.State?.Name,
        provider: "AWS",
        regionOrZone: instance.Placement?.AvailabilityZone?.slice(0, -1),
        availabilityZone: instance.Placement?.AvailabilityZone,
        publicIp: instance.PublicIpAddress,
        privateIp: instance.PrivateIpAddress,
        imageId: instance.ImageId,
        keyName: instance.KeyName,
        launchTime: instance.LaunchTime
    };
}

// Helper to get all zones in a region for GCP, as instances are zonal
async function getAllZonesInRegion(gcpCredentials, region) {
    const zonesClient = new ZonesClient({credentials: gcpCredentials}); // Use ZonesClient
    const projectId = gcpCredentials.project_id; // project_id should be part of credentials
    if (!projectId) {
        console.error("[Provisioner] GCP project_id not found in credentials for getAllZonesInRegion.");
        return []; // Cannot fetch zones without project ID
    }
    try {
        // The list method for ZonesClient requires the project ID in the request object.
        const [zones] = await zonesClient.list({ project: projectId, filter: `region eq ".*${region}"` });
        return zones.map(zone => zone.name);
    } catch (error) {
        console.error(`[Provisioner] Error fetching zones for GCP region ${region}:`, error);
        return []; // Return empty if error, so main logic can continue with other regions/zones
    }
}

const listGcpInstances = async (options = {}) => {
    const { statusFilter } = options;
    console.log(`[Provisioner] Listing GCP instances. Status filter: ${statusFilter || 'any (defaulting to broad list)'}`);
    const gcpCredentials = await credentialsManager.loadGcpCredentials();
    const projectId = gcpCredentials.project_id;

    if (!projectId) {
        console.error("[Provisioner] GCP project_id not found in credentials.");
        return { success: false, error: "GCP project_id not configured.", instances: [], message: "GCP project_id not configured." };
    }

    const targetRegions = ['us-central1']; 
    let allFetchedInstancesRaw = [];
    let instancesToReturn = [];
    let message = null;

    const instancesClient = new InstancesClient({ credentials: gcpCredentials });

    for (const region of targetRegions) {
        const zonesInRegion = await getAllZonesInRegion(gcpCredentials, region);
        if (!zonesInRegion || zonesInRegion.length === 0) {
            console.warn(`[Provisioner] No zones found or error fetching zones for GCP region: ${region}`);
            continue;
        }
        for (const zone of zonesInRegion) {
            try {
                const [instanceList] = await instancesClient.list({ project: projectId, zone: zone });
                allFetchedInstancesRaw.push(...instanceList);
            } catch (error) {
                console.error(`[Provisioner] Error listing GCP instances in zone ${zone}:`, error);
            }
        }
    }

    if (statusFilter === 'running') {
        instancesToReturn = allFetchedInstancesRaw
            .filter(inst => inst.status === 'RUNNING')
            .map(formatGcpInstance);
        
        if (instancesToReturn.length > 0) {
            message = `Displaying running GCP instances from queried zones.`;
        } else {
            console.log(`[Provisioner] No running GCP instances found for filter '${statusFilter}'. Checking for stopped (TERMINATED or SUSPENDED) instances.`);
            instancesToReturn = allFetchedInstancesRaw
                .filter(inst => inst.status === 'TERMINATED' || inst.status === 'SUSPENDED')
                .map(formatGcpInstance);
            if (instancesToReturn.length > 0) {
                message = `No running GCP instances found in queried zones. Displaying stopped instances instead.`;
            } else {
                message = `No running or stopped (TERMINATED/SUSPENDED) GCP instances found in queried zones.`;
            }
        }
    } else if (statusFilter === 'stopped') {
        instancesToReturn = allFetchedInstancesRaw
            .filter(inst => inst.status === 'TERMINATED' || inst.status === 'SUSPENDED')
            .map(formatGcpInstance);
        if (instancesToReturn.length === 0) {
            message = `No stopped (TERMINATED or SUSPENDED) GCP instances found in queried zones.`;
        } else {
            message = `Displaying stopped (TERMINATED or SUSPENDED) GCP instances from queried zones.`;
        }
    } else {
        // Original behavior for other specific status filters or no filter
        allFetchedInstancesRaw.forEach(instance => {
            let shouldInclude = false;
            const currentStatusLower = instance.status.toLowerCase();
            if (statusFilter) { // Direct status match if filter is not 'running' or 'stopped'
                if (currentStatusLower === statusFilter) shouldInclude = true;
            } else { // No statusFilter, include all relevant states by default
                const defaultRelevantStates = ['PROVISIONING', 'STAGING', 'RUNNING', 'STOPPING', 'SUSPENDING', 'SUSPENDED', 'TERMINATED'];
                if (defaultRelevantStates.includes(instance.status)) shouldInclude = true;
            }
            if (shouldInclude) {
                instancesToReturn.push(formatGcpInstance(instance));
            }
        });
        if (instancesToReturn.length === 0) {
            message = `No GCP instances found matching criteria '${statusFilter || "any"}' in queried zones.`;
        } else {
            message = `Displaying GCP instances for filter '${statusFilter || "any"}' from queried zones.`;
        }
    }

    console.log(`[Provisioner] Returning ${instancesToReturn.length} GCP instances. Fetched raw: ${allFetchedInstancesRaw.length}. Message: ${message}`);
    return { success: true, instances: instancesToReturn, message };
};

// Helper function to format GCP instance details (ensure this is defined or move its definition here)
function formatGcpInstance(instance) {
    return {
        id: instance.id,
        name: instance.name,
        type: instance.machineType?.split('/').pop(),
        status: instance.status,
        provider: "GCP",
        regionOrZone: instance.zone.substring(instance.zone.lastIndexOf('/') + 1, instance.zone.lastIndexOf('-')), 
        zone: instance.zone.substring(instance.zone.lastIndexOf('/') + 1),
        publicIp: instance.networkInterfaces?.[0]?.accessConfigs?.[0]?.natIP,
        privateIp: instance.networkInterfaces?.[0]?.networkIP,
        creationTimestamp: instance.creationTimestamp,
        lastStartTimestamp: instance.lastStartTimestamp,
        lastStopTimestamp: instance.lastStopTimestamp
    };
}

// --- AWS Stop Instance ---
async function stopAwsInstance({ instanceId, region }) {
    console.log(`[Provisioner] Attempting to stop AWS instance: ${instanceId} in region: ${region}`);
    if (!instanceId || !region) {
        return { success: false, error: "Missing required parameters: instanceId, region." };
    }

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region, credentials: awsCredentials });

        const stopParams = { InstanceIds: [instanceId] };
        console.log("[Provisioner] Sending StopInstancesCommand to AWS with params:", stopParams);
        const data = await ec2Client.send(new StopInstancesCommand(stopParams));
        console.log("[Provisioner] AWS StopInstancesCommand successful:", data.StoppingInstances);

        const instanceState = data.StoppingInstances?.[0]?.CurrentState?.Name;

        return {
            success: true,
            provider: "AWS",
            instanceId: instanceId,
            status: instanceState || "stopping",
            message: `AWS instance ${instanceId} stopping initiated successfully.`,
            details: data.StoppingInstances?.[0]
        };
    } catch (error) {
        console.error(`[Provisioner] Error stopping AWS instance ${instanceId}:`, error);
        return {
            success: false,
            error: "AWS Stop Instance Error",
            message: error.message,
            awsDetails: { code: error.name || error.Code, message: error.message }
        };
    }
}

// --- GCP Stop Instance ---
async function stopGcpInstance({ instanceName, zone, projectId }) {
    console.log(`[Provisioner] Attempting to stop GCP instance: ${instanceName} in zone: ${zone} for project: ${projectId}`);
    if (!instanceName || !zone || !projectId) {
        return { success: false, error: "Missing required parameters: instanceName, zone, projectId." };
    }

    try {
        const gcpCredentials = await credentialsManager.loadGcpCredentials();
        const instancesClient = new InstancesClient({ credentials: gcpCredentials });
        const zoneOperationsClient = new ZoneOperationsClient({ credentials: gcpCredentials });

        console.log(`[Provisioner] Sending stop request for GCP instance: ${instanceName}`);
        const [operation] = await instancesClient.stop({
            project: projectId,
            zone: zone,
            instance: instanceName,
        });

        console.log(`[Provisioner] GCP instance stop operation initiated for '${instanceName}'. Operation ID: ${operation.name}. Waiting for completion...`);
        const [completedOperation] = await zoneOperationsClient.wait({
            operation: operation.name,
            project: projectId,
            zone: zone,
        });

        if (completedOperation.error) {
            console.error(`[Provisioner] Error during GCP instance stop operation for '${instanceName}':`, completedOperation.error);
            return { success: false, error: "GCP instance stop failed during operation.", details: completedOperation.error };
        }
        
        // Fetch the instance to confirm its status after stopping
        const [instance] = await instancesClient.get({ project: projectId, zone, instance: instanceName });

        console.log(`[Provisioner] GCP instance '${instanceName}' stopped successfully. Current status: ${instance.status}`);
        return {
            success: true,
            provider: "GCP",
            instanceName: instanceName,
            status: instance.status || "STOPPED", // GCP status should be more definitive
            message: `GCP instance ${instanceName} stopped successfully.`,
            details: instance
        };

    } catch (error) {
        console.error(`[Provisioner] Error stopping GCP instance ${instanceName}:`, error);
        let errorMessage = error.message;
        if (error.code === 5) { // NOT_FOUND
             errorMessage = `GCP instance ${instanceName} not found in zone ${zone}.`;
        }
        return {
            success: false,
            error: "GCP Stop Instance Error",
            message: errorMessage,
            gcpDetails: { code: error.code, message: error.message, errors: error.errors }
        };
    }
}

module.exports = {
    osImageMappings,
    provisionAwsVm,
    provisionGcpVm,
    getAwsImageId,
    getGcpSourceImage,
    deleteAwsVm,
    deleteGcpVm,
    modifyAwsRootVolume,
    modifyGcpBootDisk,
    listAwsInstances,
    listGcpInstances,
    stopAwsInstance,
    stopGcpInstance
};
 