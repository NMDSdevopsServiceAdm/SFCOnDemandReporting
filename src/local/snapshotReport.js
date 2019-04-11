const myReport = require('../../lib/snapshotReport');

const runReport = async () => {
    try {
        const returnVal = await myReport.handler(
            {},
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report' },
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 3;
process.env.SLACK_LEVEL = 0;
process.env.SFC_HOST = 'localhost';
process.env.EMAIL_SENDER = 'warren.ayling@wozitech-ltd.co.uk';
process.env.EMAIL_RECIPIENT = 'warren.ayling@wozitech-ltd.co.uk';
runReport();