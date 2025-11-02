import { Client, DeploymentEnvironmentV2, DeprovisioningRunbookRun, EnvironmentRepository } from "@octopusdeploy/api-client";

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
  client.info(`Deprovisioning started successfully.`);
  
  return deprovisioningResponse.DeprovisioningRuns;
}