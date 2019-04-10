// this encapsulates the invocation of SfC API.

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { logDebug, logTrace } from '../common/logger';
import { jwtSecret } from '../aws/secrets';

const isLocalhostRegex = /^localhost$/;

export const allEstablishments = async (since=null) => {
    const SFC_API_ENDPOINT = isLocalhostRegex.test(process.env.SFC_HOST)
                                ? 'http://localhost:3000/api'
                                :  `https://${process.env.SFC_HOST}/api`;
    const SFC_GET_ALL_ESTABLISHMENTS = `${SFC_API_ENDPOINT}/reports/dailySnapshot`;
    const apiUrl = since
        ? `${SFC_GET_ALL_ESTABLISHMENTS}/since?${since.toISOString()}`
        : `${SFC_GET_ALL_ESTABLISHMENTS}`;

    try {
        logTrace("sfc.api::allEstablishments - About to call upon SfC API with url", apiUrl);
        const myJwt = reportingJWT();
        const myParams= {};

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

        const response = {
            endpoint: apiUrl,
            status: apiResponse.status,
            establishments: apiResponse.data
        };
        logDebug("sfc.api::allEstablishments to return", response);

        return response;

    } catch (err) {
        console.error(err)
        return {
            endpoint: apiUrl,
            status: err.response && err.response.status ? err.response.status : -1,
            err: err.response && err.response.statusText ? err.response.statusText : 'undefined'
        };
    }
};

const reportingJWT = () => {
    var claims = {
        role: 'reporting',
        sub: 'ondemand-reporting',
        aud: 'ADS-WDS-on-demand-reporting',
        iss: process.env.SFC_HOST,
    }

    // 15 minute token
    return jwt.sign(JSON.parse(JSON.stringify(claims)), jwtSecret(), {expiresIn: '15m'});   
};

const loginJWT = (establishmentId, establishmentUid) => {
    var claims = {
        role: 'reporting',
        sub: 'ondemand-reporting',
        aud: 'ADS-WDS',
        iss: process.env.SFC_HOST,
        EstblishmentId: establishmentId,
        EstablishmentUID: establishmentUid,
    }

    // 15 minute token
    return jwt.sign(JSON.parse(JSON.stringify(claims)), jwtSecret(), {expiresIn: '15m'});   
};

export const thisEstablishment = async (establishmentId, establishmentUid) => {
    const SFC_API_ENDPOINT = isLocalhostRegex.test(process.env.SFC_HOST)
                                ? 'http://localhost:3000/api'
                                :  `https://${process.env.SFC_API_ENDPOINT}/api`;
    const SFC_THIS_ESTABLISHMENTS = `${SFC_API_ENDPOINT}/establishment`;

    const apiUrl = `${SFC_THIS_ESTABLISHMENTS}/${establishmentId}?history=null`;

    try {
        logTrace("sfc.api::thisEstablishment - About to call upon SfC API with url", apiUrl);
        const myJwt = loginJWT(establishmentId, establishmentUid);
        const myParams= {};

        const apiResponse = await axios.get(apiUrl, {
            params: myParams,
            headers: {
                Authorization: `Bearer ${myJwt}`
            }
        });
        logTrace("sfc.api::thisEstablishment API Response", apiResponse);

        const response = {
            endpoint: apiUrl,
            status: apiResponse.status,
            establishment: apiResponse.data
        };
        logDebug("sfc.api::thisEstablishment to return", response);

        return response;

    } catch (err) {
        return {
            endpoint: apiUrl,
            status: err.response && err.response.status ? err.response.status : -1,
            err: err.response && err.response.statusText ? err.response.statusText : 'undefined'
        };
    }
};
