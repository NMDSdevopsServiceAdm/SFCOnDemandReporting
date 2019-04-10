const myReport = require('../../lib/snapshotReport');

const runReport = async () => {
    try {
        console.log("About to call Snapshot Report handler");

        const returnVal = await myReport.handler(
            {},
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report' },
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 5;
process.env.SLACK_LEVEL = 0;
//process.env.STORE = 'dev/ondemand/reporting'
process.env.SFC_HOST = 'localhost'
runReport();