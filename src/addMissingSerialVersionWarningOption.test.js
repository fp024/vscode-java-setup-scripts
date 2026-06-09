import fs from "node:fs/promises";
import mock from "mock-fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addOption } from "./addMissingSerialVersionWarningOption.js";

describe("addOption", () => {
  const settingsDir = ".settings";
  const prefsFile = "org.eclipse.jdt.core.prefs";
  const prefsPath = path.join(settingsDir, prefsFile);
  const optionLine =
    "org.eclipse.jdt.core.compiler.problem.missingSerialVersion=warning\n";

  beforeEach(() => {
    mock({});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => {
    mock.restore();
    vi.restoreAllMocks();
  });

  it("1. .settings 디렉토리와 prefs 파일이 생성되고 옵션이 추가된다", async () => {
    await addOption();
    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe(optionLine);
    expect(console.log).toHaveBeenCalledWith(
      "Created new prefs file with JDT missingSerialVersion=warning option.",
    );
  });

  it("2. 이미 옵션이 존재할 때 메시지가 올바르게 출력된다", async () => {
    mock({
      [settingsDir]: {
        [prefsFile]: optionLine,
      },
    });
    await addOption();
    expect(console.log).toHaveBeenCalledWith(
      "The JDT missingSerialVersion=warning option already exists for VSCode Java environment.",
    );
  });

  it("3. 옵션이 없을 때 기존 내용 뒤에 옵션이 추가된다", async () => {
    const oldContent = "some.other.option=value\n";
    mock({
      [settingsDir]: {
        [prefsFile]: oldContent,
      },
    });
    await addOption();
    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe(oldContent + optionLine);
    expect(console.log).toHaveBeenCalledWith(
      "The JDT missingSerialVersion=warning option has been added for VSCode Java environment.",
    );
  });

  it("4. 옵션 키가 이미 있지만 값이 다르면 warning으로 수정된다", async () => {
    const oldContent =
      "some.other.option=value\n" +
      "org.eclipse.jdt.core.compiler.problem.missingSerialVersion=ignore\n";
    mock({
      [settingsDir]: {
        [prefsFile]: oldContent,
      },
    });

    await addOption();

    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe("some.other.option=value\n" + optionLine);
    expect(console.log).toHaveBeenCalledWith(
      "The JDT missingSerialVersion option has been updated to warning for VSCode Java environment.",
    );
  });

  it("5. 옵션 키가 2개 이상 있으면 경고를 출력하고 파일을 변경하지 않는다", async () => {
    const oldContent =
      "some.other.option=value\n" +
      "org.eclipse.jdt.core.compiler.problem.missingSerialVersion=ignore\n" +
      "org.eclipse.jdt.core.compiler.problem.missingSerialVersion=error\n";
    mock({
      [settingsDir]: {
        [prefsFile]: oldContent,
      },
    });

    await addOption();

    const content = await fs.readFile(prefsPath, "utf8");
    expect(content).toBe(oldContent);
    expect(console.warn).toHaveBeenCalledWith(
      "Multiple JDT missingSerialVersion options were found. No changes were made.",
    );
  });
});
