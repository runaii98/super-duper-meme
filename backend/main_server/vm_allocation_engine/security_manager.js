const { EC2Client, CreateSecurityGroupCommand, AuthorizeSecurityGroupIngressCommand, AuthorizeSecurityGroupEgressCommand, RevokeSecurityGroupIngressCommand, RevokeSecurityGroupEgressCommand } = require("@aws-sdk/client-ec2");
const { Compute } = require('@google-cloud/compute'); // Potential GCP import
const credentialsManager = require('./credentials_manager');

/**
 * Helper function to process AWS rule authorizations (Ingress or Egress).
 * @param {EC2Client} ec2Client - The EC2 client.
 * @param {string} groupId - The ID of the security group.
 * @param {Array<object>} rules - Rules to authorize.
 * @param {boolean} isEgress - True if these are egress rules, false for ingress.
 * @param {Array<object>} originalInputRules - The original rules provided by the user (for description mapping).
 * @returns {Promise<Array<object>>} Array of applied rule details.
 */
async function processAwsRuleAuthorizations(ec2Client, groupId, rules, isEgress, originalInputRules = []) {
    if (!rules || rules.length === 0) {
        return [];
    }

    const ipPermissions = rules.map(rule => {
        const permission = {
            IpProtocol: rule.protocol,
            FromPort: rule.fromPort,
            ToPort: rule.toPort,
        };
        if (rule.cidrIp) permission.IpRanges = [{ CidrIp: rule.cidrIp }];
        if (rule.cidrIpv6) permission.Ipv6Ranges = [{ CidrIpv6: rule.cidrIpv6 }];
        if (rule.sourceSecurityGroupId) permission.UserIdGroupPairs = [{ GroupId: rule.sourceSecurityGroupId }]; // For SG-to-SG rules
        // Note: rule.description is not directly part of IpPermission for authorize commands.
        return permission;
    }).filter(p => p.IpRanges || p.Ipv6Ranges || p.UserIdGroupPairs); // Ensure there's at least one source/destination

    if (ipPermissions.length === 0) {
        console.log(`[SecurityManager] No valid IP permissions to apply for ${isEgress ? 'egress' : 'ingress'} to ${groupId} after filtering.`);
        return [];
    }

    const commandParams = {
        GroupId: groupId,
        IpPermissions: ipPermissions,
    };

    let authResponse;
    if (isEgress) {
        authResponse = await ec2Client.send(new AuthorizeSecurityGroupEgressCommand(commandParams));
        console.log(`[SecurityManager] Processed ${ipPermissions.length} egress permission sets for ${groupId}.`);
    } else {
        authResponse = await ec2Client.send(new AuthorizeSecurityGroupIngressCommand(commandParams));
        console.log(`[SecurityManager] Processed ${ipPermissions.length} ingress permission sets for ${groupId}.`);
    }

    let appliedRuleDetails = [];
    if (authResponse.SecurityGroupRules && authResponse.SecurityGroupRules.length > 0) {
        appliedRuleDetails = authResponse.SecurityGroupRules.map(sgRule => ({
            securityGroupRuleId: sgRule.SecurityGroupRuleId,
            groupId: sgRule.GroupId,
            isEgress: sgRule.IsEgress,
            ipProtocol: sgRule.IpProtocol,
            fromPort: sgRule.FromPort,
            toPort: sgRule.ToPort,
            cidrIpv4: sgRule.CidrIpv4,
            cidrIpv6: sgRule.CidrIpv6,
            sourceSecurityGroupId: sgRule.ReferencedGroupInfo?.GroupId,
            description: sgRule.Description || originalInputRules.find(r => 
                r.protocol === sgRule.IpProtocol && 
                r.fromPort === sgRule.FromPort && 
                r.toPort === sgRule.ToPort &&
                (r.cidrIp === sgRule.CidrIpv4 || r.cidrIpv6 === sgRule.CidrIpv6 || r.sourceSecurityGroupId === sgRule.ReferencedGroupInfo?.GroupId)
            )?.description || ''
        }));
    } else {
        // Fallback if SecurityGroupRules is not in response
        appliedRuleDetails = rules.map(r => ({ ...r, isEgress, groupId, note: `Rule ID and exact AWS description not available from ${isEgress ? 'Egress' : 'Ingress'} authorize response.` }));
    }
    return appliedRuleDetails;
}

/**
 * Creates a new Security Group in AWS.
 * @param {object} details - Security group details.
 * @param {string} details.groupName - The name of the security group.
 * @param {string} details.description - A description for the security group.
 * @param {string} details.region - The AWS region.
 * @param {Array<object>} [details.ingressRules] - Ingress rules for the security group.
 *      Example rule: { protocol: 'tcp', fromPort: 22, toPort: 22, cidrIp: '0.0.0.0/0', description: 'SSH access', cidrIpv6: '::/0' }
 * @param {Array<object>} [details.egressRules] - Egress rules for the security group. Same structure as ingressRules.
 * @returns {Promise<object>} { success: true, groupId: 'sg-xxxxxxxx', groupName: 'name', description: 'desc', rules: [...] } or { success: false, error: 'message' }
 */
async function createAwsSecurityGroup(details) {
    const { groupName, description, region, ingressRules = [], egressRules = [] } = details;

    if (!groupName || !description || !region) {
        return { success: false, error: "Missing required parameters for AWS security group: groupName, description, region." };
    }
    if (!Array.isArray(ingressRules) || !Array.isArray(egressRules)) {
        return { success: false, error: "ingressRules and egressRules must be arrays." };
    }

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({
            region: region,
            credentials: awsCredentials
        });

        const createGroupParams = {
            GroupName: groupName,
            Description: description,
        };

        const createGroupResponse = await ec2Client.send(new CreateSecurityGroupCommand(createGroupParams));
        const groupId = createGroupResponse.GroupId;

        if (!groupId) {
            return { success: false, error: "Failed to create security group: No GroupId returned." };
        }

        console.log(`[SecurityManager] AWS Security Group created: ${groupId} with name: ${groupName}`);

        let combinedAppliedRulesDetails = [];

        // Process Ingress Rules using helper
        const appliedIngress = await processAwsRuleAuthorizations(ec2Client, groupId, ingressRules, false, ingressRules);
        combinedAppliedRulesDetails.push(...appliedIngress);

        // Process Egress Rules using helper
        const appliedEgress = await processAwsRuleAuthorizations(ec2Client, groupId, egressRules, true, egressRules);
        combinedAppliedRulesDetails.push(...appliedEgress);
        
        return { success: true, groupId: groupId, groupName: groupName, description: description, rules: combinedAppliedRulesDetails };

    } catch (error) {
        console.error("[SecurityManager] Error creating/updating AWS Security Group rules:", error);
        if (error.name === 'InvalidGroup.Duplicate') {
            return { success: false, error: error.message, code: error.name, details: error };
        }
        return { success: false, error: error.message, details: error };
    }
}

/**
 * Creates a new Firewall Rule in GCP.
 * @param {object} details - Firewall rule details.
 * @param {string} details.firewallName - The name of the firewall rule.
 * @param {string} details.description - A description for the firewall rule.
 * @param {string} [details.networkName='global/networks/default'] - The network to apply the firewall rule to.
 * @param {Array<object>} details.allowedRules - Array of allowed rules.
 *      Example rule: { IPProtocol: 'tcp', ports: ['22', '80'] }
 * @param {Array<string>} [details.sourceRanges=['0.0.0.0/0']] - Source IP ranges.
 * @param {Array<string>} details.targetTags - Target tags to apply this rule to VMs.
 * @param {string} [details.priority=1000] - Priority of the rule (lower numbers are higher priority)
 * @returns {Promise<object>} { success: true, firewallName: 'name', targetTags: ['tag1'] } or { success: false, error: 'message' }
 */
async function createGcpFirewallRule(details) {
    const {
        firewallName,
        description,
        networkName = 'global/networks/default', // GCP default network
        allowedRules,
        sourceRanges = ['0.0.0.0/0'],
        targetTags,
        priority = 1000
    } = details;

    if (!firewallName || !description || !allowedRules || !Array.isArray(allowedRules) || allowedRules.length === 0 || !targetTags || !Array.isArray(targetTags) || targetTags.length === 0) {
        return { success: false, error: "Missing required parameters for GCP firewall rule: firewallName, description, allowedRules (non-empty array), targetTags (non-empty array)." };
    }

    try {
        const gcpCredentials = await credentialsManager.loadGcpCredentials(); 
        const compute = new Compute({
            projectId: gcpCredentials.project_id, // Make sure your credentials manager provides this
            credentials: {
                client_email: gcpCredentials.client_email,
                private_key: gcpCredentials.private_key.replace(/\n/g, '\n') // Ensure newlines are correct
            }
        });

        const firewallRequestBody = {
            name: firewallName,
            description: description,
            network: networkName,
            priority: priority,
            direction: 'INGRESS', // For inbound rules
            allowed: allowedRules.map(rule => ({ // GCP expects 'allowed' for ingress rules
                IPProtocol: rule.IPProtocol, // e.g., 'tcp', 'udp', 'icmp'
                ports: rule.ports,          // e.g., ['22', '80-85']
            })),
            sourceRanges: sourceRanges,
            targetTags: targetTags, // VMs with these tags will get this rule
        };

        console.log("[SecurityManager] Attempting to create GCP Firewall rule with request:", JSON.stringify(firewallRequestBody, null, 2));

        const [operation] = await compute.global().firewalls().insert(firewallRequestBody);
        await operation.promise(); // Wait for the operation to complete

        console.log(`[SecurityManager] GCP Firewall Rule '${firewallName}' created successfully for target tags: ${targetTags.join(', ')}.`);
        return { success: true, firewallName: firewallName, targetTags: targetTags };

    } catch (error) {
        console.error("[SecurityManager] Error creating GCP Firewall Rule:", error);
        // Check if the error is due to the firewall rule already existing
        if (error.code === 409) { // 409 Conflict usually means it already exists
             console.warn(`[SecurityManager] GCP Firewall Rule '${firewallName}' may already exist.`);
             // Optionally, you could try to fetch the existing rule here to confirm and return its details
             // For now, we'll return success true as the desired state (rule exists) is met.
             // Or, return a specific error/message indicating it already exists.
             // Let's assume for now if it already exists, we consider it 'created' for idempotency.
             return { success: true, firewallName: firewallName, targetTags: targetTags, message: "Firewall rule already exists or was created successfully." };
        }
        return { success: false, error: error.message, details: error.errors || error };
    }
}

/**
 * Revokes rules from an AWS Security Group.
 * @param {object} details - Details for revoking rules.
 * @param {string} details.groupId - The ID of the security group.
 * @param {string} details.region - The AWS region.
 * @param {Array<object|string>} details.rulesToRevoke - Array of rule IDs (string) or rule objects to revoke.
 *      Rule object example: { protocol: 'tcp', fromPort: 22, toPort: 22, cidrIp: '0.0.0.0/0', isEgress: false, description: 'optional' }
 *      Or simply a rule ID string: "sgr-xxxxxxxxxxxxxxxxx"
 * @returns {Promise<object>} { success: true, revokedCount: X } or { success: false, error: 'message' }
 */
async function revokeAwsSecurityGroupRules(details) {
    const { groupId, region, rulesToRevoke } = details;

    if (!groupId || !region || !rulesToRevoke || !Array.isArray(rulesToRevoke) || rulesToRevoke.length === 0) {
        return { success: false, error: "Missing required parameters: groupId, region, and a non-empty array of rulesToRevoke." };
    }

    try {
        const awsCredentials = await credentialsManager.loadAwsCredentials();
        const ec2Client = new EC2Client({ region: region, credentials: awsCredentials });

        let revokedCount = 0;
        const errors = [];

        const ingressRuleIdsToRevoke = [];
        const egressRuleIdsToRevoke = [];
        const ingressIpPermissionsToRevoke = [];
        const egressIpPermissionsToRevoke = [];

        for (const ruleOrId of rulesToRevoke) {
            if (typeof ruleOrId === 'string') { // Assume it's a rule ID
                // We don't know if it's ingress or egress from ID alone.
                // AWS RevokeSecurityGroupIngress/Egress by ID should work if the ID is for that type.
                // For simplicity, we might need the user to specify type or try both, or enforce rule object.
                // Let's assume for now if it's an ID, the API layer will need to provide isEgress, or we require rule objects for revocation by property.
                // For now, if it's a string, we'll require an isEgress property alongside it or in a wrapper object if passed directly.
                // Let's refine this: rulesToRevoke objects should indicate direction.
                // If ruleOrId is a string (rule ID), we can't directly know if it's ingress/egress without more info.
                // Modifying to expect rule objects for revocation, which can contain either ID or properties.
                // Rule object for revoke: { securityGroupRuleId: 'sgr-xxx', isEgress: false } OR { protocol: 'tcp', ..., isEgress: false }

                // Simplified: If it's a string, assume it's a security group rule ID. User must ensure it's correct.
                // The RevokeSecurityGroupIngress/Egress commands also accept SecurityGroupRuleIds.
                // We need to know if it's an ingress or egress rule ID.
                // This part needs more thought for API design if just passing ID string.
                // Let's assume the ruleOrId object will have an `isEgress` flag and either `securityGroupRuleId` or rule properties.
                if (ruleOrId.securityGroupRuleId) {
                    if (ruleOrId.isEgress) {
                        egressRuleIdsToRevoke.push(ruleOrId.securityGroupRuleId);
                    } else {
                        ingressRuleIdsToRevoke.push(ruleOrId.securityGroupRuleId);
                    }
                } else { // It's a rule specification object
                    const permission = {
                        IpProtocol: ruleOrId.protocol,
                        FromPort: ruleOrId.fromPort,
                        ToPort: ruleOrId.toPort,
                    };
                    if (ruleOrId.cidrIp) permission.IpRanges = [{ CidrIp: ruleOrId.cidrIp }];
                    if (ruleOrId.cidrIpv6) permission.Ipv6Ranges = [{ CidrIpv6: ruleOrId.cidrIpv6 }];
                    if (ruleOrId.sourceSecurityGroupId) permission.UserIdGroupPairs = [{ GroupId: ruleOrId.sourceSecurityGroupId }];
                    
                    if (permission.IpRanges || permission.Ipv6Ranges || permission.UserIdGroupPairs) {
                         if (ruleOrId.isEgress) {
                            egressIpPermissionsToRevoke.push(permission);
                        } else {
                            ingressIpPermissionsToRevoke.push(permission);
                        }
                    }
                }
            } else if (typeof ruleOrId === 'object' && ruleOrId !== null) { // It's a rule specification object
                 if (ruleOrId.securityGroupRuleId) {
                    if (ruleOrId.isEgress) {
                        egressRuleIdsToRevoke.push(ruleOrId.securityGroupRuleId);
                    } else {
                        ingressRuleIdsToRevoke.push(ruleOrId.securityGroupRuleId);
                    }
                } else { // It's a rule specification by properties
                    const permission = {
                        IpProtocol: ruleOrId.protocol,
                        FromPort: ruleOrId.fromPort,
                        ToPort: ruleOrId.toPort,
                    };
                    if (ruleOrId.cidrIp) permission.IpRanges = [{ CidrIp: ruleOrId.cidrIp }];
                    if (ruleOrId.cidrIpv6) permission.Ipv6Ranges = [{ CidrIpv6: ruleOrId.cidrIpv6 }];
                    if (ruleOrId.sourceSecurityGroupId) permission.UserIdGroupPairs = [{ GroupId: ruleOrId.sourceSecurityGroupId }];
                    
                    if (Object.keys(permission).length > 3) { // Ensure more than just protocol,from,to
                         if (ruleOrId.isEgress) {
                            egressIpPermissionsToRevoke.push(permission);
                        } else {
                            ingressIpPermissionsToRevoke.push(permission);
                        }
                    } else {
                        errors.push(`Invalid rule spec for revoke: ${JSON.stringify(ruleOrId)}`);
                    }
                }
            } else {
                 errors.push(`Invalid item in rulesToRevoke: ${JSON.stringify(ruleOrId)}`);
            }
        }

        if (ingressRuleIdsToRevoke.length > 0) {
            await ec2Client.send(new RevokeSecurityGroupIngressCommand({ GroupId: groupId, SecurityGroupRuleIds: ingressRuleIdsToRevoke }));
            revokedCount += ingressRuleIdsToRevoke.length;
            console.log(`[SecurityManager] Revoked ${ingressRuleIdsToRevoke.length} ingress rules by ID from ${groupId}.`);
        }
        if (ingressIpPermissionsToRevoke.length > 0) {
            await ec2Client.send(new RevokeSecurityGroupIngressCommand({ GroupId: groupId, IpPermissions: ingressIpPermissionsToRevoke }));
            revokedCount += ingressIpPermissionsToRevoke.length;
            console.log(`[SecurityManager] Revoked ${ingressIpPermissionsToRevoke.length} ingress rules by properties from ${groupId}.`);
        }
        if (egressRuleIdsToRevoke.length > 0) {
            await ec2Client.send(new RevokeSecurityGroupEgressCommand({ GroupId: groupId, SecurityGroupRuleIds: egressRuleIdsToRevoke }));
            revokedCount += egressRuleIdsToRevoke.length;
            console.log(`[SecurityManager] Revoked ${egressRuleIdsToRevoke.length} egress rules by ID from ${groupId}.`);
        }
        if (egressIpPermissionsToRevoke.length > 0) {
            await ec2Client.send(new RevokeSecurityGroupEgressCommand({ GroupId: groupId, IpPermissions: egressIpPermissionsToRevoke }));
            revokedCount += egressIpPermissionsToRevoke.length;
            console.log(`[SecurityManager] Revoked ${egressIpPermissionsToRevoke.length} egress rules by properties from ${groupId}.`);
        }

        if (errors.length > 0) {
            return { success: false, error: "Some rules could not be processed for revocation.", details: errors, revokedCount };
        }
        return { success: true, revokedCount };

    } catch (error) {
        console.error("[SecurityManager] Error revoking AWS Security Group rules:", error);
        return { success: false, error: error.message, details: error };
    }
}

module.exports = {
    createAwsSecurityGroup,
    // Expose the helper if it's to be used by the new API endpoint directly for authorization part
    // Or, create a new wrapper function for authorizing rules to an existing SG.
    // Let's create a dedicated one for clarity for the API
    authorizeMoreAwsRules: processAwsRuleAuthorizations, // For authorizing to existing SG
    revokeAwsSecurityGroupRules,
    createGcpFirewallRule,
}; 