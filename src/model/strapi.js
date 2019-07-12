// this encapsulates the invocation of SfC API.

import axios from 'axios';
import { logDebug, logTrace, logInfo, logError } from '../common/logger';
import { thisEstablishment } from './sfc.api';
import { bigIntLiteral } from '@babel/types';

const API_ENDPOINT = 'https://asc-support.uk';
const API_USER ='slackapiuser';
const API_PASSWORD = process.env.STRAPI_PASSWD;

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


export const establishments = async (establishments, dataSource = 'local') => {
  const ESTABLISHMENTS_ENDPOINT = `${API_ENDPOINT}/establishments`;

  if (API_JWT === null) {
    logError('strapi::establishments - JWT is null');
    return;
  }
  if (!establishments || !Array.isArray(establishments)) {
    logError('strapi::establishments - establishments must be an array');
    return;
  }

  let linkBaseUrl = null;
  switch (dataSource) {
    case 'local':
      linkBaseUrl = 'http://localhost:3001/workplace/';
      break;
    case 'dev':
      linkBaseUrl = 'https://sfcdev.cloudapps.digital/';
      break;
    case 'staging':
      linkBaseUrl = 'https://sfcstaging.cloudapps.digital/';
      break;
    case 'production':
      linkBaseUrl = 'https://asc-wds.skillsforcare.org.uk/';
      break;
  }

  try {
    const MAX_COUNT=100;
    let currentCount = 0;

    establishments.forEach(async thisEstablishment => {
      currentCount++;

      let mappedEmployerType = null;
      switch (thisEstablishment.EmployerTypeValue) {
        case 'Private Sector':
          mappedEmployerType = 'Private';
          break;
        case 'Voluntary / Charity':
          mappedEmployerType = 'Voluntary or Charity';
          break;
        case 'Other':
          mappedEmployerType = 'Other';
          break;
        case 'Local Authority (generic/other)':
        case 'Local Authority (adult services)':
          mappedEmployerType = 'Local Authority';
          break;
        default:
          mappedEmployerType = 'Other';
          break;
      }

      if (currentCount < MAX_COUNT) {
        logInfo(`strapi::establishments - About to call upon strapi with url (${ESTABLISHMENTS_ENDPOINT}) on establishment with UID (${thisEstablishment.EstablishmentUID})`);
        const apiBody = {
          PK: thisEstablishment.EstablishmentID,
          UID: thisEstablishment.EstablishmentUID,
          NMDSID: thisEstablishment.NmdsID,
          Name: thisEstablishment.NameValue,
          Postcode: thisEstablishment.PostCode,
          Address: thisEstablishment.Address,
          MainService: thisEstablishment.MainServiceValue,
          DataSource: dataSource,
          LocationID: thisEstablishment.LocationID,
          ProvID: 'unknown',
          IsRegulated: thisEstablishment.IsRegulated,
          ShareWithCQC: thisEstablishment.ShareDataWithCQC,
          ShareWithLA: thisEstablishment.ShareDataWithLA,
          IsParent: thisEstablishment.IsParent,
          IsSub: thisEstablishment.ParentUID && thisEstablishment.ParentUID.length > 0 ? true : false,
          ParentUID: thisEstablishment.ParentUID,
          WeightedCompletion: thisEstablishment.WeightedCompletion,
          OverallWDFEligibility: thisEstablishment.OverallWdfEligibility,
          LastWDFEligible: thisEstablishment.EstablishmentLastWdfEligibility,
          EmployerType: mappedEmployerType,
          URL: linkBaseUrl ? `${linkBaseUrl}/thisEstablishment.EstablishmentID}` : ''
        };

        try {
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
        } catch (err) {
          logError("strapi::establishments API Response Status", err);
        }
      }

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
