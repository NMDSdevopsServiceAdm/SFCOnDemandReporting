const myReport = require('../../lib/snapshotReport');

const runReport = async () => {
    try {
        const returnVal = await myReport.handler(
            {
                cssrId: 'W'
            },
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report' },
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 3;
process.env.SLACK_LEVEL = 3;
process.env.SFC_HOST = 'localhost';
process.env.ISS = 'localhost';
process.env.EMAIL_SENDER = 'warren.ayling@wozitech-ltd.co.uk';
process.env.EMAIL_RECIPIENT = 'warren.ayling@wozitech-ltd.co.uk';
process.env.DATA_VERSION = 7;
process.env.S3_REPORTS_BUCKET = 'sfc-reports-buckets-dev';
process.env.SLACK_URL = 'https://hooks.slack.com/services/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';

runReport();