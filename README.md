# Deprovision Ephemeral Environment

A GitHub Action to deprovision ephemeral environments for your [Octopus Deploy](https://octopus.com/) server.

Ephemeral environments in Octopus Deploy allow you to automatically create test environments on-demand to gain confidence in your changes while helping to keep your infrastructure costs down. For more information, see [Ephemeral Environments](https://octopus.com/docs/projects/ephemeral-environments).

## Environment Variables

| Name                   | Description                                                                                                                                          |
|------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| `OCTOPUS_URL`          | The base URL hosting Octopus Deploy (i.e. `https://octopus.example.com`). It is strongly recommended that this value retrieved from a GitHub secret. |
| `OCTOPUS_API_KEY`      | The API key used to access Octopus Deploy. It is strongly recommended that this value retrieved from a GitHub secret.                                |
| `OCTOPUS_SPACE`        | The Name of a space within which this command will be executed.                                                                                      |
| `OCTOPUS_ACCESS_TOKEN` | The OIDC access token used to access Octopus Deploy. It is strongly recommended that this value retrieved from a GitHub secret.                      |

## Inputs

| Input Name | Description                                                 | Required | Notes                                                                               |
|------------|-------------------------------------------------------------|----------|-------------------------------------------------------------------------------------|
| `server`   | The url of the Octopus Instance                             | True     | Will use the value set in `OCTOPUS_URL` if not set                                  |
| `api_key`  | The API key to login with                                   | True     | Will use the value set in `OCTOPUS_API_KEY` if not set. May be logged in plain text |
| `name`     | The name of the ephemeral environment to deprovision.       | True     |                                                                                     |
| `project`  | Project name, if deprovisioning for a single project.       | False    | Required when deprovisioning for a single project.                             |
| `all_projects` | Deprovision the environment for all projects.           | False    | If true, the ephemeral environment will be deprovisioned across all projects in the Octopus Deploy instance. If false, the ephemeral environment will only be deprovisioned from the specified project. Defaults to false |
| `space`    | The name of the space containing the ephemeral environment. | True     | Will use the value set in `OCTOPUS_SPACE` if not set                                |

Although they are both optional, at least one of `project` or `all_projects` must be supplied as this sets the scope for the deprovisioning.

## Outputs
| Output Name                   | Description                                                                      |
|-------------------------------|----------------------------------------------------------------------------------|
| `deprovisioning_runbook_runs` | JSON string for an array of objects representing the deprovisioning runbook runs started by this action. Each object contains a `runbookRunId` and `serverTaskId` |

## Examples

### Deprovision ephemeral environment using API key login

```yaml
steps:
  deprovision-ephemeral-environment:
    runs-on: ubuntu-latest
    steps:
      - name: Deprovision Ephemeral Environment
        id: deprovision_ephemeral_environment
        uses: OctopusDeploy/deprovision-ephemeral-environment@v1.0.0
        with:
          server: ${{ secrets.TEST_INSTANCE_URL }}
          api_key: ${{ secrets.TEST_INSTANCE_API_KEY }}
          name: 'ephemeral-environment-12345'
          project: 'My Project'
          space: 'Default'
```

### Deprovision ephemeral environment using Octopus Deploy Login Action

```yaml
steps:
  - uses: actions/checkout@v3

  - name: Login to Octopus Deploy
    id: login_to_octopus_deploy
    uses: OctopusDeploy/login@v1
    with:
      server: ${{ inputs.server || vars.TEST_INSTANCE_URL }}
      service_account_id: ${{ inputs.service_account_id || vars.TEST_INSTANCE_SERVICE_ACCOUNT_ID }}

  - name: Deprovision Ephemeral Environment
    id: deprovision_ephemeral_environment
    uses: OctopusDeploy/deprovision-ephemeral-environment@v1.0.0
    with:
      name: ${{ inputs.name }}
      space: ${{ inputs.space || vars.TEST_SPACE_NAME}}
```

To see the action in use, take a look at a [demo workflow here](https://github.com/OctopusDeploy/ephemeral-environments-demo/blob/main/.github/workflows/deprovision-ephemeral-environment.yml).

## Contributing

Contributions are welcome! :heart: Please read our [Contributing Guide](CONTRIBUTING.md) for information about how to get involved in this project.
