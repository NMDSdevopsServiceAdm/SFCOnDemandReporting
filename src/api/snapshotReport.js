'use strict';

import { allEstablishments, myServices,  myJobs, myEthnicities, myCountries, myNationality, myRecruitmentSources, myQualifications } from '../model/sfc.api';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { slackInfo, uploadToSlack, slackError } from '../common/slack';
import { initialiseSecrets } from '../aws/secrets';
import { initialiseSES, sendByEmail } from '../aws/ses';
import { initialiseS3, upload } from '../aws/s3';
import { separateEstablishments, separateWorkers, dailySnapshotReportV5, dailySnapshotReportV6 } from '../reports/dailySnapshot';
import { resolveAllPostcodes } from '../model/postcode.api';
import { findPostcode } from '../utils/findBy';
import { login as strapi_login, establishments as strapi_establishments, users as strapi_users } from '../model/strapi';

/* export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);
  await initialiseSES(lambdaRegion);
  await initialiseS3(lambdaRegion);

  const lookups = {};

  // slackTrace(slackTitle, event);

    let allEstablishmentsAndWorkersResponse = null;
    try {
      let DataVersion = 'latest';
      if (process.env.DATA_VERSION) {
        DataVersion = parseInt(process.env.DATA_VERSION, 10);
      }

      logInfo('Fetching list of estabishments by API');
      allEstablishmentsAndWorkersResponse = await allEstablishments();

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

        default:
          csv = await dailySnapshotReportV5(allEstablishmentsAndWorkersResponse.establishments,
                                            allEstablishmentsAndWorkersResponse.workers,
                                            lookups);

      }
      
      //console.log(csv);
      await uploadToSlack(csv);

      const today = (new Date()).toISOString().slice(0,10).replace(/-/g,"");

      const EXPIRY_IN_HOURS=5;
      const establishmentUrl = await upload(`${today}-establishments.csv`, csv.establishmentsCsv, EXPIRY_IN_HOURS);
      const workerUrl = await upload(`${today}-workers.csv`, csv.workersCsv, EXPIRY_IN_HOURS);


      // upload the reference set of establishments/workers - used for reporting dashboard
      await upload('dashboard/establishments.csv', csv.establishmentsCsv, 0);
      await upload('dashboard/workers.csv', csv.workersCsv, 0);

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

    if (allEstablishmentsAndWorkersResponse && ![200,201].includes(allEstablishmentsAndWorkersResponse.status)) {
      logError('Error returning from SfC API: ', allEstablishmentsAndWorkersResponse);
      slackError(slackError, 'Error returning from SfC API');
      return 'SfC API unavailable';
    }

    // get this far with success and a set of next arrivals
    if (allEstablishmentsAndWorkersResponse && allEstablishmentsAndWorkersResponse.establishments) {
      const responseMsg = `Successfully processed Daily Snapshot Report`;
      logInfo(responseMsg);

      return 'Success';
    }

    return null;
}; */

export const handler = async (event, context, callback) => {
  const arnList = (context.invokedFunctionArn).split(":");
  const lambdaRegion = arnList[3];

  const slackTitle = 'SfC Snapshot Report';

  await initialiseSecrets(lambdaRegion);

  const lookups = {};

  // slackTrace(slackTitle, event);

    let allEstablishmentsAndWorkersResponse = null;
    try {
      let DataVersion = 'latest';
      if (process.env.DATA_VERSION) {
        DataVersion = parseInt(process.env.DATA_VERSION, 10);
      }

      const strAPiLogin = await strapi_login();
      console.log("WA DEBUG - strapi returned with: ", strAPiLogin)
      if (!strAPiLogin) {
        return false;
      }

      logInfo('Fetching list of estabishments by API');
      allEstablishmentsAndWorkersResponse = await allEstablishments();

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

      // strapi populate
      if (strAPiLogin) {
        await strapi_establishments(allEstablishmentsAndWorkersResponse.establishments, 'local');
        //const myUsers = await allUsers();
        //await strapi_users(myUsers.users);
      }
     
    } catch (err) {
      // unable to get establishments
      logError(err);
      slackError(slackTitle, 'Unable to get SfC Establishments', err);
      return 'Unable to get SfC Establishments';
    }

    if (allEstablishmentsAndWorkersResponse && ![200,201].includes(allEstablishmentsAndWorkersResponse.status)) {
      logError('Error returning from SfC API: ', allEstablishmentsAndWorkersResponse);
      slackError(slackError, 'Error returning from SfC API');
      return 'SfC API unavailable';
    }

    // get this far with success and a set of next arrivals
    if (allEstablishmentsAndWorkersResponse && allEstablishmentsAndWorkersResponse.establishments) {
      const responseMsg = `Successfully processed ingested data to SFC Internal Admin`;
      logInfo(responseMsg);

      return 'Success';
    }

    return null;
};

