'use strict';

import { getSlackWebHook } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';

export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];
  //nitialiseSecrets(lambdaRegion);

  const webhook = getSlackWebHook();
  console.log("DEBUG slack webhook: ", webhook)

  logInfo("registrations handler OK");

  await slackInfo(`ASC WDS Registration`);

  // slackTrace(slackTitle, event);

  try {

  } catch (err) {
    // unable to get establishments
    logError(err);
    throw new Error('Registrations API - error');
  }

  return true;
};
