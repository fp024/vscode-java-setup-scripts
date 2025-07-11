import { getGradleCommand } from "./runGradleWrapper.js";
import { jest } from "@jest/globals";
import os from "os";

describe("getGradleCommand", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("윈도우 환경에서는 gradlew.bat을 반환한다", () => {
    jest.spyOn(os, "platform").mockReturnValue("win32");
    expect(getGradleCommand()).toBe("gradlew.bat");
  });

  it("리눅스/유닉스 환경에서는 ./gradlew를 반환한다", () => {
    jest.spyOn(os, "platform").mockReturnValue("linux");
    expect(getGradleCommand()).toBe("./gradlew");
  });
});
