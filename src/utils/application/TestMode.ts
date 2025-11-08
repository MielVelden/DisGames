export default class TestMode {
  private static testModeEnabled: boolean = false;
  private static debugModeEnabled: boolean = false;

  public static enable(): void {
    TestMode.testModeEnabled = true;
  }

  public static disable(): void {
    TestMode.testModeEnabled = false;
  }

  public static isEnabled(): boolean {
    return TestMode.testModeEnabled;
  }

  public static enableDebugMode(): void {
    TestMode.debugModeEnabled = true;
  }

  public static disableDebugMode(): void {
    TestMode.debugModeEnabled = false;
  }

  public static isDebugModeEnabled(): boolean {
    return TestMode.debugModeEnabled;
  }
}
