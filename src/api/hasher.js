'use strict';
import crypto from 'crypto';

// It's all about the encoding
// https://stackoverflow.com/questions/13714103/hashing-a-password-using-sha256-and-net-node-js
// https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings

const sha256b64default = (password, mySalt) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${password}${mySalt}`);     // .NET C# Unicode encoding defaults to UTF-16
  return {
      salt:mySalt,
      passwordHash: hash.digest('base64'),
  };
};


const sha256b64ucs2 = (password, mySalt) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${password}${mySalt}`, 'ucs2');     // .NET C# Unicode encoding defaults to UTF-16
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

    const newHash = sha256b64default(password, salt);
    console.log("WA DEBUG - default hash: ", newHash)

    if (newHash.passwordHash === targetHash) {
      return {
        statusCode: 200,
        headers,
        isBase64Encoded: false,
        body: JSON.stringify({status: 200, message: 'Success with default encoded hash'}),
      };
    } else {
      // try the UCS encoding hash
      const ucsHash = sha256b64ucs2(password, salt);
      console.log("WA DEBUG - UCS2 hash: ", ucsHash)

      if (ucsHash.passwordHash === targetHash) {
        return {
          statusCode: 200,
          headers,
          isBase64Encoded: false,
          body: JSON.stringify({status: 200, message: 'Success with UCS2 encoded hash'}),
        };
      } else {
        return {
          statusCode: 403,
          headers,
          isBase64Encoded: false,
          body: JSON.stringify({status: 403, message: 'Failed'}),
        };  
      }
    }
};
