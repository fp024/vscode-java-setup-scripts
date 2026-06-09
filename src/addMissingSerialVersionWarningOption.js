import { isDirectRun } from "./util/isDirectRun.js";
import { addOption } from "./util/addJDTOption.js";

/** @type {import("./util/addJDTOption.js").JDTOptionSettings} */
export const SETTINGS = {
  DIR: ".settings",
  FILE: "org.eclipse.jdt.core.prefs",
  OPTION: {
    KEY: "org.eclipse.jdt.core.compiler.problem.missingSerialVersion",
    DISPLAY_NAME: "JDT missingSerialVersion",
    VALUE: "warning",
  },
};

if (isDirectRun(import.meta.url)) {
  try {
    await addOption(SETTINGS);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}
