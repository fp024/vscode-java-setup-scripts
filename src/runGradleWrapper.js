#!/usr/bin/env node
import { exec } from "child_process";
import os from "os";

const isWindows = os.platform() === "win32";
const gradleCommand = isWindows ? "gradlew.bat" : "./gradlew";
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
