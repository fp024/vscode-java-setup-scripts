import fs from "fs/promises";
import mock from "mock-fs";
import path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addCompilerOption } from "./addJavacParametersOption.js";

describe("addCompilerOption", () => {
  const settingsDir = ".settings";
  const prefsFile = "org.eclipse.jdt.core.prefs";
  const prefsPath = path.join(settingsDir, prefsFile);
  const optionLine =
    "org.eclipse.jdt.core.compiler.codegen.methodParameters=generate\n";

  beforeEach(() => {
    mock({});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it("1. .settings 디렉토리와 prefs 파일이 생성되고 옵션이 추가된다", async () => {
    await addCompilerOption();
    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe(optionLine);
    expect(console.log).toHaveBeenCalledWith(
      "Created new prefs file with -parameters compiler option."
    );
  });

  it("2. 이미 옵션이 존재할 때 메시지가 올바르게 출력된다", async () => {
    mock({
      [settingsDir]: {
        [prefsFile]: optionLine,
      },
    });
    await addCompilerOption();
    expect(console.log).toHaveBeenCalledWith(
      "The -parameters compiler option already exists for VSCode Java environment."
    );
  });

  it("3. 옵션이 없을 때 기존 내용 뒤에 옵션이 추가된다", async () => {
    const oldContent = "some.other.option=value\n";
    mock({
      [settingsDir]: {
        [prefsFile]: oldContent,
      },
    });
    await addCompilerOption();
    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe(oldContent + optionLine);
    expect(console.log).toHaveBeenCalledWith(
      "The -parameters compiler option has been added for VSCode Java environment."
    );
  });
});
