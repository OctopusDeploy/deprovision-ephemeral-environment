import { InputParameters } from './input-parameters';
import { Client, EnvironmentRepository, DeprovisioningRunbookRun } from '@octopusdeploy/api-client';

export async function deprovisionEphemeralEnvironmentFromInputs(client: Client, parameters: InputParameters): Promise<DeprovisioningRunbookRun[]> {
  client.info(`🐙 Deprovisioning ephemeral environment '${parameters.name}' in Octopus Deploy...`);

  const environmentRepository = new EnvironmentRepository(client, parameters.space);

  const environment = await environmentRepository.getEnvironmentByName(parameters.name);
  if (!environment) {
    client.info(`🚩 Has your environment already been deprovisioned? No environment was found with the name: '${parameters.name}'. Skipping deprovisioning.`);
    return [];
  }

  const deprovisioningResponse = await environmentRepository.deprovisionEphemeralEnvironment(environment.Id);
  if (!deprovisioningResponse.DeprovisioningRuns) {
    throw new Error(`Error deprovisioning environment: '${parameters.name}'.`);
  }
  client.info(`Deprovisioning started successfully.`);

  return deprovisioningResponse.DeprovisioningRuns;
}