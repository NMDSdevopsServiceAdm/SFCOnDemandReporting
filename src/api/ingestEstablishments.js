'use strict';

import { MongoClient } from 'mongodb';
import { getSlackWebHookSecret } from '../aws/secrets';
import { logInfo, logError, logWarn, logTrace } from '../common/logger';
import { initialiseSecrets } from '../aws/secrets';

/* Example input:
 * 
 event : {
    "Records": [
      {
          "kinesis": {
              "kinesisSchemaVersion": "1.0",
              "partitionKey": "1",
              "sequenceNumber": "49590338271490256608559692538361571095921575989136588898",
              "data": "SGVsbG8sIHRoaXMgaXMgYSB0ZXN0Lg==",
              "approximateArrivalTimestamp": 1545084650.987
          },
          "eventSource": "aws:kinesis",
          "eventVersion": "1.0",
          "eventID": "shardId-000000000006:49590338271490256608559692538361571095921575989136588898",
          "eventName": "aws:kinesis:record",
          "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-kinesis-role",
          "awsRegion": "us-east-2",
          "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"
      }
   ]
  }
 *
 */

export const handler = async (event, context) => {
  var arnList = (context.invokedFunctionArn).split(":");
  var lambdaRegion = arnList[3];

  const slackTitle = 'SfC Establishment Pump';

  //initialiseSecrets(lambdaRegion);

  // slackTrace(slackTitle, event);

  const establishments = {};
  try {
    // by initiating lambda from a Kinesis Stream, the records are added to event
    event.Records.forEach(function(record) {
      // Kinesis data is base64 encoded so decode here
      const payload = Buffer.from(record.kinesis.data, 'base64').toString('ascii');

      let jsonPayload = null;
      try {
        jsonPayload = JSON.parse(payload);
      } catch (err) {
        // do nothing
      }

      // kinesis records come in batches; there may be more than one
      //  record for the same establishment. We just need the most recent.
      if (jsonPayload && jsonPayload.establishment) {
        const eID = jsonPayload.establishment.uid;

        let thisMappedEstablishment = establishments[eID];
        if (thisMappedEstablishment) {
          // establishment already exists with this uid
          // check if this current establishment has an updated timestamp more recent
          const thisEstablishmentUpdated = new Date(jsonPayload.establishment.updated).getTime();
          const refEstablishmentUpdated = new Date(thisMappedEstablishment.updated).getTime();
          if (thisEstablishmentUpdated > refEstablishmentUpdated) {
            establishments[eID] = jsonPayload.establishment;
          }
        } else {
          // establishment of this UID not exist yet - add this one
          establishments[eID] = jsonPayload.establishment;
        }
      }
    });

  } catch (err) {
    // unable to get establishments
    logError(err);
    throw new Error('Unable to get SfC Establishments from kinesis stream');
  }

  const establishmentKeys = Object.keys(establishments);
  logInfo(slackTitle, "All establishments: ", establishmentKeys.length);

  // now having a unique set of Establishments, can upsert them into Mongo collection
  const mongoDbUrl = process.env.MONGO_DB_URI;

  try {
    const dbClient = await MongoClient.connect(mongoDbUrl, { useNewUrlParser: true });
    const db = dbClient.db('Demo');

    const upsertPromises = [];

    establishmentKeys.forEach(thisEstUID => {
      upsertPromises.push(
        db.collection('establishments').update(
          { uid: thisEstUID },
          establishments[thisEstUID],
          {
            upsert: true,
          }
        )
      );
    });

    await Promise.all(upsertPromises);

    const responseMsg = `Successfully retrieved Establishments: ${establishmentKeys.join(',')}`;
    logInfo(responseMsg);
  
    dbClient.close();

    return true;  

  } catch (err) {
    logError(err);
    return false;
  }
};
