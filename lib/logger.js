'use-strict';

var winston = require('winston');

module.exports = makeLogger();

function makeLogger(){

  winston.addColors({
    debug: 'green',
    info: 'cyan',
    silly: 'purple',
    trace: 'magenta',
    verbose: 'magenta',
    warn: 'yellow',
    warning: 'yellow',
    error: 'red'
  });

  var logger = new winston.Logger({
    transports: [
      new(winston.transports.Console)({
        level: 'silly',
        handleExceptions: true,
        prettyPrint: true,
        silent: false,
        timestamp: true,
        colorize: true,
        json: false
      })
    ],
    exceptionHandlers: [
      new(winston.transports.Console)({
        level: 'warn',
        handleExceptions: true,
        prettyPrint: true,
        silent: false,
        timestamp: true,
        colorize: true,
        json: false
      })
    ]
  });
  logger.setLevels({
    silly: 0,
    debug: 1,
    verbose: 2,
    trace : 2,
    info: 3,
    warn: 4,
    warning: 4,
    error: 5
  });

  return logger;
}
