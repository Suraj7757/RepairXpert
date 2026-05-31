/**
 * Centralized logging utility
 * In production, logs are sent to monitoring service
 * In development, logs are output to console
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const isDevelopment = import.meta.env.DEV;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private logs: LogEntry[] = [];

  private createEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private output(entry: LogEntry) {
    this.logs.push(entry);

    // In development, output to console
    if (isDevelopment) {
      const consoleMethod = {
        debug: 'log',
        info: 'log',
        warn: 'warn',
        error: 'error',
      }[entry.level] as 'log' | 'warn' | 'error';

      console[consoleMethod](
        `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`,
        entry.context || ''
      );
    }

    // TODO: In production, send to external monitoring service (Sentry, LogRocket, etc.)
  }

  debug(message: string, context?: Record<string, any>) {
    this.output(this.createEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, any>) {
    this.output(this.createEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, any>) {
    this.output(this.createEntry('warn', message, context));
  }

  error(message: string, context?: Record<string, any>) {
    this.output(this.createEntry('error', message, context));
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (!level) return this.logs;
    return this.logs.filter(log => log.level === level);
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = new Logger();
