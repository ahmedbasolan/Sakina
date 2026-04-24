export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorLog {
  id: string;
  timestamp: number;
  severity: ErrorSeverity;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  component?: string;
  userId?: string;
}

class ErrorLoggingService {
  private static instance: ErrorLoggingService;
  private errorLogs: ErrorLog[] = [];
  private maxLogs = 100; // Keep only last 100 errors in memory
  private isDevelopment = __DEV__;

  static getInstance(): ErrorLoggingService {
    if (!ErrorLoggingService.instance) {
      ErrorLoggingService.instance = new ErrorLoggingService();
    }
    return ErrorLoggingService.instance;
  }

  private constructor() {
    // Load persisted logs on init
    this.loadPersistedLogs();
  }

  /**
   * Log an error with optional context
   */
  logError(
    error: Error | string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: Record<string, any>,
    component?: string
  ): void {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      severity,
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
      component,
    };

    // Add to memory
    this.errorLogs.push(errorLog);
    
    // Trim if exceeding max
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs = this.errorLogs.slice(-this.maxLogs);
    }

    // Console log in development
    if (this.isDevelopment) {
      this.logToConsole(errorLog);
    }

    // Persist critical and high errors
    if (severity === ErrorSeverity.CRITICAL || severity === ErrorSeverity.HIGH) {
      this.persistError(errorLog);
    }
  }

  /**
   * Log an error from a React component
   */
  logComponentError(
    error: Error,
    errorInfo: React.ErrorInfo,
    component: string
  ): void {
    this.logError(
      error,
      ErrorSeverity.HIGH,
      {
        componentStack: errorInfo.componentStack,
      },
      component
    );
  }

  /**
   * Log a service error
   */
  logServiceError(
    serviceName: string,
    operation: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    this.logError(
      error,
      ErrorSeverity.MEDIUM,
      {
        service: serviceName,
        operation,
        ...context,
      },
      serviceName
    );
  }

  /**
   * Log a network error
   */
  logNetworkError(
    url: string,
    method: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    this.logError(
      error,
      ErrorSeverity.HIGH,
      {
        url,
        method,
        ...context,
      },
      'NetworkService'
    );
  }

  /**
   * Log a database error
   */
  logDatabaseError(
    operation: string,
    error: Error | string,
    context?: Record<string, any>
  ): void {
    this.logError(
      error,
      ErrorSeverity.CRITICAL,
      {
        operation,
        ...context,
      },
      'DatabaseService'
    );
  }

  /**
   * Get all error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Get error logs by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): ErrorLog[] {
    return this.errorLogs.filter((log) => log.severity === severity);
  }

  /**
   * Get error logs by component
   */
  getErrorsByComponent(component: string): ErrorLog[] {
    return this.errorLogs.filter((log) => log.component === component);
  }

  /**
   * Get recent errors (last N)
   */
  getRecentErrors(count: number = 10): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  /**
   * Clear all error logs
   */
  clearLogs(): void {
    this.errorLogs = [];
    this.clearPersistedLogs();
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.errorLogs.length,
      bySeverity: {} as Record<ErrorSeverity, number>,
      byComponent: {} as Record<string, number>,
    };

    // Initialize severity counts
    Object.values(ErrorSeverity).forEach((severity) => {
      stats.bySeverity[severity] = 0;
    });

    // Count by severity and component
    this.errorLogs.forEach((log) => {
      stats.bySeverity[log.severity]++;
      if (log.component) {
        stats.byComponent[log.component] = (stats.byComponent[log.component] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Export error logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.errorLogs, null, 2);
  }

  private logToConsole(errorLog: ErrorLog): void {
    const consoleMethod = this.getConsoleMethod(errorLog.severity);
    const prefix = `[${errorLog.severity.toUpperCase()}] ${errorLog.component || 'App'}:`;
    
    consoleMethod(
      prefix,
      errorLog.message,
      errorLog.context || '',
      errorLog.stack || ''
    );
  }

  private getConsoleMethod(severity: ErrorSeverity): (...args: any[]) => void {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.log;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private async persistError(errorLog: ErrorLog): Promise<void> {
    try {
      // In a real app, you might want to save to AsyncStorage or send to a crash reporting service
      // For now, we'll just keep it in memory since this is a privacy-focused app
      // If needed, you can add AsyncStorage persistence here
    } catch (error) {
      console.error('Failed to persist error log:', error);
    }
  }

  private async loadPersistedLogs(): Promise<void> {
    try {
      // Load from AsyncStorage if implemented
      // For now, this is a placeholder
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }

  private async clearPersistedLogs(): Promise<void> {
    try {
      // Clear from AsyncStorage if implemented
      // For now, this is a placeholder
    } catch (error) {
      console.error('Failed to clear persisted logs:', error);
    }
  }
}

export const errorLoggingService = ErrorLoggingService.getInstance();

/**
 * Convenience function to log errors
 */
export const logError = (
  error: Error | string,
  severity?: ErrorSeverity,
  context?: Record<string, any>,
  component?: string
): void => {
  errorLoggingService.logError(error, severity, context, component);
};

/**
 * Convenience function to log service errors
 */
export const logServiceError = (
  serviceName: string,
  operation: string,
  error: Error | string,
  context?: Record<string, any>
): void => {
  errorLoggingService.logServiceError(serviceName, operation, error, context);
};

/**
 * Convenience function to log database errors
 */
export const logDatabaseError = (
  operation: string,
  error: Error | string,
  context?: Record<string, any>
): void => {
  errorLoggingService.logDatabaseError(operation, error, context);
};

/**
 * Convenience function to log network errors
 */
export const logNetworkError = (
  url: string,
  method: string,
  error: Error | string,
  context?: Record<string, any>
): void => {
  errorLoggingService.logNetworkError(url, method, error, context);
};
