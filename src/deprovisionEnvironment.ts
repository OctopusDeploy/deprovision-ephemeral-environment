import { getInputParameters } from './input-parameters';
import { Client, ClientConfiguration } from '@octopusdeploy/api-client';
import { deprovisionEphemeralEnvironmentFromInputs } from './api-wrapper';
import { ActionContext } from './ActionContext';

export async function deprovisionEnvironment(context: ActionContext): Promise<void> {
    const parameters = getInputParameters(context);

    const config: ClientConfiguration = {
        userAgentApp: 'GitHubActions deprovision-ephemeral-environment',
        instanceURL: parameters.server,
        apiKey: parameters.apiKey,
        accessToken: parameters.accessToken,
        logging: context
    }
    const client = await Client.create(config);

    const deprovisioningRuns = await deprovisionEphemeralEnvironmentFromInputs(client, parameters);

    context.setOutput(
        'deprovisioning_runbook_runs',
        JSON.stringify(deprovisioningRuns.map(run => {
            return {
                runbookRunId: run.RunbookRunId,
                serverTaskId: run.TaskId,
            }
        }))
    );

    if (deprovisioningRuns.length > 0) {
        client.info(`Rubook runs:`);
        deprovisioningRuns.forEach(run => {
            client.info(`  runbookRunId: ${run.RunbookRunId}, serverTaskId: ${run.TaskId}`);
        });
        client.info(`Check the status of all deprovisioning runbook runs to confirm that deprovisioning has completed successfully.`);
    } else {
        client.info('No deprovisioning runbook runs were started. Deprovisioning completed successfully.');
    }

    context.writeStepSummary(`🐙 Octopus Deploy is deprovisioning ephemeral environment **${parameters.name}**.`);
}