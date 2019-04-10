'use strict';

import assert from 'assert';
import { getSlackWebHookSecret } from '../aws/secrets';
import { allEstablishments, thisEstablishment } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, slackRequest, slackTrace, slackWarn, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { v4 as uuidv4 } from 'uuid';

const FETCH_ESTABLISHMENTS_API = false;
const ESTABLISHMENT_IDS = [30, 479, 63];

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);

  // slackTrace(slackTitle, event);

    let establishments = null;
    try {
      if (FETCH_ESTABLISHMENTS_API) {
        logInfo("Fetching list of estabishments by API")
        establishments = await allEstablishments();
        logInfo(slackTitle, "All establishments: ", establishments);
      } else {
        logInfo("Iterating list of estabishments by API: ", ESTABLISHMENT_IDS)
        //const thisEstablishment = await thisEstablishment(30, uuidv4());
        const allEstablishmentPromises = [];
        ESTABLISHMENT_IDS.forEach(async thisEstablishmentId => {
          const thisPromise = thisEstablishment(thisEstablishmentId, uuidv4());

          allEstablishmentPromises.push(thisPromise);
        });

        await Promise.all(allEstablishmentPromises)
          .then(allEstablishmentPromises => {
            allEstablishmentPromises.forEach(thisEstablishment => {
              logInfo(`Establishment: `, thisEstablishment);
            });
          });
      }

    } catch (err) {
      // unable to get establishments
      logError(err);
      slackError(slackTitle, 'Unable to get SfC Establishments', err);
      return 'Unable to get SfC Establishments';
    }

    if (establishments && ![200,201].includes(establishments.status)) {
      logError('Error returning from SfC API: ', establishments);
      slackError(slackError, 'Error returning from SfC API');
      return 'SfC API unavailable';
    }

    // get this far with success and a set of next arrivals
    if (establishments && establishments.establishments) {
      const responseMsg = `Successfully retrieved Establishments: #${establishments.count}`;
      logInfo(responseMsg);
      slackInfo(slackTitle, responseMsg);

      return 'Success';
    }

    return null;
};
