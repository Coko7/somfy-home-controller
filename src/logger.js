import { createLogger, format, transports } from 'winston';
import * as fs from 'fs';

const logsLocation = '../logs/';

if (!fs.existsSync(logsLocation)){
  fs.mkdirSync(logsLocation);
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`.
    // - Write all logs error (and below) to `error.log`.
    //
    new transports.File({
      filename: logsLocation + 'error.log',
      level: 'error',
    }),
    new transports.File({
      filename: logsLocation + 'combined.log',
    }),
  ],
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    })
  );
}

export default logger;