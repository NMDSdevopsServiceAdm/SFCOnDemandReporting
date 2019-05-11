const myReport = require('../../lib/hasher');

const body = '{ "password": "5uw8kHjS" }';

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

process.env.HASH_SALT = 'cfbf93ec-067d-40e1-b698-1267f5673713';
process.env.HASH_TARGET = 'aIqkkz9Q+wb1IF71wAOiqZxBY/oPwUxpe71k3+QnPCU=';
process.env.HASH_TARGET = 'IkzZK4oNWjrXjVmfuyd2ThnyH+UCLEestXiCSQ60zXM=';       // UCS2 (UTF-16) encoding hash

runHash();