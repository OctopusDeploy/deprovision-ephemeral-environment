import { getInputParameters, InputParameters } from './input-parameters';
import { Client, ClientConfiguration, DeprovisioningRunbookRun, EnvironmentRepository, Project, ProjectRepository } from '@octopusdeploy/api-client';
// import { deprovisionEphemeralEnvironmentFromInputs } from './api-wrapper';
import { ActionContext } from './ActionContext';
import { deprovisionEphemeralEnvironmentForAllProjects, getEnvironmentByName } from './api-wrapper';

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
  const environmentRepository = new EnvironmentRepository(client, parameters.space); // remove this once it's all in the wrapper

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

    const environmentProjectStatusResponse = await environmentRepository.getEphemeralEnvironmentProjectStatus(environment.Id, project.Id);
    if (environmentProjectStatusResponse.Status == 'NotConnected') {
      context.info(`🔗 Environment '${parameters.name}' is not connected to project '${parameters.project}'. Skipping deprovisioning.`);
      return [];
    }

    const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironmentForProject(environment.Id, project.Id);
    if (!deprovisioningResponse) {
      throw new Error(`Error deprovisioning environment: '${parameters.name}'.`);
    }
    client.info(`Deprovisioning started successfully.`);
    return deprovisioningResponse.DeprovisioningRun ? [deprovisioningResponse.DeprovisioningRun] : [];
  }  
}

export async function GetProjectByName(client: Client, projectName: string, spaceName: string, context: ActionContext): Promise<Project> {
  const projectRepository = new ProjectRepository(client, spaceName);

  let project: Project | undefined;

  try {
    const response = await projectRepository.list({ partialName: projectName });
    const projects = response.Items;
    project = projects.find(p => p.Name.toLowerCase() === projectName.toLowerCase());

  } catch (error) {
    context.error?.(`Error getting project by name: ${error}`);
  }

  if (project) {
    return project;
  } else {
    context.error?.(`Project, "${projectName}" not found`);
    throw new Error(`Project, "${projectName}" not found`);
  }
}