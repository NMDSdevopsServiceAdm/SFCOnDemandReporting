'use strict';

import { allEstablishments, myServices,  myJobs, myEthnicities, myCountries, myNationality, myRecruitmentSources, myQualifications } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { initialiseSES, sendByEmail } from '../aws/ses';
import { initialiseS3, upload } from '../aws/s3';
import { separateEstablishments, separateWorkers, dailySnapshotReportV5, dailySnapshotReportV6, dailySnapshotReportV7 } from '../reports/dailySnapshot';
import { resolveAllPostcodes } from '../model/postcode.api';
import { findPostcode } from '../utils/findBy';

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);
  await initialiseSES(lambdaRegion);
  await initialiseS3(lambdaRegion);

  const lookups = {};

  const cssrId = event.cssrId;

  let allEstablishmentsAndWorkersResponse = null;
  try {
    let DataVersion = 'latest';
    if (process.env.DATA_VERSION) {
      DataVersion = parseInt(process.env.DATA_VERSION, 10);
    }

    logInfo('Fetching list of estabishments by API');
    allEstablishmentsAndWorkersResponse = await allEstablishments(cssrId);

    if (allEstablishmentsAndWorkersResponse.workers && Array.isArray(allEstablishmentsAndWorkersResponse.workers)) {

      logInfo('Fetching reference lookups');
      lookups.services = await myServices();
      lookups.jobs = await myJobs();
      lookups.ethnicities = await myEthnicities();
      lookups.countries = await myCountries();
      lookups.nationalities = await myNationality();
      lookups.recruitmentSources = await myRecruitmentSources();
      lookups.qualifications = await myQualifications();

      // now separate the establishments from all the workers
      allEstablishmentsAndWorkersResponse.establishments = separateEstablishments(allEstablishmentsAndWorkersResponse.workers, lookups.services);
      allEstablishmentsAndWorkersResponse.workers = separateWorkers(allEstablishmentsAndWorkersResponse.workers);

      /* disable northings & eastings mapping - unethical to do this on 660k records!
      // now update all the Establishments with norhtings/eastings and latitude/longitude
      const allPostcodesToLookup = {};
      allEstablishmentsAndWorkersResponse.establishments.forEach(thisEstablishment => {
        allPostcodesToLookup[thisEstablishment.PostCode] =true;
      });
      const referencePostcodes = Object.keys(allPostcodesToLookup);

      // can only lookup 100 postcodes at a time - so break into batches of 90
      const batchSize=90;
      let resolvedPostcodes = [];
      for (let thisIteration = 0, totalCount=referencePostcodes.length; thisIteration < totalCount; thisIteration=thisIteration+batchSize) {
        const thisBatchPostcodes = referencePostcodes.slice(thisIteration, (thisIteration+batchSize) > totalCount ? totalCount : (thisIteration+batchSize));

        const thesePostcodes = await resolveAllPostcodes(thisBatchPostcodes);
        resolvedPostcodes = resolvedPostcodes.concat(thesePostcodes.postcodes);
      }

      allEstablishmentsAndWorkersResponse.establishments = allEstablishmentsAndWorkersResponse.establishments.map(thisEstablishment => {
        const lookedUpPostcode = findPostcode(resolvedPostcodes, thisEstablishment.PostCode);
        if (lookedUpPostcode) {
          if (lookedUpPostcode.result) {
              thisEstablishment.Eastings = lookedUpPostcode.result.eastings;
              thisEstablishment.Northings = lookedUpPostcode.result.northings;
              thisEstablishment.Longitude = lookedUpPostcode.result.longitude;
              thisEstablishment.Latitude = lookedUpPostcode.result.latitude;
          }
        }

        return thisEstablishment;
      });
      */

      let csv = null;
      logInfo(`Running daily snapshot report V${DataVersion}`);
      switch (DataVersion) {
        case 5:   // main service capcity/utilisatoin
          csv = await dailySnapshotReportV5(allEstablishmentsAndWorkersResponse.establishments,
                                            allEstablishmentsAndWorkersResponse.workers,
                                            lookups);
          break;

        case 6: // bulk upload Establishment and Worker data source
          csv = await dailySnapshotReportV6(allEstablishmentsAndWorkersResponse.establishments,
                                            allEstablishmentsAndWorkersResponse.workers,
                                            lookups);
          break;

        case 7: // Address split to Address1, ProvID, LocationID, Registered Nurse and Nurse Specialism
          csv = await dailySnapshotReportV7(allEstablishmentsAndWorkersResponse.establishments,
                                            allEstablishmentsAndWorkersResponse.workers,
                                            lookups);
          break;

        default:
          csv = await dailySnapshotReportV5(allEstablishmentsAndWorkersResponse.establishments,
                                            allEstablishmentsAndWorkersResponse.workers,
                                            lookups);

      }
      
      //console.log(csv);
      const today = (new Date()).toISOString().slice(0,10).replace(/-/g,"");

      if (cssrId) {
        const EXPIRY_IN_HOURS=5;
        const establishmentUrl = await upload(`${today}-${cssrId}-establishments.csv`, csv.establishmentsCsv, EXPIRY_IN_HOURS);
        const workerUrl = await upload(`${today}-${cssrId}-workers.csv`, csv.workersCsv, EXPIRY_IN_HOURS);
  
        // send establishments by email
        const recipient = process.env.EMAIL_RECIPIENT;
        const htmlMessage = `<html><body>Today's Daily Snapshot Reports (${today}) for CSSR '${cssrId}':<br/><ul><li><a href="${establishmentUrl}">Establishment</a></li><li><a href="${workerUrl}">Worker</a></ul></html>`;
        const plainMessage = '';
        await sendByEmail(recipient, `Daily Snapshot Report (CSSR:${cssrId})`, htmlMessage, plainMessage);
  
        await slackInfo(`Today's (${today}) Daily Snapshot Establishment Report for CSSR (${cssrId}): <${establishmentUrl}|establishments>`);
        await slackInfo(`Today's (${today}) Daily Snapshot Workers Report for CSSR (${cssrId}): <${workerUrl}|workers>`);

      } else {
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
      }

    } else {
      logError("Failed to get daily snapshot data.")
    }
    
  } catch (err) {
    // unable to get establishments
    logError(err);
    slackError(slackTitle, 'Unable to get SfC Establishments', err);
    return 'Unable to get SfC Establishments';
  }

  if (allEstablishmentsAndWorkersResponse && ![200,201].includes(allEstablishmentsAndWorkersResponse.status)) {
    logError('Error returning from SfC API: ', allEstablishmentsAndWorkersResponse);
    return 'SfC API unavailable';
  }

  // get this far with success and a set of next arrivals
  if (allEstablishmentsAndWorkersResponse && allEstablishmentsAndWorkersResponse.establishments) {
    const responseMsg = `Successfully processed Daily Snapshot Report`;
    logInfo(responseMsg);

    return 'Success';
  }

  return null;
};
