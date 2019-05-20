// this encapsulates the invocation of SfC API.

import axios from 'axios';
import { logDebug, logTrace, logError } from '../common/logger';
import { thisEstablishment } from './sfc.api';

const API_ENDPOINT = 'http://ec2-34-243-239-246.eu-west-1.compute.amazonaws.com:1337';
const API_USER ='sfcapi';
const API_PASSWORD ='apipassword';

let API_JWT = null;

export const login = async () => {
    const LOGIN_ENDPOINT = `${API_ENDPOINT}/auth/local`;

    try {
        logTrace("strapi::login - About to call upon STRPAI with url", LOGIN_ENDPOINT);

        const apiBody = {
          identifier: API_USER,
          password: API_PASSWORD
        };
        const apiResponse = await axios.post(
          LOGIN_ENDPOINT,
          apiBody,
          {}
        );
        logTrace("strapi::login API Response Status", apiResponse.status);

        API_JWT = apiResponse.data.jwt;
        //logDebug("strapi::login success: ", API_JWT === null);

        return true;

    } catch (err) {
        console.error(err)
        return false;
    }
};


export const establishments = async (establishments) => {
  const ESTABLISHMENTS_ENDPOINT = `${API_ENDPOINT}/establishments`;

  if (API_JWT === null) {
    logError('strapi::establishments - JWT is null');
    return;
  }
  if (!establishments || !Array.isArray(establishments)) {
    logError('strapi::establishments - establishments must be an array');
    return;
  }

  try {
    establishments.forEach(async thisEstablishment => {
      logTrace(`strapi::establishments - About to call upon STRPAI with url (${ESTABLISHMENTS_ENDPOINT}) on establishment with UID (${thisEstablishment.EstablishmentUID})`);

      const apiBody = {
        PK: thisEstablishment.EstablishmentID,
        UID: thisEstablishment.EstablishmentUID,
        NMDSID: thisEstablishment.NmdsID,
        Name: thisEstablishment.NameValue,
        Postcode: thisEstablishment.PostCode,
        Address: thisEstablishment.Address,
        password: API_PASSWORD,
        MainService: thisEstablishment.MainServiceValue,
      };
      const apiResponse = await axios.post(
        ESTABLISHMENTS_ENDPOINT,
        apiBody,
        {
          headers: {
              Authorization: `Bearer ${API_JWT}`
          }
        }
      );
      logTrace("strapi::establishments API Response Status", apiResponse.status);
    });

    return true;
  } catch (err) {
      console.error(err)
      return false;
  }
};


export const users = async (users) => {
  const USERS_ENDPOINT = `${API_ENDPOINT}/appusers`;

  if (API_JWT === null) {
    logError('strapi::users - JWT is null');
    return;
  }
  if (!users || !Array.isArray(users)) {
    logError('strapi::users - users must be an array');
    return;
  }

  try {
    users.forEach(async thisUser => {
      logTrace(`strapi::users - About to call upon STRPAI with url (${USERS_ENDPOINT}) on establishment with UID (${thisUser.EstablishmentUID})`);

      const apiBody = {
        PK: thisUser.UserPK,
        UID: thisUser.UserUID,
        Name: thisUser.Name,
        Phone: thisUser.Phone,
        Email: thisUser.Email,
        SecurityQuestion: thisUser.securityQeustion,
        SecurityAnswer: thisUser.MainServiceValue,
        username: thisUser.Username,
        lastLoggedOn: thisUser.LastLoggedOn,
        lastChangedPassword: thisUser.LastChangedPassword,
        NMDSID: thisUser.NmdsID,
        EstablishmentID: thisUser.EstablishmentID,
        Role: thisUser.UserRole,
        EstablishmentName: thisUser.EstablishmentName,
        IsPrimary: thisUser.IsPrimary
      };

      console.log("WA DEBUG api body: ", apiBody)

      const apiResponse = await axios.post(
        USERS_ENDPOINT,
        apiBody,
        {
          headers: {
              Authorization: `Bearer ${API_JWT}`
          }
        }
      );
      logTrace("strapi::users API Response Status", apiResponse.status);
    });

    return true;
  } catch (err) {
      console.error(err)
      return false;
  }
};
