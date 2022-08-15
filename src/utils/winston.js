const winston = require("winston");

const logger = winston.createLogger({
    //consola
    level: "info",
    transports: [new winston.transports.Console({ level: "info" })],
});

const loggerWarn = winston.createLogger({
    //Log advertencias
    level: "warn",
    transports: [
        new winston.transports.Console({ level: "warn" }),
        new winston.transports.File({
            filename: "src/utils/winston_logs/warn.log",
            level: "warn",
        }),
    ],
});

const loggerError = winston.createLogger({
    //Archivo error
    level: "error",
    transports: [
        new winston.transports.Console({ level: "error" }),
        new winston.transports.File({
            filename: "src/utils/winston_logs/error.log",
            level: "error",
        }),
    ],
});

module.exports = {logger, loggerWarn, loggerError};