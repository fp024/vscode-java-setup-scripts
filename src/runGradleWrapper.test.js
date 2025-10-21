import { getGradleCommand } from "./runGradleWrapper.js";
import { describe, expect, afterEach, it, vi } from "vitest";
import os from "node:os";

describe("getGradleCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("윈도우 환경에서는 gradlew.bat을 반환한다", () => {
    vi.spyOn(os, "platform").mockReturnValue("win32");
    expect(getGradleCommand()).toBe("gradlew.bat");
  });

  it("리눅스/유닉스 환경에서는 ./gradlew를 반환한다", () => {
    vi.spyOn(os, "platform").mockReturnValue("linux");
    expect(getGradleCommand()).toBe("./gradlew");
  });
});
