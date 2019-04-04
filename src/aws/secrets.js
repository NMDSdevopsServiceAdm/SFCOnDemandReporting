import AWS  from 'aws-sdk';
import { logError } from '../common/logger';

let secrets = null;

export const initialiseSecrets = (lambdaRegion) => {
  secrets = new AWS.SecretsManager({
    region: lambdaRegion
  });
};

export const resetSecrets = () => {
  secrets = null;
};

export const getSlackWebHookSecret = async () => {
  const webhookSecret =
    await secrets.getSecretValue({SecretId: 'SLACK_URL'}).promise();

    if (typeof webhookSecret.SecretString !== 'undefined') {
    var webhookDetails = JSON.parse(webhookSecret.SecretString);

    if (typeof webhookDetails == 'undefined' ||
        typeof webhookDetails.webhook == 'undefined') {

      throw new Error('Unexpected Slack webhook');
    }

    return webhookDetails;
  } else {
    throw new Error('Unknown Slack webhook secret');
  }

}