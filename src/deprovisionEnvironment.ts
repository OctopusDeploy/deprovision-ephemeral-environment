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

    

    context.writeStepSummary(`🐙 Octopus Deploy is deprovisioning ephemeral environment **${parameters.name}**.`);
}

export async function deprovisionEphemeralEnvironmentFromInputs(client: Client, parameters: InputParameters, context: ActionContext): Promise<DeprovisioningRunbookRun[]> {
    
    if (!parameters.allProjects && !parameters.project) {
        throw new Error("To deprovision for a single project a project name must be provided.");
    }

    const environment = await getEnvironmentByName(parameters.name, parameters.space, client);
    if (!environment) {
        context.info(`🚩 Has your environment already been deprovisioned? No environment was found with the name: '${parameters.name}'. Skipping deprovisioning.`);
        return [];
    }

    if (parameters.allProjects) {
        context.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for all projects in Octopus Deploy...`);
        const deprovisioningRunbookRuns = await deprovisionEphemeralEnvironmentForAllProjects(environment, parameters.space, client);

        if (deprovisioningRunbookRuns.length == 0) {
            context.info(`🎉 Deprovisioning completed with no runbook runs required.`);
        } else {
            context.info([
                `🎉 Deprovisioning runbook runs created:`,
                ...deprovisioningRunbookRuns.map(run => `  runbookRunId: ${run.RunbookRunId}, serverTaskId: ${run.TaskId}`),
                `Check the status of all runbook runs to confirm that deprovisioning has completed successfully.`
            ].join('\n'));
        }
        
        return deprovisioningRunbookRuns;

    } else {
        context.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for project '${parameters.project}' in Octopus Deploy...`);
        const project = await GetProjectByName(client, parameters.project!, parameters.space, context);

        const environmentProjectStatus = await getEphemeralEnvironmentProjectStatus(environment.Id, project.Id, parameters.space, client);
        if (environmentProjectStatus == 'NotConnected') {
            context.info(`🔗 Environment '${parameters.name}' is not connected to project '${parameters.project}'. Skipping deprovisioning.`);
            return [];
        }

        const deprovisioningRunbookRun = await deprovisionEphemeralEnvironmentForProject(environment, project.Id, parameters.space, client);
        if (!deprovisioningRunbookRun) {
            context.info(`🎉 Deprovisioning completed with no runbook runs required.`);
            
            return [];
        } else {
            context.info([
                `🎉 Deprovisioning runbook run created:`,
                `  runbookRunId: ${deprovisioningRunbookRun.RunbookRunId}, serverTaskId: ${deprovisioningRunbookRun.TaskId}`,
                `Check the status of the runbook run to confirm that deprovisioning has completed successfully.`
            ].join('\n'));
            
            return [deprovisioningRunbookRun];
        }
    }
}