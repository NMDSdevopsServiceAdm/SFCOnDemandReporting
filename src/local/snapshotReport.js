const myReport = require('../../lib/snapshotReport');

const runReport = async () => {
    try {
        console.log("About to call Snapshot Report handler");

        const returnVal = await myReport.handler(
            {},
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report' },
            (err, data) => {
                if (err) console.error(err);
                console.log("LOCAL: My results: ", data);
            }
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.LOG_LEVEL = 5;
process.env.SLACK_LEVEL = 0;
runReport();