import { InputParameters } from './input-parameters';
import { Client, EnvironmentRepository, DeprovisioningRunbookRun } from '@octopusdeploy/api-client';

export async function deprovisionEphemeralEnvironmentFromInputs(client: Client, parameters: InputParameters): Promise<DeprovisioningRunbookRun[]> {
  client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' in Octopus Deploy...`);

  const environmentRepository = new EnvironmentRepository(client, parameters.space);

  const environment = await environmentRepository.getEnvironmentByName(parameters.name);
  if (!environment) {
    throw new Error(`No environment found with name: '${parameters.name}'.`);
  }

  const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironment(environment.Id);
  if (!deprovisioningResponse.DeprovisioningRuns) {
    throw new Error(`Error deprovisioning environment: '${parameters.name}'.`);
  }
  client.info(`Deprovisioning started successfully.`);

  return deprovisioningResponse.DeprovisioningRuns;
}