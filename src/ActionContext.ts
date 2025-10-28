export type InputOptions = {
    required?: boolean;
};

export interface ActionContext {
    getInput: (name: string, options?: InputOptions) => string;
    setOutput: (name: string, value: string) => void;
    setFailed: (message: string) => void;
    writeStepSummary: (summary: string) => void;

    error: (message: string) => void;
    debug: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}