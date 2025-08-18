import path from "path";
import { fileURLToPath } from "url";

/**
 * 현재 모듈이 node로 직접 실행된 경우(true)인지 판단.
 * ESM에서 "node file.js" 실행(또는 package.json bin 경유) 시 process.argv[1] 과 모듈 실제 경로를 비교.
 * @param {string} moduleUrl import.meta.url
 */
export function isDirectRun(moduleUrl) {
  const invoked = process.argv[1] ? path.resolve(process.argv[1]) : "";
  const modulePath = fileURLToPath(moduleUrl);
  return invoked === modulePath;
}
