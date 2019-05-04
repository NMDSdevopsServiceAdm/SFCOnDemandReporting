'use strict';

import { allEstablishments, myServices,  myJobs, myEthnicities, myCountries, myNationality, myRecruitmentSources, myQualifications } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { initialiseSES, sendByEmail } from '../aws/ses';
import { initialiseS3, upload } from '../aws/s3';
import { dailySnapshotReportV1, dailySnapshotReportV2, dailySnapshotReportV3 } from '../reports/dailySnapshot';

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);
  await initialiseSES(lambdaRegion);
  await initialiseS3(lambdaRegion);

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

      const today = (new Date()).toISOString().slice(0,10).replace(/-/g,"");

      const EXPIRY_IN_HOURS=5;
      const establishmentUrl = await upload(`${today}-establishments.csv`, csv.establishmentsCsv, EXPIRY_IN_HOURS);
      const workerUrl = await upload(`${today}-workers.csv`, csv.workersCsv, EXPIRY_IN_HOURS);

      // send establishments by email
      const recipient = process.env.EMAIL_RECIPIENT;
      const htmlMessage = `<html><body>Today's Daily Snapshot Reports (${today}):<br/><ul><li><a href="${establishmentUrl}">Establishment</a></li><li><a href="${workerUrl}">Worker</a></ul></html>`;
      const plainMessage = '';
      await sendByEmail(recipient, 'Daily Snapshot Report', htmlMessage, plainMessage);

      await slackInfo(`Today's (${today}) Daily Snapshot Establishment Report: <${establishmentUrl}|establishments>`);
      await slackInfo(`Today's (${today}) Daily Snapshot Workers Report: <${workerUrl}|workers>`);
      
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

      return 'Success';
    }

    return null;
};
