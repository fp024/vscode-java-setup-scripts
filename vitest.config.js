import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",

    // 전역 테스트 함수 사용 (describe, it, expect 등)
    // Jest처럼 import 없이 사용하려면 true로 설정
    globals: false,
  },
});
