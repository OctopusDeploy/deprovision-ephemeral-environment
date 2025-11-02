import { Client, DeploymentEnvironmentV2, DeprovisioningRunbookRun, EnvironmentRepository, Project, ProjectRepository } from "@octopusdeploy/api-client";
import { ActionContext } from "./ActionContext";

export async function getEnvironmentByName(environmentName: string, spaceName: string, client: Client): Promise<DeploymentEnvironmentV2 | null> {
  const environmentRepository = new EnvironmentRepository(client, spaceName);
  return await environmentRepository.getEnvironmentByName(environmentName);
}

export async function deprovisionEphemeralEnvironmentForAllProjects(environment: DeploymentEnvironmentV2, spaceName: string, client: Client): Promise<DeprovisioningRunbookRun[]> {
  const environmentRepository = new EnvironmentRepository(client, spaceName);
  const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironment(environment.Id);
  
  if (!deprovisioningResponse.DeprovisioningRuns) {
    throw new Error(`Error deprovisioning environment: '${environment.Name}'.`);
  }
  
  // Returns an empty array in the case where no projects have a deprovisioning runbook
  return deprovisioningResponse.DeprovisioningRuns;
}

export async function deprovisionEphemeralEnvironmentForProject(environment: DeploymentEnvironmentV2, projectId: string, spaceName: string, client: Client): Promise<DeprovisioningRunbookRun | undefined> {
  const environmentRepository = new EnvironmentRepository(client, spaceName);
  const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironmentForProject(environment.Id, projectId);
  if (!deprovisioningResponse) {
    throw new Error(`Error deprovisioning environment: '${environment.Name}'.`);
  }

  // Returns undefined in the case where the project does not have a deprovisioning runbook
  return deprovisioningResponse.DeprovisioningRun || undefined;
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

export async function getEphemeralEnvironmentProjectStatus(environmentId: string, projectId: string, spaceName: string, client: Client): Promise<string> {
  const environmentRepository = new EnvironmentRepository(client, spaceName);
  const statusResponse = await environmentRepository.getEphemeralEnvironmentProjectStatus(environmentId, projectId);
  return statusResponse.Status;
}