import { getBooleanInput, getInput, setFailed, error, debug, info, warning, setOutput } from "@actions/core";
import type { ActionContext, InputOptions } from "./ActionContext";
import { writeFileSync } from "fs";

export class ActionContextImplementation implements ActionContext {
    getInput(name: string, options?: InputOptions): string {
        return getInput(name, options);
    }

    getBooleanInput(name: string, options?: InputOptions): boolean {
        return getBooleanInput(name, options);
    }

    setOutput(name: string, value: string): void {
        setOutput(name, value);
    }

    setFailed(message: string): void {
        setFailed(message);
    }

    writeStepSummary(summary: string): void {
        const stepSummaryFile = process.env.GITHUB_STEP_SUMMARY;
        if (stepSummaryFile) {
            writeFileSync(
                stepSummaryFile,
                summary
            );
        }
    }

    error(message: string): void {
        error(message);
    }

    debug(message: string): void {
        debug(message);
    }

    info(message: string): void {
        info(message);
    }

    warning(message: string): void {
        warning(message);
    }
}