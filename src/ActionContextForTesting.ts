import type { ActionContext, InputOptions } from "./ActionContext";

export class ActionContextForTesting implements ActionContext {
    inputs: Record<string, string> = {};
    outputs: Record<string, unknown> = {};
    failureMessage: string | undefined;
    stepSummary: string = "";

    addInput(name: string, value: string): void {
        this.inputs[name] = value;
    }

    getInput(name: string, options?: InputOptions): string {
        const inputValue = this.inputs[name];
        if (inputValue === undefined && options?.required === true) throw new Error(`Input required and not supplied: ${name}`);
        return inputValue || "";
    }

    setOutput(name: string, value: unknown): void {
        this.outputs[name] = value;
    }

    getOutput(name: string): unknown {
        return this.outputs[name];
    }

    setFailed(message: string): void {
        this.failureMessage = message;
    }

    writeStepSummary(summary: string): void {
        this.stepSummary = summary;
    }

    getStepSummary(): string | undefined {
        return this.stepSummary || undefined;
    }

    error(message: string): void {
        console.error(message);
    }

    debug(message: string): void {
        console.debug(message);
    }

    info(message: string): void {
        console.debug(message);
    }

    warning(message: string): void {
        console.debug(message);
    }
}
