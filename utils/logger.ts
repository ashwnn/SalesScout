/**
 * Custom Logger Utility
 * Provides structured logging with different log levels
 */

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private minLevel: LogLevel;
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
    // Set log level based on environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() || 'INFO';
    this.minLevel = LogLevel[envLevel as keyof typeof LogLevel] ?? LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel;
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] [${this.context}] ${message}${formattedArgs}`;
  }

  private colorize(text: string, colorCode: number): string {
    // Only colorize in development or when TTY is available
    if (process.env.NODE_ENV === 'production' || !process.stdout.isTTY) {
      return text;
    }
    return `\x1b[${colorCode}m${text}\x1b[0m`;
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    const formatted = this.formatMessage('DEBUG', message, ...args);
    console.log(this.colorize(formatted, 36)); // Cyan
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const formatted = this.formatMessage('INFO', message, ...args);
    console.log(this.colorize(formatted, 32)); // Green
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    const formatted = this.formatMessage('WARN', message, ...args);
    console.warn(this.colorize(formatted, 33)); // Yellow
  }

  error(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    const formatted = this.formatMessage('ERROR', message, ...args);
    console.error(this.colorize(formatted, 31)); // Red
  }

  // Convenience method for logging HTTP requests
  http(method: string, path: string, statusCode?: number, duration?: number): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    const status = statusCode ? ` - ${statusCode}` : '';
    const time = duration ? ` [${duration}ms]` : '';
    const message = `${method} ${path}${status}${time}`;
    const formatted = this.formatMessage('HTTP', message);
    console.log(this.colorize(formatted, 35)); // Magenta
  }

  // Create a child logger with a new context
  child(childContext: string): Logger {
    const logger = new Logger(`${this.context}:${childContext}`);
    logger.minLevel = this.minLevel;
    return logger;
  }
}

// Create and export default logger instances
export const logger = new Logger('Server');
export const createLogger = (context: string) => new Logger(context);
export default logger;
