import { access, copyFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Java 21+ Mockito Agent 설정 파일을 프로젝트의 gradle 디렉터리로 복사합니다.
 */
export async function copyMockitoAgentGradle() {
  const sourceFile = path.join(
    __dirname,
    "gradle",
    "java21-mockito-agent.gradle"
  );
  const targetDir = path.join(process.cwd(), "gradle");
  const targetFile = path.join(targetDir, "java21-mockito-agent.gradle");

  try {
    // gradle 디렉터리가 없으면 생성
    try {
      await access(targetDir);
    } catch {
      await mkdir(targetDir, { recursive: true });
      console.log("📁 gradle 디렉터리가 생성되었습니다.");
    }

    // 파일 복사
    await copyFile(sourceFile, targetFile);
    console.log("✅ java21-mockito-agent.gradle 파일이 복사되었습니다.");
    console.log(`   📍 위치: ${targetFile}`);
    console.log("");
    console.log("📋 사용법:");
    console.log("   build.gradle에 다음 라인을 추가하세요:");
    console.log("   apply from: 'gradle/java21-mockito-agent.gradle'");
    console.log("");
    console.log("📚 자세한 설정 방법은 다음 문서를 참고하세요:");
    console.log("   docs/copyMockitoJar-테스크-적용방법.md");
  } catch (error) {
    if (error.code === "ENOENT" && error.path === sourceFile) {
      console.error(
        "❌ 오류: java21-mockito-agent.gradle 파일을 찾을 수 없습니다."
      );
      console.error(`   예상 위치: ${sourceFile}`);
    } else {
      console.error("❌ 파일 복사 중 오류가 발생했습니다:", error.message);
    }
    process.exit(1);
  }
}

// 스크립트가 직접 실행된 경우에만 함수 호출
if (process.argv[1]?.includes(`src${path.sep}copyMockitoAgentGradle.js`)) {
  copyMockitoAgentGradle().catch((error) => {
    console.error("Error:", error.message);
    process.exit(1);
  });
}
