/**
 * 📝 Sistema de Logging Unificado - DeckEngine V2
 */

const path = require("path");

class UnifiedLogger {
  constructor(outputs = ["console"]) {
    this.outputs = Array.isArray(outputs) ? outputs : [outputs];
    this.loggers = new Map();
    this.totalLogs = 0;
    this.logBuffer = [];
    this.maxBufferSize = 1000;

    // Inicializar loggers
    this.initializeLoggers();
  }

  initializeLoggers() {
    for (const output of this.outputs) {
      try {
        const logger = this.createLogger(output);
        this.loggers.set(output, logger);
        console.log(`📝 Logger ${output} initialized`);
      } catch (error) {
        console.error(
          `❌ Failed to initialize ${output} logger:`,
          error.message
        );
      }
    }
  }

  createLogger(outputType) {
    switch (outputType) {
      case "console":
        return new ConsoleLogger();
      case "file":
        return new FileLogger("./logs");
      case "markdown":
        return new MarkdownLogger("./logs");
      default:
        throw new Error(`Unknown logger type: ${outputType}`);
    }
  }

  log(level, message, data = {}) {
    const logEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      data: this.sanitizeData(data),
      source: "DeckEngine-V2",
    };

    this.addToBuffer(logEntry);
    this.totalLogs++;

    // Enviar para todos os loggers
    this.loggers.forEach((logger, outputType) => {
      try {
        logger.write(logEntry);
      } catch (error) {
        console.error(
          `❌ Error writing to ${outputType} logger:`,
          error.message
        );
      }
    });

    return logEntry;
  }

  info(message, data = {}) {
    return this.log("info", message, data);
  }

  error(message, data = {}) {
    return this.log("error", message, data);
  }

  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  getTotalLogs() {
    return this.totalLogs;
  }

  getOutputTypes() {
    return Array.from(this.loggers.keys());
  }

  generateLogId() {
    return `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeData(data) {
    const sensitiveKeys = ["password", "token", "secret", "key", "apiKey"];
    const sanitized = { ...data };

    for (const key of sensitiveKeys) {
      if (sanitized[key]) {
        sanitized[key] = "[REDACTED]";
      }
    }

    return sanitized;
  }
}

// Console Logger
class ConsoleLogger {
  write(logEntry) {
    const colors = {
      INFO: "\x1b[36m", // Cyan
      WARN: "\x1b[33m", // Yellow
      ERROR: "\x1b[31m", // Red
      DEBUG: "\x1b[90m", // Gray
      SUCCESS: "\x1b[32m", // Green
      RESET: "\x1b[0m",
    };

    const color = colors[logEntry.level] || colors.RESET;
    const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();

    console.log(
      `${color}[${timestamp}] ${logEntry.level}${colors.RESET} ${logEntry.message}`,
      Object.keys(logEntry.data).length > 0 ? logEntry.data : ""
    );
  }
}

// File Logger
class FileLogger {
  constructor(logDir = "./logs") {
    this.logDir = logDir;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const fs = require("fs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  write(logEntry) {
    const fs = require("fs");
    const logFile = path.join(
      this.logDir,
      `deck-engine-${new Date().toISOString().split("T")[0]}.log`
    );
    const logLine = `${logEntry.timestamp} [${logEntry.level}] ${
      logEntry.message
    } ${JSON.stringify(logEntry.data)}\n`;

    fs.appendFileSync(logFile, logLine);
  }
}

// Markdown Logger
class MarkdownLogger {
  constructor(logDir = "./logs") {
    this.logDir = logDir;
    this.ensureLogDir();
  }

  ensureLogDir() {
    const fs = require("fs");
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  write(logEntry) {
    const fs = require("fs");
    const logFile = path.join(
      this.logDir,
      `deck-engine-${new Date().toISOString().split("T")[0]}.md`
    );

    // Criar header se arquivo não existir
    if (!fs.existsSync(logFile)) {
      const header = `# DeckEngine V2 - Log ${new Date().toLocaleDateString()}\n\n`;
      fs.writeFileSync(logFile, header);
    }

    const emoji = this.getLevelEmoji(logEntry.level);
    const time = new Date(logEntry.timestamp).toLocaleTimeString();
    const logLine = `## ${emoji} ${time} - ${logEntry.level}\n\n**${
      logEntry.message
    }**\n\n${
      Object.keys(logEntry.data).length > 0
        ? "```json\n" + JSON.stringify(logEntry.data, null, 2) + "\n```\n\n"
        : ""
    }---\n\n`;

    fs.appendFileSync(logFile, logLine);
  }

  getLevelEmoji(level) {
    const emojis = {
      INFO: "📝",
      WARN: "⚠️",
      ERROR: "❌",
      DEBUG: "🔍",
      SUCCESS: "✅",
    };
    return emojis[level] || "📄";
  }
}

module.exports = UnifiedLogger;
