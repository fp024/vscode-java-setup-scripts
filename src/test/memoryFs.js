import { memfs } from "memfs";

// Match the application's cwd for both relative and absolute filesystem paths.
export const { fs, vol } = memfs({}, { cwd: process.cwd(), process });

export function setFiles(files = {}) {
  vol.reset();
  vol.fromNestedJSON(files, process.cwd());
}
