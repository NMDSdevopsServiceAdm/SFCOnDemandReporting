// this is to store content in AWS S3
import AWS  from 'aws-sdk';
import { logInfo, logTrace, logError } from '../common/logger';

let thisS3 = null;
let thisBucket = null;

export const initialiseS3 = async (lambdaRegion, bucket=null) => {
  thisS3 = new AWS.S3({apiVersion: '2010-12-01', region: lambdaRegion});

  if (bucket) {
    thisBucket = bucket;
  } else {
    thisBucket = process.env.S3_REPORTS_BUCKET;
  }
};

// uploads the given content to known S3 bucket, having the given key (name); returns a Signed URL to the S3 object having the given expiry (in hours)
export const upload = async (name, content, expiry) =>  {
  if (!name || !content || expiry === null || expiry === undefined) return null;
  if (name.length == 0) return null;
  if (content.length == 0) return null;

  // note - the size of the content is less than 50MB so a simple putObject suffices
  //        getSignedUrl can take the body; but explicitly keeping the upload and the signing separate here
  try {
    const params = {
      Bucket: thisBucket,
      Key: name,
      Body: content
    };
    const s3Response = await thisS3.putObject(params).promise();
    logTrace(`S3 upload: uploaded ${name} to ${thisBucket}: ${content.length} bytes`);

    // having successfully uploaded the object, get a signed URL
    const signedUrlExpireSeconds = 60 * 60 * expiry;
    delete params.Body;
    params.Expires = signedUrlExpireSeconds;
    const signedUrl = thisS3.getSignedUrl('getObject', params);

    logTrace(`S3 upload: signed url ${signedUrl}`);

    return signedUrl;

  } catch (err) {
    logError(err);
  }
};
