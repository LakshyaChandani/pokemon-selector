export class ErrorHandler {
  constructor(options = {}) {
    this.options = {
      logToConsole: options.logToConsole !== false,
      showUserMessage: options.showUserMessage !== false,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      ...options,
    };

    this.errorLog = [];
    this.listeners = new Map();
  }

  // Wrap async functions with error handling
  static async wrap(promise, options = {}) {
    const {
      fallback = null,
      retries = 0,
      retryDelay = 1000,
      onError = null,
    } = options;

    try {
      return await promise;
    } catch (error) {
      if (onError) {
        onError(error);
      }

      // Retry logic
      if (retries > 0) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.wrap(promise, { ...options, retries: retries - 1 });
      }

      // Log error
      this.logError(error);

      return fallback;
    }
  }

  // Retry wrapper with exponential backoff
  async retry(fn, options = {}) {
    const {
      attempts = this.options.retryAttempts,
      delay = this.options.retryDelay,
      backoff = 2,
      maxDelay = 30000,
    } = options;

    let lastError;

    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (i < attempts - 1) {
          const waitTime = Math.min(delay * Math.pow(backoff, i), maxDelay);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }

  // Log errors with context
  logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errorLog.push(errorEntry);

    if (this.options.logToConsole) {
      console.error("Error logged:", errorEntry);
    }

    // Send to analytics if available
    if (window.gtag) {
      gtag("event", "exception", {
        description: error.message,
        fatal: false,
        error_type: error.name,
        ...context,
      });
    }

    // Trigger error listeners
    this.notifyListeners("error", errorEntry);

    // Keep error log size manageable
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }
  }

  // Subscribe to error events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  notifyListeners(event, data) {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach((callback) => callback(data));
  }

  // Get error report
  getErrorReport() {
    return {
      errors: this.errorLog,
      summary: {
        total: this.errorLog.length,
        byType: this.errorLog.reduce((acc, error) => {
          const type = error.context.type || "unknown";
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
      },
    };
  }
  // In errorHandler.js, add a method:
  getUserFriendlyMessage(error) {
    const messages = {
      NetworkError: "Unable to connect. Please check your internet connection.",
      NotFoundError: "Pokémon not found. Please try another.",
      TimeoutError: "Request timed out. Please try again.",
      APIError: "Server error. Please try again later.",
    };

    return (
      messages[error.name] || error.message || "An unexpected error occurred."
    );
  }

  // Clear error log
  clearLog() {
    this.errorLog = [];
  }
}

// Specific error types
export class APIError extends Error {
  constructor(message, status, endpoint) {
    super(message);
    this.name = "APIError";
    this.status = status;
    this.endpoint = endpoint;
  }
}

export class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = "ValidationError";
    this.field = field;
  }
}

// Error boundary for UI components
export class ErrorBoundary {
  constructor(container, fallbackUI) {
    this.container = container;
    this.fallbackUI = fallbackUI;
    this.originalContent = null;
  }

  wrap(fn) {
    try {
      return fn();
    } catch (error) {
      this.handleError(error);
    }
  }

  async wrapAsync(fn) {
    try {
      return await fn();
    } catch (error) {
      this.handleError(error);
    }
  }

  handleError(error) {
    console.error("Error in component:", error);

    // Save original content
    if (!this.originalContent) {
      this.originalContent = this.container.innerHTML;
    }

    // Show fallback UI
    this.container.innerHTML =
      this.fallbackUI ||
      `
      <div class="error-boundary">
        <h3>Something went wrong</h3>
        <p>We're sorry, but something went wrong. Please try refreshing the page.</p>
        <button onclick="location.reload()">Refresh Page</button>
      </div>
    `;
  }

  recover() {
    if (this.originalContent) {
      this.container.innerHTML = this.originalContent;
      this.originalContent = null;
    }
  }
}
