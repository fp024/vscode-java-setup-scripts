import mock from "mock-fs";
import fs from "node:fs/promises";
import path from "node:path";
import { initJvmOptions, CONFIG } from "./initTestJvmOptions.js";
import { describe, beforeEach, afterEach, expect, it, vi } from "vitest";

const JAVAAGENT_DIR = CONFIG.PATHS.JAVAAGENT_DIR;
const SETTINGS_KEY = CONFIG.SETTINGS_KEY;
const LATEST_MOCKITO_JAR = "mockito-core-5.18.0.jar";
const PREVIOUS_MOCKITO_JAR = "mockito-core-5.17.0.jar";

describe("initJvmOptions", () => {
  beforeEach(() => {
    mock({});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it("Mockito JAR이 없으면 에러를 반환한다", async () => {
    mock({
      [JAVAAGENT_DIR]: {},
      ".vscode": { "settings.json": "{}" },
    });
    const result = await initJvmOptions();
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Mockito JAR not found/);
  });

  it("VSCode 설정파일에 이미 올바른 설정이 있으면 변경하지 않는다", async () => {
    const settings = {
      [SETTINGS_KEY]: {
        vmArgs: [
          `-javaagent:${"${workspaceFolder}"}/javaagent-libs/${LATEST_MOCKITO_JAR}`,
          "-Xshare:off",
        ],
      },
    };
    mock({
      [JAVAAGENT_DIR]: { [LATEST_MOCKITO_JAR]: "fake jar" },
      ".vscode": { "settings.json": JSON.stringify(settings) },
    });
    const result = await initJvmOptions();
    expect(result.success).toBe(true);
    expect(console.log).toHaveBeenCalledWith(
      "JVM settings already up to date, no changes needed"
    );
  });

  it("VSCode 설정파일에 설정이 없으면 제대로 추가된다", async () => {
    mock({
      [JAVAAGENT_DIR]: { [LATEST_MOCKITO_JAR]: "fake jar" },
      ".vscode": { "settings.json": "{}" },
    });
    const result = await initJvmOptions();
    expect(result.success).toBe(true);
    const settingsPath = path.join(".vscode", "settings.json");
    const settings = JSON.parse(await fs.readFile(settingsPath, "utf8"));
    expect(settings[SETTINGS_KEY].vmArgs).toEqual(
      expect.arrayContaining([
        `-javaagent:${"${workspaceFolder}"}/javaagent-libs/${LATEST_MOCKITO_JAR}`,
        "-Xshare:off",
      ])
    );
  });

  it("Mockito 버전만 다를 때 업데이트가 제대로 된다", async () => {
    const settings = {
      [SETTINGS_KEY]: {
        vmArgs: [
          `-javaagent:${"${workspaceFolder}"}/javaagent-libs/${PREVIOUS_MOCKITO_JAR}`,
          "-Xshare:off",
        ],
      },
    };
    mock({
      [JAVAAGENT_DIR]: { [LATEST_MOCKITO_JAR]: "fake jar's contents" },
      ".vscode": { "settings.json": JSON.stringify(settings) },
    });
    const result = await initJvmOptions();
    expect(result.success).toBe(true);
    const settingsPath = path.join(".vscode", "settings.json");
    const updated = JSON.parse(await fs.readFile(settingsPath, "utf8"));
    expect(updated[SETTINGS_KEY].vmArgs).toEqual(
      expect.arrayContaining([
        `-javaagent:${"${workspaceFolder}"}/javaagent-libs/${LATEST_MOCKITO_JAR}`,
        "-Xshare:off",
      ])
    );
  });
});
