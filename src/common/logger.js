// TODO:
// 1. integrate with remote loggers/CloudWatch Metrics
// 2. Better formatting

// log to console, if given level is less than equal to environment log level
const LOG_TRACE=5;
const LOG_DEBUG=4;
const LOG_INFO=3;
const LOG_WARN=2;
const LOG_ERROR=1;
const LOG_DISABLED=0;

const logToConsole = (level, ...args) => {
    // default to logging errors only; 0 disables logging
    const ENV_LOG_LEVEL = process.env.LOG_LEVEL || LOG_DISABLED;

    if (level <= ENV_LOG_LEVEL) {
        switch (level) {
            case LOG_ERROR:
                console.log("ERROR: ", args);
                break;
            case LOG_WARN:
                console.log("WARNING: ", args);
                break;
            case LOG_INFO:
                console.log("INFO: ", args);
                break;
            case LOG_DEBUG:
                console.log("DEBUG: ", args);
                break;
            case LOG_TRACE:
                console.log("TRACE: ", args);
                break;
        }
        
    }
};

export const logInfo = (...args) => {
    logToConsole(LOG_INFO, args);
}

export const logWarn = (...args) => {
    logToConsole(LOG_WARN, args);
}

export const logError = (...args) => {
    logToConsole(LOG_ERROR, args);
}

export const logDebug = (...args) => {
    logToConsole(LOG_DEBUG, args);
}

export const logTrace = (...args) => {
    logToConsole(LOG_TRACE, args);
}