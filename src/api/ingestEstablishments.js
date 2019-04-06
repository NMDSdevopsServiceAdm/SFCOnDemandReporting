'use strict';

import assert from 'assert';
import { getSlackWebHookSecret } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, slackRequest, slackTrace, slackWarn, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';


export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];

  const slackTitle = 'SfC Establishment Pump';

  //initialiseSecrets(lambdaRegion);

  // slackTrace(slackTitle, event);

  let establishments = [];
  try {
    // by initiating lambda from a Kinesis Stream, the records are added to event
    event.Records.forEach(function(record) {
      // Kinesis data is base64 encoded so decode here
      const payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii');
      establishments.push(payload);
    });

    // do something with EstablishmentsStream
    logInfo(slackTitle, "All establishments: ", establishments.length);

  } catch (err) {
    // unable to get establishments
    logError(err);
    slackError(slackTitle, 'Unable to get SfC Establishments from kinesis stream', err);
    throw new Error('Unable to get SfC Establishments from kinesis stream');
  }

  const responseMsg = `Successfully retrieved Establishments: #${establishments.length}`;
  logInfo(responseMsg);
  slackInfo(slackTitle, responseMsg);

  return establishments;
};
