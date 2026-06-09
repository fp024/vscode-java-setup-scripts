import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

async function ensureDirectory(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function addOption(SETTINGS) {
  const settingsDir = path.join(process.cwd(), SETTINGS.DIR);
  const prefsFilePath = path.join(settingsDir, SETTINGS.FILE);
  const optionLine = `${SETTINGS.OPTION.KEY}=${SETTINGS.OPTION.VALUE}`;
  const prefsContent = `${optionLine}\n`;

  await ensureDirectory(settingsDir);

  try {
    const fileContent = await readFile(prefsFilePath, "utf8");
    const lines = fileContent.split(/\r?\n/);
    const optionIndexes = lines
      .map((rawLine, index) => ({
        index,
        line: rawLine.trim(),
      }))
      .filter(({ line }) => line.startsWith(`${SETTINGS.OPTION.KEY}=`))
      .map(({ index }) => index);

    if (optionIndexes.length > 1) {
      console.warn(
        `Multiple ${SETTINGS.OPTION.DISPLAY_NAME} options were found. No changes were made.`,
      );
      return;
    }

    if (optionIndexes.length === 1) {
      const optionIndex = optionIndexes[0];

      if (lines[optionIndex].trim() === optionLine) {
        console.log(
          `The ${SETTINGS.OPTION.DISPLAY_NAME}=${SETTINGS.OPTION.VALUE} option already exists for VSCode Java environment.`,
        );
      } else {
        lines[optionIndex] = optionLine;
        await writeFile(prefsFilePath, lines.join("\n"));
        console.log(
          `The ${SETTINGS.OPTION.DISPLAY_NAME} option has been updated to ${SETTINGS.OPTION.VALUE} for VSCode Java environment.`,
        );
      }
    } else {
      const contentToWrite = fileContent.endsWith("\n")
        ? fileContent + prefsContent
        : `${fileContent}\n${prefsContent}`;

      await writeFile(prefsFilePath, contentToWrite);
      console.log(
        `The ${SETTINGS.OPTION.DISPLAY_NAME}=${SETTINGS.OPTION.VALUE} option has been added for VSCode Java environment.`,
      );
    }
  } catch {
    // 파일이 없는 경우 새로 생성
    await writeFile(prefsFilePath, prefsContent);
    console.log(
      `Created new prefs file with ${SETTINGS.OPTION.DISPLAY_NAME}=${SETTINGS.OPTION.VALUE} option.`,
    );
  }
}

export { addOption, ensureDirectory };
