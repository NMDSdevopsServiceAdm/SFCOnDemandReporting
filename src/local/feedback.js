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
          Signature: "p3/k4a7fWij9quk34LHdrCJDvZ9MQCe439FTJfAh2ZmbZ3S+q+SYIewB9tOQqtnS+7iMFlcigPnv6RrCkHMMlCwzSlo/yGdM+8IIi0KQKNoQbJ4BtG+87xdYEkT/ADxNgfAo5Vdyu0Vj504jvDgDIhrtOPD3a/IvqXg9IFrIlE5JQtoFBcLLIjt1nL35v7QPwZ09ooUtf2su7Z5wqQGtBiLnUqzDTvC17711fsAoK7WiO/g//MPjo9NENZe2uXrKVqlbDL76XnHk8kogjpz/PdMO1jCMxFitqy6H6HiBmMc2H8Zje9Bgj3CApslwEAIkFJxJ9uxvdd50+zxfUo9xlA==",
          SigningCertUrl: "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-6aad65c2f9911b05cd53efda11f913f9.pem",
          UnsubscribeUrl: "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:364648107127:feedback-dev:d2f08df8-506a-4543-971e-49c37ed0d56c",
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
process.env.SLACK_LEVEL = 3;
process.env.SLACK_URL = 'https://hooks.slack.com/services/TBC';
runFeedback();