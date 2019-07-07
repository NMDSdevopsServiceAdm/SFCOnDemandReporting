'use strict';

import { getSlackWebHook } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';

export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];
  //initialiseSecrets(lambdaRegion);

  const webhook = getSlackWebHook();
  console.log("DEBUG slack webhook: ", webhook)

  logInfo("feedback handler OK");

  await slackInfo(`ASC WDS Feedback`);
  
  console.log("DEBUG event: ", event);

  // slackTrace(slackTitle, event);

  try {

  } catch (err) {
    // unable to get establishments
    logError(err);
    throw new Error('Feedback API - error');
  }

  return true;
};
