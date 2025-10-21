import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 현재 모듈이 node로 직접 실행된 경우(true)인지 판단.
 * ESM에서 "node file.js" 실행(또는 package.json bin 경유) 시 process.argv[1] 과 모듈 실제 경로를 비교.
 * @param {string} moduleUrl import.meta.url
 */
export function isDirectRun(moduleUrl) {
  // ESM 모듈에서 호출되므로 process.argv[1]은 항상 존재
  const invoked = path.resolve(process.argv[1]);
  const modulePath = fileURLToPath(moduleUrl);

  try {
    // 심볼릭 링크 해결 (파일 존재 여부 확인도 함께 수행됨)
    const invokedReal = fs.realpathSync(invoked);
    const moduleReal = fs.realpathSync(modulePath);

    return invokedReal === moduleReal;
  } catch (error) {
    // 파일이 존재하지 않거나 접근할 수 없는 경우
    throw new Error(`Cannot resolve file path: ${error.message}`);
  }
}
