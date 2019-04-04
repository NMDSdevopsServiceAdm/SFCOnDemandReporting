'use strict';

import assert from 'assert';
import { getSlackWebHookSecret } from '../aws/secrets';
import { allEstablishments } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, slackRequest, slackTrace, slackWarn, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';


export const handler = async (event, context, callback) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  initialiseSecrets(lambdaRegion);

  // slackTrace(slackTitle, event);

    let establishments = null;
    try {
      establishments = await allEstablishments();
      logInfo(slackTitle, "All establishments: ", establishments);

    } catch (err) {
      // unable to get establishments
      logError(err);
      slackError(slackTitle, 'Unable to get SfC Establishments', err);
      return callback(null, 'Unable to get SfC Establishments');
    }

    if (! [200,201].includes(establishments.status)) {
      logError('Error returning from SfC API: ', establishments);
      slackError(slackError, 'Error returning from SfC API');
      return callback(null, 'SfC API unavailable');
    }

    // get this far with success and a set of next arrivals
    if (establishments.establishments) {
      const responseMsg = `Successfully retrieved Establishments: #${establishments.count}`;
      logInfo(responseMsg);
      slackInfo(slackTitle, responseMsg);

      return callback(null, 'Success');
    }

    // gets here without a callback - that is bad
    assert.fail();
};
