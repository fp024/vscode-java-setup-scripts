import { exec } from 'child_process';
import os from 'os';
import { isDirectRun } from './util/isDirectRun.js';

function getMavenCommand() {
  return os.platform() === 'win32' ? 'mvnw.cmd' : './mvnw';
}

export { getMavenCommand };

if (isDirectRun(import.meta.url)) {
  const mavenCommand = getMavenCommand();
  const args = process.argv.slice(2).join(' ');
  exec(`${mavenCommand} ${args}`, (error, stdout, stderr) => {
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
