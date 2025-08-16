import { access, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

const SETTINGS = {
  DIR: ".settings",
  FILE: "org.eclipse.jdt.core.prefs",
  OPTION: {
    KEY: "org.eclipse.jdt.core.compiler.codegen.methodParameters",
    VALUE: "generate",
  },
};

async function ensureDirectory(dir) {
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function addCompilerOption() {
  const settingsDir = path.join(process.cwd(), SETTINGS.DIR);
  const prefsFilePath = path.join(settingsDir, SETTINGS.FILE);
  const prefsContent = `${SETTINGS.OPTION.KEY}=${SETTINGS.OPTION.VALUE}\n`;

  await ensureDirectory(settingsDir);

  try {
    const fileContent = await readFile(prefsFilePath, "utf8");
    if (!fileContent.includes(prefsContent.trim())) {
      await writeFile(prefsFilePath, fileContent + prefsContent);
      console.log(
        "The -parameters compiler option has been added for VSCode Java environment."
      );
    } else {
      console.log(
        "The -parameters compiler option already exists for VSCode Java environment."
      );
    }
  } catch {
    // 파일이 없는 경우 새로 생성
    await writeFile(prefsFilePath, prefsContent);
    console.log("Created new prefs file with -parameters compiler option.");
  }
}

export { addCompilerOption, ensureDirectory };

if (process.argv[1]?.includes(`src${path.sep}addJavacParametersOption.js`)) {
  addCompilerOption().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
