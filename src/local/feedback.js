const myFeedback = require('../../lib/feedback');

const eventData = {
    Records: [
      {
        EventSource: "aws:sns",
        EventVersion: "1.0",
        EventSubscriptionArn: "arn:aws:sns:eu-west-1:364648107127:feedback-dev:d2f08df8-506a-4543-971e-49c37ed0d56c",
        Sns: {
          Type: "Notification",
          MessageId: "122cfbf7-2059-5b50-b07e-ae6ca3d3cf90",
          TopicArn: "arn:aws:sns:eu-west-1:364648107127:feedback-dev",
          Subject: null,
          Message: "{\"doingWhat\":\"saying hello\",\"tellUs\":\"this is fabulous\",\"name\":\"Warren Ayling\",\"email\":\"warren.ayling@ext.soprasteria.com\"}",
          Timestamp: "2019-07-07T05:21:14.508Z",
          SignatureVersion: "1",
          MessageAttributes: {}
        }
      }
    ]
  };

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
process.env.STORE = 'dev/ondemand/reporting';
runFeedback();