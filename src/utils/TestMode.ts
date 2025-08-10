export default class TestMode {
  private static testModeEnabled: boolean = false;

  public static enable(): void {
    TestMode.testModeEnabled = true;
  }

  public static disable(): void {
    TestMode.testModeEnabled = false;
  }

  public static isEnabled(): boolean {
    return TestMode.testModeEnabled;
  }
}


