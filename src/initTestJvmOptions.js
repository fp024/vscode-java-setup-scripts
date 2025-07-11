#!/usr/bin/env node
import { readdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { parse, stringify } from "comment-json";

// 상수 정의
export const CONFIG = {
  PATHS: {
    JAVAAGENT_DIR: "javaagent-libs",
    VSCODE_SETTINGS: ".vscode/settings.json",
  },
  MOCKITO_CORE_FILE: {
    PREFIX: "mockito-core",
    SUFFIX: ".jar",
  },
  JVM_OPTIONS: {
    MOCKITO_AGENT: {
      PREFIX: "-javaagent:${workspaceFolder}/javaagent-libs/mockito-core",
      // VALUE에 해당하는 앞부분이 PREFIX부분에 정의되어있는데, 뒷부분의 -{버전}.jar 부분은 동적으로 결정됨
    },
    XSHARE: {
      PREFIX: "-Xshare:",
      VALUE: "off",
    },
  },
  SETTINGS_KEY: "java.test.config",
};

/**
 * JVM 옵션을 업데이트하는 함수
 * @param {string[]} vmArgs - 기존 VM 인자 배열
 * @param {string} optionPrefix - 옵션 접두사
 * @param {string} optionValue - 설정할 값
 * @returns {{vmArgs: string[], modified: boolean, oldValue: string}} - 업데이트된 VM 인자 배열과 변경 정보
 */
function updateJvmOption(vmArgs, optionPrefix, optionValue) {
  const optionIndex = vmArgs.findIndex((arg) => arg.startsWith(optionPrefix));
  const result = {
    vmArgs: [...vmArgs],
    modified: false,
    oldValue: null,
    added: false,
  };

  if (optionIndex >= 0) {
    if (vmArgs[optionIndex] !== optionValue) {
      result.oldValue = vmArgs[optionIndex];
      result.vmArgs[optionIndex] = optionValue;
      result.modified = true;
    }
  } else {
    result.vmArgs.push(optionValue);
    result.added = true;
  }

  return result;
}

async function initJvmOptions() {
  const changes = [];

  try {
    // Mockito JAR 찾기
    const javaAgentDir = path.join(process.cwd(), CONFIG.PATHS.JAVAAGENT_DIR);

    const files = await readdir(javaAgentDir);
    const mockitoJar = files.find(
      (file) =>
        file.startsWith(CONFIG.MOCKITO_CORE_FILE.PREFIX) &&
        file.endsWith(CONFIG.MOCKITO_CORE_FILE.SUFFIX)
    );

    if (!mockitoJar) {
      return { success: false, error: "Mockito JAR not found" };
    }

    // VSCode 설정 파일 읽기
    const settingsPath = path.join(process.cwd(), CONFIG.PATHS.VSCODE_SETTINGS);
    const settings = parse(await readFile(settingsPath, "utf8"));

    // 기존 VM 인자 가져오기
    let existingVmArgs = settings[CONFIG.SETTINGS_KEY]?.vmArgs || [];

    // Mockito JavaAgent 옵션 업데이트
    const mockitoJavaAgentOption = `-javaagent:\${workspaceFolder}/javaagent-libs/${mockitoJar}`;
    const mockitoResult = updateJvmOption(
      existingVmArgs,
      CONFIG.JVM_OPTIONS.MOCKITO_AGENT.PREFIX,
      mockitoJavaAgentOption
    );

    existingVmArgs = mockitoResult.vmArgs;
    if (mockitoResult.modified) {
      changes.push(
        `Updated JavaAgent: ${mockitoResult.oldValue} -> ${mockitoJavaAgentOption}`
      );
    } else if (mockitoResult.added) {
      changes.push(`Added JavaAgent: ${mockitoJavaAgentOption}`);
    }

    // Xshare 옵션 업데이트
    const shareOffOption = `${CONFIG.JVM_OPTIONS.XSHARE.PREFIX}${CONFIG.JVM_OPTIONS.XSHARE.VALUE}`;
    const shareResult = updateJvmOption(
      existingVmArgs,
      CONFIG.JVM_OPTIONS.XSHARE.PREFIX,
      shareOffOption
    );

    existingVmArgs = shareResult.vmArgs;
    if (shareResult.modified) {
      changes.push(
        `Updated Xshare: ${shareResult.oldValue} -> ${shareOffOption}`
      );
    } else if (shareResult.added) {
      changes.push(`Added Xshare: ${shareOffOption}`);
    }

    // 설정 업데이트 및 저장
    settings[CONFIG.SETTINGS_KEY] = {
      ...settings[CONFIG.SETTINGS_KEY],
      vmArgs: existingVmArgs,
    };

    await writeFile(settingsPath, stringify(settings, null, 2, { eol: "\n" }));

    if (changes.length > 0) {
      console.log("JVM settings updated:");
      changes.forEach((change) => console.log(`- ${change}`));
    } else {
      console.log("JVM settings already up to date, no changes needed");
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { initJvmOptions, updateJvmOption };

if (process.argv[1]?.includes(`src${path.sep}initTestJvmOptions.js`)) {
  initJvmOptions().then((result) => {
    if (!result.success) {
      console.error(`Error updating JVM options: ${result.error}`);
      process.exit(1);
    }
  });
}
