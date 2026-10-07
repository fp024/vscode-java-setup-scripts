# mock-fs에서 memfs로 전환한 이유

## 기존 테스트에서 mock-fs를 사용한 목적

이 프로젝트의 스크립트는 설정 파일을 읽고 수정하거나, 디렉터리를 생성하고 파일을 복사한다. 테스트에서는 개발자의 실제 프로젝트 파일을 변경하지 않으면서 파일·폴더의 유무와 기존 내용을 자유롭게 설정할 수 있어야 한다.

기존에는 `mock-fs`로 가상 파일시스템을 구성해 다음 동작을 검증했다.

| 테스트 파일                          | 검증 대상                                                |
| ------------------------------------ | -------------------------------------------------------- |
| `src/initTestJvmOptions.test.js`     | Mockito JAR 유무, JVM 옵션 추가 및 버전 변경             |
| `src/copyMockitoAgentGradle.test.js` | Gradle 파일 복사, 대상 디렉터리 생성, 기존 파일 덮어쓰기 |
| `src/util/addJDTOption.test.js`      | prefs 파일 생성, 옵션 추가·수정, 중복 옵션 처리          |

## 전환을 결정한 이유

`mock-fs`는 Node의 내부 파일시스템 바인딩을 교체하는 방식으로 동작한다. 이 내부 구현은 공개 `fs` API처럼 호환성이 보장되는 인터페이스가 아니므로, Node 버전이 올라가면서 바인딩의 호출 방식이나 구현이 바뀌면 테스트가 실패할 수 있다. 애플리케이션 로직에 문제가 없어도 테스트용 파일시스템과 Node 사이의 호환성 때문에 실패할 가능성이 있는 것이다.

이 프로젝트는 Node `>=22.0.0`을 지원하므로, Node 업데이트 때 이러한 내부 구현 의존성을 유지하는 부담을 줄이기 위해 `memfs`로 전환했다.

이번 전환은 호환성 위험을 줄이기 위한 예방적 변경이다. 특정 Node 버전에서 `mock-fs` 오류를 재현하거나 원인을 추적한 결과를 기록한 문서는 아니다.

## memfs를 선택한 이유

`memfs`는 Node의 `fs` API와 유사한 메모리 파일시스템을 제공한다. 이번 구현에서는 Node 내부 바인딩을 패치하지 않고, Vitest의 `vi.mock`으로 테스트 대상이 사용하는 `node:fs/promises` 모듈을 명시적으로 교체한다.

이 방식은 기존 테스트의 장점을 유지하면서 내부 구현에 대한 의존성을 줄인다.

- 실제 프로젝트 파일을 변경하지 않고 파일 생성·읽기·쓰기·복사를 검증한다.
- 파일이 없거나 이미 존재하는 상황을 테스트별로 쉽게 구성한다.
- 테스트마다 파일시스템을 초기화해 이전 테스트의 파일이 남지 않도록 한다.
- 실제 실행 코드의 파일 접근 방식은 유지한다.

다만 `memfs`도 실제 파일시스템의 모든 동작을 완전히 재현하지는 않는다. OS별 권한, 파일 잠금 등 실제 환경의 동작이 중요한 경우에는 별도의 실제 파일시스템 테스트가 필요하다.

## 적용 방식

공통 헬퍼인 [`src/test/memoryFs.js`](../src/test/memoryFs.js)에서 메모리 파일시스템을 생성한다.

```js
import { memfs } from "memfs";

export const { fs, vol } = memfs({}, { cwd: process.cwd(), process });

export function setFiles(files = {}) {
  vol.reset();
  vol.fromNestedJSON(files, process.cwd());
}
```

메모리 파일시스템과 테스트 대상이 같은 작업 디렉터리를 사용하도록 설정한다. 이는 테스트가 사용하는 상대 경로와 실행 코드가 `process.cwd()`로 만드는 절대 경로가 같은 파일을 가리키도록 하기 위해서다.

각 테스트 파일은 다음과 같이 파일 접근 모듈을 교체한다. 아래 경로는 `src/initTestJvmOptions.test.js` 기준이다.

```js
vi.mock("node:fs/promises", async () => {
  const { fs } = await import("./test/memoryFs.js");
  return { default: fs.promises, ...fs.promises };
});
```

`default`와 이름 있는 내보내기를 모두 제공하므로, `import fs from "node:fs/promises"`와 `import { readFile } from "node:fs/promises"` 형태를 모두 지원한다.

기존 `mock({...})` 호출은 `setFiles({...})`로 교체했다. `setFiles`는 파일시스템을 초기화한 뒤 중첩 객체로 파일·폴더를 구성한다. 테스트 종료 후에는 `vol.reset()`으로 가상 파일을 비우고, `vi.restoreAllMocks()`로 콘솔 등에 적용한 spy를 복구한다. 모듈 교체는 각 테스트 파일 안에서 유지된다.

의존성에서는 `mock-fs`를 제거하고 `memfs`를 개발 의존성으로 추가했으며, `pnpm-lock.yaml`에도 반영했다. 실제 실행 코드에는 변경이 없다.

## 대안: 실제 임시 디렉터리

Node의 `mkdtemp`로 실제 임시 디렉터리를 만들어 테스트하는 방법도 있다. 이 방식은 가상 파일시스템 의존성이 없고 실제 OS의 파일 동작을 검증할 수 있다.

현재 테스트에서는 파일 상태를 간단히 구성하고 기존 검증 구조를 유지하는 것이 적합하므로 `memfs`를 선택했다. 실제 임시 디렉터리를 사용하려면 실행 코드가 사용하는 작업 경로와 Gradle 원본 파일 경로를 어떻게 분리할지 고려하고, 테스트 후 정리와 병렬 실행 시 격리도 처리해야 한다.

## 검증 결과

전환 후 Node `v24.21.0 `버전과  `26.10.0` 버전에서 `pnpm test`를 실행해 전체 5개 테스트 파일, 21개 테스트가 통과했다. 이 결과는 해당 환경에서 기존 테스트 시나리오가 유지됨을 확인한 것이며, 지원하는 모든 Node 버전에 대한 검증을 의미하지는 않는다.

## 참고

- [mock-fs 공식 저장소](https://github.com/tschaub/mock-fs)
- [memfs 공식 저장소](https://github.com/streamich/memfs)
- [Vitest 모듈 모킹 문서](https://vitest.dev/guide/mocking/modules)
