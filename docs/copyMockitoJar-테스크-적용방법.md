# Java 21+ Mockito Agent 설정 적용 방법

이 문서는 `java21-mockito-agent.gradle` 파일을 프로젝트에 적용하는 방법을 설명합니다.

## 개요

Java 21+에서 Mockito의 inline mocking을 사용하기 위해서는 JavaAgent 설정이 필요합니다. 

### Java 21+에서 JavaAgent 수동 설정이 필요한 이유

Java 21부터는 보안상의 이유로 **라이브러리가 스스로 JavaAgent를 동적으로 추가하는 것을 제한**합니다. 이전 버전에서는 Mockito가 런타임에 자동으로 instrumentation을 설정할 수 있었지만, Java 21+에서는 이것이 불가능해졌습니다.

따라서 다음과 같은 방법 중 하나를 선택해야 합니다:
1. **JavaAgent 수동 설정** (이 스크립트가 제공하는 방법)
2. Mockito의 subclass/spy 기반 mocking 사용 (inline mocking 포기)

이 Gradle 스크립트는 VSCode Java Test와 Gradle Test 모두에서 JavaAgent가 제대로 인식되도록 설정을 제공합니다.

## 적용 방법

### 1. 파일 복사 (자동)

CLI 스크립트를 사용하여 자동으로 파일을 복사합니다:

```bash
pnpm run copy-mockito-agent-gradle
```

### 2. 기본 적용

프로젝트의 `build.gradle` 파일에서 다음과 같이 적용합니다:

```gradle
apply from: 'gradle/java21-mockito-agent.gradle'
```

### 3. 의존성 설정

#### Case 1: Gradle Version Catalog (toml) 사용하는 경우

`gradle/libs.versions.toml` 파일에 mockito-core가 정의되어 있다면 그대로 사용 가능합니다:

```toml
[libraries]
mockito-core = { module = "org.mockito:mockito-core", version = "5.18.0" }
```

이 경우 `java21-mockito-agent.gradle` 파일에서 다음 부분이 활성화되어 있어야 합니다:

```groovy
dependencies {
  mockitoAgent(libs.mockito.core) {
    transitive = false
  }
}
```

#### Case 2: toml을 사용하지 않는 경우 (또는 **spring-boot-starter-test** 사용할 때)

toml 파일을 사용하지 않거나 Spring Boot Test를 사용한다면, `java21-mockito-agent.gradle` 파일에서 주석 처리된 부분을 활성화하세요:

```groovy
dependencies {
  mockitoAgent('org.mockito:mockito-core') {
    transitive = false
  }
}
```

## 주요 기능

### 1. copyMockitoJar 태스크

VSCode Java Test가 `build.gradle`의 test 설정을 인식하지 못하는 문제를 해결하기 위해 Mockito JAR 파일을 수동으로 복사하는 태스크입니다.

- **복사 위치**: `${project.rootDir}/javaagent-libs`
- **실행 시점**: `classes` 태스크 이후 자동 실행

### 2. Test JVM 설정

테스트 실행 시 다음 JVM 인수가 자동으로 적용됩니다:

```groovy
tasks.named('test') {
  jvmArgs += ["-javaagent:${configurations.mockitoAgent.asPath}", "-Xshare:off"]
}
```

**`jvmArgs +=` 사용 이유:**
- 기존에 설정된 JVM 인수들을 덮어쓰지 않고 추가
- 다른 설정과의 안전한 병합 보장
- 명시적 배열 형태로 더 명확한 설정

## 참고 사항

### tasks.named('test') 블록 중복 선언에 대하여

Gradle에서 `tasks.named('test')` 블록을 여러 번 선언할 경우, 마지막 것만 적용될 수 있다는 의견이 있었습니다. 

**하지만 실제 테스트 결과**:
- **Gradle 버전**: 8.14.3
- **테스트 명령어**: `gradle clean test --info`
- **결과**: 여러 `tasks.named('test')` 블록이 정상적으로 머지됨을 확인
  - Command: 부분의 -javaagent 값을 확인했음


따라서 기존 프로젝트에 이미 `tasks.named('test')` 블록이 있더라도 안전하게 적용할 수 있습니다.

## 사용 예시

```groovy
// build.gradle
plugins {
  id 'java'
}

// Mockito Agent 설정 적용
apply from: 'gradle/java21-mockito-agent.gradle'

// 💡 기존 test 테스크 설정과 정상 머지가 된다.
tasks.named('test') {
  useJUnitPlatform()
  testLogging {
    outputs.upToDateWhen { false }
    showStandardStreams = true
  }
  systemProperty "file.encoding", "${projectEncoding}"
}
```

## 참고 자료

- [Mockito Documentation - Inline Mocking](https://javadoc.io/doc/org.mockito/mockito-core/latest/org.mockito/org/mockito/Mockito.html#0.3)
  - **Java 21+ 중요 변경사항**: Java 21부터는 보안상의 이유로 라이브러리가 런타임에 자신을 JavaAgent로 동적 추가하는 것이 제한됨
  - **해결방법**: Mockito inline mocking 사용 시 JavaAgent를 명시적으로 설정하거나, subclass/spy 기반 mocking 사용



---

## Maven 환경의 에서의 적용

#### pom.xml에 디펜던시 copy goal 추가 

```xml
  <build>
    ...
    <plugins>
      ...
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-dependency-plugin</artifactId>
        <executions>
          <execution>
            <id>copy-mockito-agent</id>
            <phase>generate-test-resources</phase>
            <goals>
              <goal>copy</goal>
            </goals>
            <configuration>
              <artifactItems>
                <artifactItem>
                  <groupId>org.mockito</groupId>
                  <artifactId>mockito-core</artifactId>
                  <version>${mockito.version}</version>
                  <outputDirectory>${project.basedir}/javaagent-libs</outputDirectory>
                </artifactItem>
              </artifactItems>
              <overWriteReleases>true</overWriteReleases>
              <overWriteSnapshots>true</overWriteSnapshots>
            </configuration>
          </execution>
          <execution>
            <goals>
              <goal>properties</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-surefire-plugin</artifactId>
        <configuration>
          <argLine>-javaagent:${org.mockito:mockito-core:jar}</argLine>
        </configuration>
      </plugin>
      ...
    </plugins>
  </build>
```



### package.json에 다음 내용 추가

maven wrapper로 디펜던시 Copy Goal을 실행할 수 있도록 추가한다.

```json
  "scripts": {
    ...
    "copy-mockito-jar-maven": "run-maven-wrapper dependency:copy@copy-mockito-agent",
    ...
  },
```

완성된 모습은... 보통 아래와 같이 된다.

```json
  "scripts": {
    "preinstall": "npx only-allow pnpm",
    "format": "prettier --write \"./**/*.{html,css,js,json}\"",
    "add-javac-parameters-option": "add-javac-parameters-option",
    "copy-mockito-jar-maven": "run-maven-wrapper dependency:copy@copy-mockito-agent",
    "init-test-jvm-options": "init-test-jvm-options",
    "init-project": "pnpm run add-javac-parameters-option && pnpm run copy-mockito-jar-maven && pnpm run init-test-jvm-options"
  },
```

