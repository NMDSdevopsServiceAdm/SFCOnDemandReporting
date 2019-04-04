import * as MySecrets from '../../src/aws/secrets';
import { slackInfo, slackTrace, slackWarn, slackError, slackRequest } from '../../src/common/slack';
import * as MyLogger from '../../src/common/logger';
import axios from 'axios';


// add mocks
jest.mock('axios');
axios.post.mockResolvedValue({
    status: 201
});

const getSlackWebHookSecretMock = jest.fn();
MySecrets.getSlackWebHookSecret = getSlackWebHookSecretMock;
getSlackWebHookSecretMock.mockImplementation(() => {
    return Promise.resolve({
        webhook: 'https://my.webhook.slack.com'
    });
});

const logErrorMock = jest.fn();
MyLogger.logError = jest.fn();

const slackToAll = async () => {
    await slackRequest("My request", { one: true }, { two: false});
    await slackError("My Error", "one", { two: false});
    await slackWarn("My Warning", "one");
    await slackInfo("My Info", "one", { two: false}, "three");
    await slackTrace("My Trace", "one", "two");
};
 
describe('Slack logging error checks', async () => {
    beforeAll(() => {
        process.env.LOG_LEVEL=1;    // this is to force the writing of logError
        process.env.SLACK_LEVEL=1;
        process.env.SLACK_WEBHOOK='MY_SLACK_KEY';
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should handle silently any error associated with getting the Slack webhook from Secrets Manager', async () => {
        getSlackWebHookSecretMock.mockImplementationOnce(() => {
            return Promise.reject(new Error('oops Slack webhook failed'));
        });

        await slackError("My Secrets Error Test");

        expect(axios.post).not.toHaveBeenCalled();
        expect(MyLogger.logError).toHaveBeenCalledTimes(1);
        expect(MyLogger.logError).toHaveBeenCalledWith("Failed to post to Slack: ", new Error('oops Slack webhook failed'));
    });

    it ('should handle silently any error associated with calling upon the Slack API', async () => {

        axios.post.mockRejectedValueOnce(new Error('oops Axios.post failed'));

        await slackError("My Slack API error test");
        expect(axios.post).toHaveBeenCalledTimes(1);
        expect(MyLogger.logError).toHaveBeenCalledTimes(1);
        expect(MyLogger.logError).toHaveBeenCalledWith("Failed to post to Slack: ", new Error('oops Axios.post failed'));
    });
});

describe('Disabled slack logging', () => {
    beforeAll(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log nothing with logging is disabled - first, log level undefined', async () => {
        delete process.env.SLACK_LEVEL;
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(0);
    });
    it ('should log nothing with logging is disabled - first, log level defined as disabled', async () => {
        process.env.SLACK_LEVEL=0;
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(0);
    });
});

describe('Errors only', () => {
    beforeAll(() => {
        process.env.SLACK_LEVEL=1;
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log only errors', async () => {
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
    it ('should log up to error only, with just title, no args', async () => {
        await slackError("just title");
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
});

describe('Warnings only', () => {
    beforeAll(() => {
        process.env.SLACK_LEVEL=2;
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log up to warnings only', async () => {
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(2);
    });
    it ('should log up to warnings only, with just title, no args', async () => {
        await slackWarn("just title");
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
});

describe('Info only', async () => {
    beforeAll(() => {
        process.env.SLACK_LEVEL=3;
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log up to info only', async () => {
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(4);
    });
    it ('should log up to info only, with just title, no args', async () => {
        await slackInfo("just title");
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
});

describe('Debug only', () => {
    beforeAll(() => {
        process.env.SLACK_LEVEL=4;
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log up to debug', async () => {
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(4);
    });
    // Note - no SlackDebug to test
});

describe('Trace (ALL)', () => {
    beforeAll(() => {
        process.env.SLACK_LEVEL=5;
        jest.clearAllMocks();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    it ('should log all', async () => {
        await slackToAll();
        expect(axios.post).toHaveBeenCalledTimes(5);
    });
    it ('should log up to trace, with just title, no args', async () => {
        await slackTrace("just title");
        expect(axios.post).toHaveBeenCalledTimes(1);
    });
});
