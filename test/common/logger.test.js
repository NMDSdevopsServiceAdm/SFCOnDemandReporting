import { logError, logWarn, logInfo, logDebug, logTrace } from '../../src/common/logger';

global.console = {
    error: jest.fn(),
    warn: jest.fn(),
    log: jest.fn()
}

const logToAll = () => {
    logError("My Error");
    logWarn("My Warning");
    logInfo("My Info");
    logDebug("My Debug");
    logTrace("My Trace");
};

describe('Each level of logging', async () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log nothing with logging is disabled - first, log level undefined', async () => {
        delete process.env.LOG_LEVEL;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(0);
    });
    it ('should log nothing with logging is disabled - first, log level defined as disabled', async () => {
        process.env.LOG_LEVEL=0;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(0);
    });

    it ('should log only errors', async () => {
        process.env.LOG_LEVEL=1;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(1);
    });

    it ('should log up to warnings only', async () => {
        process.env.LOG_LEVEL=2;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(2);
    });
    it ('should log up to info only', async () => {
        process.env.LOG_LEVEL=3;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(3);
    });
    it ('should log up to debug only', async () => {
        process.env.LOG_LEVEL=4;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(4);
    });
    it ('should log all', async () => {
        process.env.LOG_LEVEL=5;
        logToAll();
        expect(global.console.log).toHaveBeenCalledTimes(5);
    });

});