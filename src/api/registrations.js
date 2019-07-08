'use strict';

import { getSlackWebHook } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackRegistration } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';

export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];
  //nitialiseSecrets(lambdaRegion);

  //await slackInfo(JSON.stringify(event));

  try {
    const message = event.Records && event.Records[0] ? JSON.parse(event.Records[0].Sns.Message) : null;
    console.log("WA DEBUG: event.Records[0].Sns.Message: ", message)
    if (message) {
      await slackRegistration(message);
    }

  } catch (err) {
    // unable to get establishments
    logError(err);
    throw new Error('Registrations API - error');
  }

  return true;
};
