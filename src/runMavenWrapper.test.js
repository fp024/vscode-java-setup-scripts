import { getMavenCommand } from "./runMavenWrapper.js";
import { describe, expect, afterEach, it, vi } from "vitest";
import os from "os";

describe("getMavenCommand", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("윈도우 환경에서는 mvnw.cmd을 반환한다", () => {
    vi.spyOn(os, "platform").mockReturnValue("win32");
    expect(getMavenCommand()).toBe("mvnw.cmd");
  });

  it("리눅스/유닉스 환경에서는 ./mvnw를 반환한다", () => {
    vi.spyOn(os, "platform").mockReturnValue("linux");
    expect(getMavenCommand()).toBe("./mvnw");
  });
});
