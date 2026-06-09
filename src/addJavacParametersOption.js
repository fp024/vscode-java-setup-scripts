import { isDirectRun } from "./util/isDirectRun.js";
import { addOption } from "./util/addJDTOption.js";

export const SETTINGS = {
  DIR: ".settings",
  FILE: "org.eclipse.jdt.core.prefs",
  OPTION: {
    KEY: "org.eclipse.jdt.core.compiler.codegen.methodParameters",
    DISPLAY_NAME: "JDT methodParameters",
    VALUE: "generate",
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
