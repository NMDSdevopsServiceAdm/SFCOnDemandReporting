// this encapsulates the invocation of SfC API.

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { logDebug, logTrace } from '../common/logger';

const SFC_API_ENDPOINT = 'http://localhost:3000/api';
const SFC_GET_ALL_ESTABLISHMENTS = `${SFC_API_ENDPOINT}/establishment`;

export const allEstablishments = async (since=null) => {
    const apiUrl = since
        ? `${SFC_GET_ALL_ESTABLISHMENTS}/since?${since.toISOString()}`
        : `${SFC_GET_ALL_ESTABLISHMENTS}`;

    try {
        logTrace("sfc.api::allEstablishments - About to call upon SfC API with url", apiUrl);
        const myJwt = reportingJWT();
        const myParams= {};

        console.log("WA DEBUG - my JWT: ", myJwt)

        if (since) {
            myParams.since = new Date(since);
        }

        const apiResponse = await axios.get(apiUrl, {
            params: myParams,
            headers: {
                Authorization: `Bearer ${myJwt}`
            }
        });
        logTrace("sfc.api::allEstablishments API Response", apiResponse);

        const allEstablishments = [];
        let totalNumberOfEstablishments = 0;
        if ([200,201].includes(apiResponse.status) && typeof apiResponse.data !== 'undefined') {
            totalNumberOfEstablishments = apiResponse.data.count;

            apiResponse.data.establishments.forEach(thisEstablishment => {
                allEstablishments.push(thisEstablishment)
            });
        }

        const response = {
            endpoint: apiUrl,
            status: apiResponse.status,
            count: totalNumberOfEstablishments,
            establishments: allEstablishments
        };
        logDebug("sfc.api::allEstablishments to return", response);

        return response;

    } catch (err) {
        return {
            endpoint: apiUrl,
            status: err.response && err.response.status ? err.response.status : -1,
            err: err.response && err.response.statusText ? err.response.statusText : 'undefined'
        };
    }
};

const reportingJWT = () => {
    const jwtSecret = 'nodeauthsecret';             // TODO - get from AWS Secrets Manager
    var claims = {
        role: 'reporting',
        sub: 'ondemand-reporting',
        aud: 'ADS-WDS-on-demand-reporting',           // TODO - get from AWS Secrets Manager
        iss: 'localhost',              // TODO - get from AWS Secrets Manager
    }

    // 15 minute token
    return jwt.sign(JSON.parse(JSON.stringify(claims)), jwtSecret, {expiresIn: '15m'});   
};
