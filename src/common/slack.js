// Slack is a great tool for comms. But not just between people. Applications can interact with Slack too.
// Slack application integration allows not just for messaging, but well formatted messaging
import util from 'util';
import uuid from 'uuid';
import axios from 'axios';
import FormData from 'form-data';
import dateFormat from 'dateformat';
import { logError, logWarn, logInfo, logTrace } from './logger';
import { getSlackWebHook, getRegistrationSlackWebHook, getFeebdackSlackWebHook } from '../aws/secrets';

// log to console, if given level is less than equal to environment log level
const SLACK_TRACE=5;
const SLACK_DEBUG=4;
const SLACK_INFO=3;
const SLACK_WARN=2;
const SLACK_ERROR=1;
const SLACK_DISABLED=0;

// posts the given "Slack formatted" message to the known inbound we
const postToSlack = async (webhook, slackMsg) => {
    try {
        
        const apiResponse = await axios.post(
            webhook,
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
        const slackWebhook = getSlackWebHook();
        await postToSlack(slackWebhook, slackMsg);
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

export const slackFeedback = async (message) => {
    try {
        const slackWebhook = getRegistrationSlackWebHook();
        await postToSlack(slackWebhook, {
            text: `FEEDBACK`,
            username: 'markdownbot',
            markdwn: true,
            attachments: [
                {
                    color: '#777777',
                    fields: [
                        {
                            "title": "name",
                            "value": message.name,
                            "short": true
                        },
                        {
                            "title": "email",
                            "value": message.email,
                            "short": false
                        },
                        {
                            "title": "What",
                            "value": message.doingWhat,
                            "short": false
                        },
                        {
                          "title": "Say",
                          "value": message.tellUs,
                          "short": false
                        },
                    ],                   
                }
            ]
        });
    } catch (err) {
        console.error(err);
    }
};


export const slackRegistration = async (message) => {
    try {
        const slackWebhook = getRegistrationSlackWebHook();
        await postToSlack(slackWebhook, {
            username: 'markdownbot',
            text: `REGISTRATION for approval`,
            attachments: [
              {
                color: "good",
                title: `Establishment = "${message.locationName}"`,
                title_link: "https://sfcdev.cloudapps.digital/workplace/7r537t584748",
                fields: [
                    {
                        title: "Location ID",
                        value: message.isRegulated ? message.llocationId : 'non CQC',
                        short: true
                    },
                    {
                        title: "Postcode",
                        value: message.postalCode,
                        short: true
                    },
                    {
                        title: "Address",
                        value: [message.addressLine1, message.addressLine2, message.townCity, message.county].filter(x => x !== null).join(','),
                        short: false
                    },
                    {
                        title: "Main Service",
                        value: message.mainServiceOther ? message.mainServiceOther : message.mainService,
                        short: true
                    },
                ],
              },
              {
                color: "good",
                text: message.locationName,
                title: `User -  "${message.user.fullname}"`,
                fields: [
                    {
                        title: "Phone",
                        value: message.user.contactNumber,
                        short: true
                    },
                    {
                        title: "Username",
                        value: message.user.username,
                        short: false
                    },
                    {
                        title: "Email",
                        value: message.user.emailAddress,
                        short: false
                    },
                    {
                        title: "Job Title",
                        value: message.user.jobTitle,
                        short: true
                    },
                ],
              },
              {
                color: "warning",
                title: "1. Have Not and Want Not",
                title_link: "https://sfcdev.cloudapps.digital/workplace/89248593585648",
                // text: "Approved by aylingw",
                fields: [
                    {
                        title: "NMDS ID",
                        value: "H838598",
                        short: true
                    },
                    {
                      title: "Postcode",
                      value: "SE19 3SS",
                      short: true
                    }
                ],
              },
              {
                color: "warning",
                title: "2. Them and Us",
                title_link: "https://sfcdev.cloudapps.digital/workplace/854e864893483",
                // text: "Approved by aylingw",
                fields: [
                    {
                        title: "NMDS ID",
                        value: "C088958",
                        short: true
                    },
                    {
                      title: "Postcode",
                      value: "HS6 7SS",
                      short: true
                    }
                ],
              },
              {
                text: uuid.v4(),
                fallback: "You are unable to approve/reject",
                callback_id: "registration",
                color: "danger",
                attachment_type: "default",
                actions: [
                  {
                    name: "status",
                    text: "Accept",
                    type: "button",
                    value: "accept",
                    style: "primary",
                  },
                  {
                      name: "status",
                      text: "Reject",
                      type: "select",
                      options: [
                        {
                            "text": "Duplicate",
                            "value": "Duplicated",
                        },
                        {
                            "text": "Poppicot",
                            "value": "Pure Poppicott",
                        }
                      ],
                      confirm: {
                        title: "Are you sure?",
                        text: "Confirm to reject this registration?",
                        ok_text: "Yes",
                        dismiss_text: "No"
                      },
                  }
                ]
              },
            ]
          });
    } catch (err) {
        console.error(err);
    }
};