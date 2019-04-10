// Slack is a great tool for comms. But not just between people. Applications can interact with Slack too.
// Slack application integration allows not just for messaging, but well formatted messaging
import util from 'util';
import axios from 'axios';
import FormData from 'form-data';
import dateFormat from 'dateformat';
import { logError, logWarn, logInfo, logTrace } from './logger';
import { getSlackWebHookSecret } from '../aws/secrets';

// log to console, if given level is less than equal to environment log level
const SLACK_TRACE=5;
const SLACK_DEBUG=4;
const SLACK_INFO=3;
const SLACK_WARN=2;
const SLACK_ERROR=1;
const SLACK_DISABLED=0;

// posts the given "Slack formatted" message to the known inbound we
const postToSlack = async (slackMsg) => {
    try {
        const slackWebhook = await getSlackWebHookSecret()
        const apiResponse = await axios.post(
            slackWebhook.webhook,
            slackMsg,       // the data
            {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
    } catch (err) {
        // silently discard errors
        logError("Failed to post to Slack: ", err);
    }
}

// check current Slack log level and only then, post to slack
const logToSlack = async (level, slackMsg) => {
    // default to logging errors only; 0 disables logging
    const ENV_LOG_LEVEL = process.env.SLACK_LEVEL || SLACK_DISABLED;

    if (level <= ENV_LOG_LEVEL) {
        await postToSlack(slackMsg);
    }
};

const formatArguments = (...theArgs) => {
    // if there is only one argument, retun that
    if (theArgs.length < 1 || theArgs[0].length < 1) {
        // we have no arguments
        return '';
    }

    if (theArgs[0].length == 1) {
        return '```' + util.inspect(theArgs[0][0], { depth: null}) + '```\n';;
    } else {
        return theArgs[0].reduce((previous, current) => {
            // if (typeof previous !== 'string') {
            //     // then the first argument was an object
            //     previous = '```' + util.inspect(previous, { depth: null}) + '```\n';
            // }

            // if (! previous.endsWith('\n')) {
            //     // then first argument was a string
            //     previous += '\n';
            // }
    
            if (typeof current === 'object') {
                previous += '```' + util.inspect(current, { depth: null}) + '```\n';
            } else {
                previous += current + '\n';
            }
    
            return previous;
        });
    }
};

// info is green
export const slackInfo = async (title, ...theArgs) => {
    // logInfo(...theArgs);
    await logToSlack(SLACK_INFO, {
        text: `INFO`,
        username: 'markdownbot',
        markdwn: true,
        attachments: [
            {
                color: 'good',
                title,
                text: theArgs
            }
        ]
    });
}

export const slackWarn = async (title, ...theArgs) => {
    // logWarn(...theArgs);
    await logToSlack(SLACK_WARN, {
        text: `WARNING`,
        username: 'markdownbot',
        markdwn: true,
        attachments: [
            {
                color: 'warning',
                title,
                text: formatArguments(theArgs)
            }
        ]
    });
}

export const slackError = async (title, ...theArgs) => {
    // logError(...theArgs);
    await logToSlack(SLACK_ERROR, {
        text: `ERROR`,
        username: 'markdownbot',
        markdwn: true,
        attachments: [
            {
                color: 'danger',
                title,
                text: formatArguments(theArgs)
            }
        ]
    });
}

export const slackTrace = async (title, ...theArgs) => {
    // logTrace(theArgs);
    await logToSlack(SLACK_TRACE, {
        text: `TRACE`,
        username: 'markdownbot',
        markdwn: true,
        attachments: [
            {
                color: '#777777',
                title,
                text: formatArguments(theArgs)
            }
        ]
    });
}

// posts the given text content as a file
//  - kinda works - it's missing scopes on the OAuth key
export const uploadToSlack = async (slackMsg) => {
    return;
    try {
        const now = new Date();
        const generatedFilename = dateFormat(now, 'yyyy-mm-dd-hh-MM').concat('-dailySnapshot.csv');
        
        const form = new FormData();
        form.append('token', 'oauth-token');
        form.append('channels', 'target-channel-id');
        form.append('content', slackMsg);
        form.append('filename', generatedFilename);
        form.append('title', 'Daily Snapshot Report');
        form.append('filetype', 'csv');
        const apiResponse = await axios.post('https://slack.com/api/files.upload', form, {
            headers: form.getHeaders()
        });

        console.log("WA DEBUG - upload to Slack response: ", apiResponse.data);

    } catch (err) {
        // silently discard errors
        logError("Failed to post to Slack: ", err);
    }
}