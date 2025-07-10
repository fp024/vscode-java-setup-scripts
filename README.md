# vscode-java-setup-scripts

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/fp024/vscode-java-setup-scripts)](https://github.com/fp024/vscode-java-setup-scripts/releases)

VSCode Java 프로젝트의 개발 환경 세팅을 자동화하는 CLI 스크립트 모음입니다.  
(예: javac 파라미터 옵션 추가, Mockito JAR 복사, 테스트 JVM 옵션 초기화 등)

---

## 설치 및 사용법

### 1. GitHub 저장소를 직접 의존성으로 추가

```bash
pnpm add -D github:fp024/vscode-java-setup-scripts#RELEASE_VERSION
```

> 최신 릴리즈는 [GitHub Releases](https://github.com/fp024/vscode-java-setup-scripts/releases)에서 확인하세요.

---

### 2. 사용처 package.json에 scripts 등록

```json
"scripts": {
  "add-javac-parameters-option": "add-javac-parameters-option",
  "copy-mockito-jar": "run-gradle-wrapper copyMockitoJar",
  "init-test-jvm-options": "init-test-jvm-options",
  "init-project": "pnpm run add-javac-parameters-option && pnpm run copy-mockito-jar && pnpm run init-test-jvm-options"
}
```

---

### 3. 명령어 실행

```bash
pnpm run init-project
```

---

## 각 스크립트 설명

- **addJavacParametersOption.js**  
  `.settings/org.eclipse.jdt.core.prefs`에 `-parameters` 옵션을 추가합니다.

- **runGradleWrapper.js**  
  Gradle Wrapper를 통해 `copyMockitoJar` 등 커맨드를 실행합니다.

- **initTestJvmOptions.js**  
  `.vscode/settings.json`의 `java.test.config.vmArgs`에 Mockito JavaAgent, `-Xshare:off` 옵션을 자동으로 추가합니다.

---

## 요구사항

- Node.js 16.17.0 이상
- pnpm (npm을 사용할 경우 스크립트 실행명령을 알맞게 변경 필요)

---

## 참고

- npm registry에 배포하지 않고, **GitHub 저장소에서 직접 설치**하는 방식입니다.
- 필요에 따라 scripts 경로나 명령어를 프로젝트에 맞게 수정해 주세요.
