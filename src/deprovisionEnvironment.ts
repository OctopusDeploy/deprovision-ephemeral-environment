import { getInputParameters, InputParameters } from './input-parameters';
import { Client, ClientConfiguration, DeprovisioningRunbookRun } from '@octopusdeploy/api-client';
import { ActionContext } from './ActionContext';
import { deprovisionEphemeralEnvironmentForAllProjects, deprovisionEphemeralEnvironmentForProject, getEnvironmentByName, getEphemeralEnvironmentProjectStatus, GetProjectByName } from './api-wrapper';

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

    const deprovisioningRuns = await deprovisionEphemeralEnvironmentFromInputs(client, parameters, context);

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
        client.info([
            `🎉 Deprovisioning runbook runs:`,
            ...deprovisioningRuns.map(run => `  runbookRunId: ${run.RunbookRunId}, serverTaskId: ${run.TaskId}`),
            `Check the status of all runbook runs to confirm that deprovisioning has completed successfully.`
        ].join('\n'));
    }

    context.writeStepSummary(`🐙 Octopus Deploy is deprovisioning ephemeral environment **${parameters.name}**.`);
}

export async function deprovisionEphemeralEnvironmentFromInputs(client: Client, parameters: InputParameters, context: ActionContext): Promise<DeprovisioningRunbookRun[]> {

    const environment = await getEnvironmentByName(parameters.name, parameters.space, client);
    if (!environment) {
        client.info(`🚩 Has your environment already been deprovisioned? No environment was found with the name: '${parameters.name}'. Skipping deprovisioning.`);
        return [];
    }

    if (!parameters.allProjects && !parameters.project) {
        throw new Error("To deprovision for a single project a project name must be provided.");
    }

    if (parameters.allProjects) {
        client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for all projects in Octopus Deploy...`);
        const deprovisioningRunbookRuns = await deprovisionEphemeralEnvironmentForAllProjects(environment, parameters.space, client);
        return deprovisioningRunbookRuns;
        
    } else {
        client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for project '${parameters.project}' in Octopus Deploy...`);
        const project = await GetProjectByName(client, parameters.project!, parameters.space, context);

        const environmentProjectStatus = await getEphemeralEnvironmentProjectStatus(environment.Id, project.Id, parameters.space, client);
        if (environmentProjectStatus == 'NotConnected') {
            context.info(`🔗 Environment '${parameters.name}' is not connected to project '${parameters.project}'. Skipping deprovisioning.`);
            return [];
        }

        const deprovisioningRunbookRun = await deprovisionEphemeralEnvironmentForProject(environment, project.Id, parameters.space, client);
        client.info(`Deprovisioning started successfully.`);
        if (!deprovisioningRunbookRun) {
            return [];
        } else {
            return [deprovisioningRunbookRun];
        }
    }
}