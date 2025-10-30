import { setFailed } from "@actions/core";
import { ActionContextImplementation } from "./ActionContextImplementation";
import { deprovisionEnvironment } from "./deprovisionEnvironment";

deprovisionEnvironment(new ActionContextImplementation()).catch((error) => {
    setFailed(error);
    process.exit(1);
});