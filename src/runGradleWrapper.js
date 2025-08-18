import { exec } from "child_process";
import os from "os";
import { isDirectRun } from "./util/isDirectRun.js";

function getGradleCommand() {
  return os.platform() === "win32" ? "gradlew.bat" : "./gradlew";
}

export { getGradleCommand };

if (isDirectRun(import.meta.url)) {
  const gradleCommand = getGradleCommand();
  const args = process.argv.slice(2).join(" ");
  exec(`${gradleCommand} ${args}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
}
