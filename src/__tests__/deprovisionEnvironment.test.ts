import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ActionContextForTesting } from "../ActionContextForTesting";
import { deprovisionEnvironment } from "../deprovisionEnvironment";

test("Function to deprovision an ephemeral environment outputs deprovisioning runbook runs on success", async () => {
    const context = new ActionContextForTesting();
    const serverUrl = "https://my.octopus.app";
    context.addInput("server", serverUrl);
    context.addInput("api_key", "API-XXXXXXXXXXXXXXXXXXXXXXXX");
    context.addInput("space", "Default");
    context.addInput("name", "My Ephemeral Environment");

    const deprovisioningRuns = [
        { RunbookRunId: "Runbooks-12345", TaskId: "ServerTasks-67890" },
        { RunbookRunId: "Runbooks-54321", TaskId: "ServerTasks-09876" },
    ];
    const expectedOutput = JSON.stringify(deprovisioningRuns.map(run => ({ runbookRunId: run.RunbookRunId, serverTaskId: run.TaskId })));

    const server = setupServer(
        http.post("https://my.octopus.app/api/:spaceId/environments/ephemeral/:environmentId/deprovision", () => {
            return HttpResponse.json({
                DeprovisioningRuns: deprovisioningRuns
            });
        }),
        http.get("https://my.octopus.app/api/:spaceId/environments/v2", () => {
            return HttpResponse.json({
                Items: [{
                    Name: "My Ephemeral Environment",
                    Id: "Environments-1",
                }]
            });
        }),
        http.get("https://my.octopus.app/api", () => {
            return HttpResponse.json([{
            }]);
        }),
        http.get("https://my.octopus.app/api/spaces", () => {
            return HttpResponse.json({
                Items: [{
                    Name: "Default",
                    Id: "Spaces-1",
                }]
            });
        })
    );
    server.listen();

    await deprovisionEnvironment(context);
    expect(context.getOutput('deprovisioning_runbook_runs')).toEqual(expectedOutput);
});