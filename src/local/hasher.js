const myReport = require('../../lib/hasher');

const body = '{ "password": "password" }';

const runHash = async () => {
    try {
        const returnVal = await myReport.handler(
            {
                body
            },
            { invokedFunctionArn : 'arn:aws:lambda:eu-west-1:accountid:function:sfc-ondemand-reporting-snapshot-report' },
        );
        console.log("Handler returned: ", returnVal);
    } catch (err) {
        console.error("Caught local error: ", err);
    }
}

process.env.HASH_SALT = '952965cb-20af-40a9-9e30-d8180d619b43';
process.env.HASH_TARGET = 'aIqkkz9Q+wb1IF71wAOiqZxBY/oPwUxpe71k3+QnPCU=';
runHash();