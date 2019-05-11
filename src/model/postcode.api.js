// this encapsulates the invocation of postcodes.io - https://postcodes.io/.

import axios from 'axios';
import { logDebug, logTrace, logError } from '../common/logger';

export const resolveAllPostcodes = async (postcodes) => {
    const POSTCODE_API_ENDPOINT ='https://api.postcodes.io/postcodes';
    try {
        logTrace("postcode.api::resolveAllPostcodes - About to call upon Postcode API with url", POSTCODE_API_ENDPOINT);

        const apiResponse = await axios.post(POSTCODE_API_ENDPOINT, {
            postcodes
        });

        logTrace("postcode.api::resolveAllPostcodes API Response Status", apiResponse.status);

        const response = {
            endpoint: POSTCODE_API_ENDPOINT,
            status: apiResponse.status,
            postcodes: apiResponse.data.result
        };
        logDebug("postcode.api::resolveAllPostcodes to return # postcodes", apiResponse.data.result.length);

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
