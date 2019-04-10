'use strict';

import { allEstablishments, thisEstablishment } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { initialiseSES, sendByEmail } from '../aws/ses';
import { dailySnapshotReportV1, dailySnapshotReportV2 } from '../reports/dailySnapshot';

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);
  await initialiseSES(lambdaRegion);

  // slackTrace(slackTitle, event);

    let establishments = null;
    try {
        logInfo("Fetching list of estabishments by API")
        establishments = await allEstablishments();

        let DataVersion = 'latest';
        if (process.env.DATA_VERSION) {
          DataVersion = parseInt(process.env.DATA_VERSION, 10);
        }
        
        let csv = null
        switch (DataVersion) {
          case 1: 
            csv = await dailySnapshotReportV1(establishments.establishments);
            break;

          default:
            csv = await dailySnapshotReportV2(establishments.establishments);
        }
        
        //console.log(csv);
        await uploadToSlack(csv);

        // send by email
        const recipient = process.env.EMAIL_RECIPIENT;
        const htmlMessage = `<pre>${csv.replace(/^(\s*\r\n){2,}/gm, '\r\n')}</pre>`;
        const plainMessage = csv;
        await sendByEmail(recipient, 'Daily Snapshot Report', htmlMessage, plainMessage);

        logInfo(`CSV length: ${csv.length} bytes`);

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
      const responseMsg = `Successfully retrieved Establishments: #${establishments.establishments.count}`;
      logInfo(responseMsg);
      slackInfo(slackTitle, responseMsg);

      return 'Success';
    }

    return null;
};
