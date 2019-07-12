import AWS  from 'aws-sdk';
import { logError } from '../common/logger';

let myLocalSecrets = null;

export const initialiseSecrets = async (lambdaRegion) => {
  const secrets = new AWS.SecretsManager({
    region: lambdaRegion
  });

  const SECRETS_STORE = process.env.STORE || null;

  if (SECRETS_STORE) {
    const mySecretsValue = await secrets.getSecretValue({SecretId: process.env.STORE}).promise();

    if (typeof mySecretsValue.SecretString !== 'undefined') {
      const mySecrets = JSON.parse(mySecretsValue.SecretString);
  
      if (typeof mySecrets == 'undefined') {
        throw new Error('Unexpected Slack webhook');
      }

      myLocalSecrets = {
        SLACK_URL: mySecrets.SLACK_URL,
        MONGO_DB_URI: mySecrets.MONGO_DB_URI,
        JWT_SECRET: mySecrets.JWT_SECRET,
        REGISTRATION_SLACK_URL: mySecrets.REGISTRATION_SLACK_URL,
        FEEDBACK_SLACK_URL: mySecrets.FEEDBACK_SLACK_URL,
      };
    }
  }
};

export const resetSecrets = () => {
  secrets = null;
};

export const getSlackWebHook = () => {
  if (process.env.SLACK_URL) {
    return process.env.SLACK_URL;
  }

  if (myLocalSecrets !== null) {
    return myLocalSecrets.SLACK_URL;
  } else {
    throw new Error('Unknown Slack webhook secret');
  }
}

export const getRegistrationSlackWebHook = () => {
  if (process.env.REGISTRATION_SLACK_URL) {
    return process.env.REGISTRATION_SLACK_URL;
  }

  if (myLocalSecrets !== null) {
    return myLocalSecrets.REGISTRATION_SLACK_URL;
  } else {
    throw new Error('Unknown Registration Slack webhook secret');
  }
}

export const getFeebdackSlackWebHook = () => {
  if (process.env.FEEDBACK_SLACK_URL) {
    return process.env.FEEDBACK_SLACK_URL;
  }

  if (myLocalSecrets !== null) {
    return myLocalSecrets.FEEDBACK_SLACK_URL;
  } else {
    throw new Error('Unknown Feedback Slack webhook secret');
  }
}

export const mongoDBUrl = () => {
  if (process.env.MONGO_DB_URI) {
    return process.env.MONGO_DB_URI;
  }

  if (myLocalSecrets !== null) {
    return myLocalSecrets.MONGO_DB_URI;
  } else {
    throw new Error('Unknown MongoDB URL secret');
  }
}

export const jwtSecret = () => {
  if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  }

  if (myLocalSecrets !== null) {
    return myLocalSecrets.JWT_SECRET;
  } else {
    throw new Error('Unknown JWT Secret secret');
  }
}
