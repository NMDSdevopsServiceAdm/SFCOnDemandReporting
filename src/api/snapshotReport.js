'use strict';

import { allEstablishments, myServices,  myJobs, myEthnicities, myCountries, myNationality, myRecruitmentSources, myQualifications } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { initialiseSES, sendByEmailWithAttachment } from '../aws/ses';
import { dailySnapshotReportV1, dailySnapshotReportV2, dailySnapshotReportV3 } from '../reports/dailySnapshot';

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);
  await initialiseSES(lambdaRegion);

  const lookups = {};

  // slackTrace(slackTitle, event);

    let establishments = null;
    try {
      let DataVersion = 'latest';
      if (process.env.DATA_VERSION) {
        DataVersion = parseInt(process.env.DATA_VERSION, 10);
      }

      logInfo('Fetching list of estabishments by API');
      establishments = await allEstablishments();

      logInfo('Fetching reference lookups');
      lookups.services = await myServices();
      lookups.jobs = await myJobs();
      lookups.ethnicities = await myEthnicities();
      lookups.countries = await myCountries();
      lookups.nationalities = await myNationality();
      lookups.recruitmentSources = await myRecruitmentSources();
      lookups.qualifications = await myQualifications();

      let csv = null;
      logInfo(`Running daily snapshot report V${DataVersion}`);
      switch (DataVersion) {
        case 2:
          csv = await dailySnapshotReportV2(establishments.establishments, lookups);
          break;

        case 3:
          csv = await dailySnapshotReportV3(establishments.establishments, lookups);
          break;

        default:
          csv = await dailySnapshotReportV2(establishments.establishments, lookups);
      }
      
      //console.log(csv);
      await uploadToSlack(csv);

      // send establishments by email
      const recipient = process.env.EMAIL_RECIPIENT;
      const attachments = [
        {
          content: csv.establishmentsCsv,
          filename: 'establishments.csv'
        },
        {
          content: csv.workersCsv,
          filename: 'workers.csv'
        }
      ];
      const sentEmailResponse =  await sendByEmailWithAttachment(recipient, 'Daily Snapshot Report', attachments);
      logInfo(`Establishments/Workers CSV length: ${csv.establishmentsCsv.length} bytes / ${csv.workersCsv.length}. ${sentEmailResponse}.`);

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
      const responseMsg = `Successfully processed Daily Snapshot Report`;
      logInfo(responseMsg);
      slackInfo(slackTitle, responseMsg);

      return 'Success';
    }

    return null;
};
