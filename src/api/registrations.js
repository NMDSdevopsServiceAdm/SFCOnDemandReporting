'use strict';

import { getSlackWebHookSecret } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { initialiseSecrets } from '../aws/secrets';

export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];
  //nitialiseSecrets(lambdaRegion);

  const slackTitle = 'SfC Establishment Pump';
  
  logInfo("registrations handler OK");

  // slackTrace(slackTitle, event);

  try {

  } catch (err) {
    // unable to get establishments
    logError(err);
    throw new Error('Registrations API - error');
  }

  return true;
};
