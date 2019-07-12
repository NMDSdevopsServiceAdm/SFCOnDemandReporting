const myRegistration = require('../../lib/registrations');

const eventData = {
    "Records": [
        {
            "EventSource": "aws:sns",
            "EventVersion": "1.0",
            "EventSubscriptionArn": "arn:aws:sns:eu-west-1:364648107127:registrations-dev:5164eb7e-c7ec-4428-8948-b055d12172ad",
            "Sns": {
                "Type": "Notification",
                "MessageId": "6da57893-8b76-5ecb-83e5-2d0f32604e08",
                "TopicArn": "arn:aws:sns:eu-west-1:364648107127:registrations-dev",
                "Subject": null,
                "Message": "{\"llocationId\":\"1-1001764472\",\"locationName\":\"Slack Lambda 2\",\"addressLine1\":\"88 Parsons Street\",\"addressLine2\":null,\"townCity\":\"London\",\"county\":\"London\",\"postalCode\":\"E1 7HW\",\"mainService\":\"Other adult day care services\",\"mainServiceOther\":\"The Best Service a Man Can Get\",\"isRegulated\":false,\"user\":{\"fullname\":\"Warren Ayling\",\"jobTitle\":\"Backend Dev\",\"emailAddress\":\"bob@bob.com\",\"contactNumber\":\"01111111111\",\"username\":\"aylingw-slack-lambda-2\"}}",
                "Timestamp": "2019-07-08T03:21:58.163Z",
                "SignatureVersion": "1",
                "MessageAttributes": {}
            }
        }
    ]
};

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
process.env.STORE = 'dev/ondemand/reporting';
runRegistration();