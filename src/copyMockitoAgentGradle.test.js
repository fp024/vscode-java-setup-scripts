import { access, readFile, stat } from "node:fs/promises";
import { setFiles, vol } from "./test/memoryFs.js";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { copyMockitoAgentGradle } from "./copyMockitoAgentGradle.js";

vi.mock("node:fs/promises", async () => {
  const { fs } = await import("./test/memoryFs.js");
  return { default: fs.promises, ...fs.promises };
});

describe("copyMockitoAgentGradle", () => {
  const mockGradleContent = `[Mockito Agent 설정 파일 내용...]`;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vol.reset();
    vi.restoreAllMocks();
  });

  test("should copy java21-mockito-agent.gradle to gradle directory", async () => {
    setFiles({
      [path.resolve("src/gradle/java21-mockito-agent.gradle")]:
        mockGradleContent,
    });

    await copyMockitoAgentGradle();

    const gradleDir = path.join(process.cwd(), "gradle");
    // gradle 디렉터리가 생성되었는지 확인
    await expect(access(gradleDir)).resolves.not.toThrow();

    // 파일이 복사되었는지 확인
    const targetFile = path.join(gradleDir, "java21-mockito-agent.gradle");
    await expect(access(targetFile)).resolves.not.toThrow();

    // 파일 크기가 일치하는지 확인
    const sourceStats = await stat(
      path.resolve("src/gradle/java21-mockito-agent.gradle"),
    );
    const targetStats = await stat(targetFile);
    // 💡 stats에서 반환하는 값은 바이트 사이즈이다.
    expect(targetStats.size).toBe(sourceStats.size);
    expect(targetStats.size).toBeGreaterThan(0);
  });

  test("should create gradle directory if it does not exist", async () => {
    setFiles({
      [path.resolve("src/gradle/java21-mockito-agent.gradle")]:
        mockGradleContent,
    });

    const gradleDir = path.join(process.cwd(), "gradle");
    // gradle 디렉터리가 없는 상태에서 시작
    await expect(access(gradleDir)).rejects.toThrow();

    await copyMockitoAgentGradle();

    // gradle 디렉터리가 생성되었는지 확인
    await expect(access(gradleDir)).resolves.not.toThrow();
  });

  test("should overwrite existing file", async () => {
    // target: gradle/java21-mockito-agent.gradle
    const gradleDir = path.join(process.cwd(), "gradle");
    const targetFile = path.join(gradleDir, "java21-mockito-agent.gradle");

    // 기존 파일이 있는 상태로 mock 설정
    setFiles({
      [path.resolve("src/gradle/java21-mockito-agent.gradle")]:
        mockGradleContent,
      [gradleDir]: {
        "java21-mockito-agent.gradle": "old content",
      },
    });

    await copyMockitoAgentGradle();

    // 파일이 존재하는지 확인
    await expect(access(targetFile)).resolves.not.toThrow();

    const targetFileContent = await readFile(targetFile, "utf8");
    expect(targetFileContent).toBe(mockGradleContent);
  });
});
