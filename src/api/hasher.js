'use strict';
import crypto from 'crypto';

const sha256b64 = (password, mySalt) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${password}${mySalt}`);
  return {
      salt:mySalt,
      passwordHash: hash.digest('base64'),
  };
};

export const handler = async (event, context, callback) => {
    let responseCode = 200;
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true
    };

    const salt = process.env.HASH_SALT;
    const targetHash = process.env.HASH_TARGET;
    let password = null;
    
    if (event.body) {
        let body = JSON.parse(event.body)
        if (body.password) 
          password = body.password;
    }

    if (password === null) {
      return {
        statusCode: 400,
        headers,
        isBase64Encoded: false,
        body: JSON.stringify({status: 400, message: 'Must provide password'})
      };
    }

    const newHash = sha256b64(password, salt);

    if (newHash.passwordHash === targetHash) {
      return {
        statusCode: 200,
        headers,
        isBase64Encoded: false,
        body: JSON.stringify({status: 200, message: 'Success'}),
      };
    } else {
      return {
        statusCode: 403,
        headers,
        isBase64Encoded: false,
        body: JSON.stringify({status: 403, message: 'Failed'}),
      };
    }
};
