import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ActionContextForTesting } from "../ActionContextForTesting";
import { deprovisionEnvironment } from "../deprovisionEnvironment";

describe("deprovisionEnvironment", () => {

    test("Function to deprovision across all projects outputs deprovisioning runbook runs on success", async () => {
        const context = new ActionContextForTesting();
        context.addInput("server", "https://my.octopus.app");
        context.addInput("api_key", "API-XXXXXXXXXXXXXXXXXXXXXXXX");
        context.addInput("space", "Default");
        context.addInput("name", "My Ephemeral Environment");
        context.addBooleanInput("all_projects", true); // Set to deprovision for all projects

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
            }),
        );
        server.listen();

        await deprovisionEnvironment(context);
        expect(context.getOutput('deprovisioning_runbook_runs')).toEqual(expectedOutput);

        server.close();
    });

    test("Function to deprovision for a single project outputs deprovisioning runbook run on success", async () => {
        const context = new ActionContextForTesting();
        context.addInput("server", "https://my.octopus.app");
        context.addInput("api_key", "API-XXXXXXXXXXXXXXXXXXXXXXXX");
        context.addInput("space", "Default");
        context.addInput("project", "My Project"); // Set to deprovision for a single project
        context.addInput("name", "My Ephemeral Environment");

        const deprovisioningRun = { RunbookRunId: "Runbooks-12345", TaskId: "ServerTasks-67890" };
        const expectedOutput = JSON.stringify([{ runbookRunId: deprovisioningRun.RunbookRunId, serverTaskId: deprovisioningRun.TaskId }]);

        const server = setupServer(
            http.post("https://my.octopus.app/api/:spaceId/projects/:projectId/environments/ephemeral/:environmentId/deprovision", () => {
                return HttpResponse.json({
                    DeprovisioningRun: deprovisioningRun
                });
            }),
            http.get("https://my.octopus.app/api/:spaceId/projects/:projectId/environments/ephemeral/:environmentId/status", () => {
                return HttpResponse.json({
                    Status: "Connected"
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
            }),
            http.get("https://my.octopus.app/api/:spaceId/projects", () => {
                return HttpResponse.json({
                    Items: [{
                        Name: "My Project",
                        Id: "Projects-123",
                    }]
                });
            }),
        );
        server.listen();

        await deprovisionEnvironment(context);
        expect(context.getOutput('deprovisioning_runbook_runs')).toEqual(expectedOutput);

        server.close();
    });

    test("When deprovision_all_projects is true and project is provided, function to deprovision should error", async () => {
        const context = new ActionContextForTesting();
        context.addInput("server", "https://my.octopus.app");
        context.addInput("api_key", "API-XXXXXXXXXXXXXXXXXXXXXXXX");
        context.addInput("space", "Default");
        context.addInput("name", "My Ephemeral Environment");
        context.addBooleanInput("all_projects", true); // Set to deprovision for all projects
        context.addInput("project", "My Project"); // Set to deprovision for a single project

        await expect(deprovisionEnvironment(context)).rejects.toThrow(/project name is provided/);
    });

    test("When deprovision_all_projects is not true and project is not provided, function to deprovision should error", async () => {
        const context = new ActionContextForTesting();
        context.addInput("server", "https://my.octopus.app");
        context.addInput("api_key", "API-XXXXXXXXXXXXXXXXXXXXXXXX");
        context.addInput("space", "Default");
        context.addInput("name", "My Ephemeral Environment");
        // Not set to deprovision for all projects
        // Not set to deprovision for a single project

        await expect(deprovisionEnvironment(context)).rejects.toThrow(/project name is required/);
    });
});