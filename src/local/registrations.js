const myRegistration = require('../../lib/registrations');

const eventData = {};

const runRegistration = async () => {
    try {
        console.log("About to call registrations handler");

        const returnVal = await myRegistration.handler(
            eventData,
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-registration' }
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 5;
process.env.SLACK_LEVEL = 3;
process.env.SLACK_URL = 'https://hooks.slack.com/services/TBC';
runRegistration();