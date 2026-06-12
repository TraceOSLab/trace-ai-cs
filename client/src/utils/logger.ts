/**
 * 日志工具
 */

class Logger {
  public debug(...args: any[]) {
    console.debug(...args);
  }

  public log(...args: any[]) {
    console.log(...args);
  }

  public error(...args: any[]) {
    console.error(...args);
  }

  public warn(...args: any[]) {
    console.warn(...args);
  }
}

export default new Logger();
