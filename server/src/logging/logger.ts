type LogMessage = string | Error;
/** should be Error, but catch is unknown, so unknown for conenience */
type LogObject = unknown;
interface LogFunction {
  (msg: LogMessage, err?: LogObject): void;
}
interface LoggerType {
  initialize: () => void;
  info: LogFunction;
  warn: LogFunction;
  error: LogFunction;
  debug: LogFunction;
}

type LogRecord = {
  level: string;
  time: number;
  msg: string;
  err?: {
    name: string;
    stack?: string;
    message?: string;
  };
};

const LOG_LEVELS = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
};

export class Logger implements LoggerType {
  private log: Console = console;
  private logLevel = LOG_LEVELS["info"];

  initialize() {
    const logLevel = process.env.LOG_LEVEL;
    switch (logLevel) {
      case "debug":
      case "info":
      case "warn":
      case "error":
        this.logLevel = LOG_LEVELS[logLevel];
    }
  }

  info(msg: LogMessage, err?: LogObject) {
    if (this.logLevel <= LOG_LEVELS.info) {
      this.log.log(createLogRecord("info", msg, err));
    }
  }

  warn(msg: LogMessage, err?: LogObject) {
    if (this.logLevel <= LOG_LEVELS.warn) {
      this.log.log(createLogRecord("warn", msg, err));
    }
  }

  error(msg: LogMessage, err?: LogObject) {
    if (this.logLevel <= LOG_LEVELS.error) {
      this.log.log(createLogRecord("error", msg, err));
    }
  }

  debug(msg: LogMessage, err?: LogObject) {
    if (this.logLevel <= LOG_LEVELS.debug) {
      this.log.log(createLogRecord("debug", msg, err));
    }
  }
}

const createLogRecord = (level: string, msg: LogMessage, err?: LogObject) => {
  const log: LogRecord = {
    level: level,
    time: new Date().valueOf(),
    msg: "",
  };
  try {
    if (msg instanceof Error) {
      log.msg = msg.message;
      log.err = { stack: msg.stack, name: msg.name };
    } else if (typeof msg === "string") {
      log.msg = msg;
    }
    if (err instanceof Error) {
      log.err = { stack: err.stack, name: err.name, message: err.message };
    }
  } catch (e) {
    log.msg = "failure while creating log record";
    if (e instanceof Error) {
      log.err = { name: e.name, message: e.message };
    }
  }
  return JSON.stringify(log);
};

const logger = new Logger();
export default logger;
