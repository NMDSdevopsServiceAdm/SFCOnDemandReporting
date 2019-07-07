const myFeedback = require('../../lib/feedback');

const eventData = {};

const runFeedback = async () => {
    try {
        console.log("About to call registrations handler");

        const returnVal = await myFeedback.handler(
            eventData,
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-registration' }
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 5;
process.env.SLACK_LEVEL = 0;
runFeedback();