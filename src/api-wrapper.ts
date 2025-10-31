import { ActionContext } from './ActionContext';
import { InputParameters } from './input-parameters';
import { Client, EnvironmentRepository, DeprovisioningRunbookRun, Project, ProjectRepository } from '@octopusdeploy/api-client';

export async function deprovisionEphemeralEnvironmentFromInputs(client: Client, parameters: InputParameters, context: ActionContext): Promise<DeprovisioningRunbookRun[]> {  
  const environmentRepository = new EnvironmentRepository(client, parameters.space);
  
  const environment = await environmentRepository.getEnvironmentByName(parameters.name);
  if (!environment) {
    client.info(`🚩 Has your environment already been deprovisioned? No environment was found with the name: '${parameters.name}'. Skipping deprovisioning.`);
    return [];
  }

  if (!parameters.deprovisionForAllProjects && !parameters.project) {
    throw new Error("To deprovision for a single project a project name must be provided.");
  }
  if (parameters.deprovisionForAllProjects) {
    client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for all projects in Octopus Deploy...`);
    const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironment(environment.Id);
    if (!deprovisioningResponse.DeprovisioningRuns) {
      throw new Error(`Error deprovisioning environment: '${parameters.name}'.`);
    }
    client.info(`Deprovisioning started successfully.`);
    return deprovisioningResponse.DeprovisioningRuns;
  } else {
    client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' for project '${parameters.project}' in Octopus Deploy...`);
    const project = await GetProjectByName(client, parameters.project!, parameters.space, context);

    const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironmentForProject(environment.Id, project.Id);
    if (!deprovisioningResponse.DeprovisioningRun) {
      throw new Error(`Error deprovisioning environment: '${parameters.name}'.`);
    }
    client.info(`Deprovisioning started successfully.`);
    return [deprovisioningResponse.DeprovisioningRun];
  }  
}

export async function GetProjectByName(client: Client, projectName: string, spaceName: string, context: ActionContext): Promise<Project> {
  const projectRepository = new ProjectRepository(client, spaceName);

  let project: Project | undefined;

  try {
    const response = await projectRepository.list({ partialName: projectName });
    const projects = response.Items;
    project = projects.find(p => p.Name === projectName);

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