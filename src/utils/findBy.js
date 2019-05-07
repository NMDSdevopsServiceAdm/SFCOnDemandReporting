export const findService = (services, serviceId) => {
  if (serviceId === null) return null;

  return services.find(thisService => {
    if (thisService.serviceId == serviceId) {
      return thisService;
    }
  });
};

export const findJob = (jobs, jobId) => {
  if (jobId === null) return null;

  return jobs.jobs.find(thisJob => {
    if (thisJob.id == jobId) {
      return thisJob;
    }
  });
};

export const findEthnicity = (ethnicities, ethnicityId) => {
  if (ethnicityId === null) return null;

  return ethnicities.ethnicities.list.find(thisEthnicity => {
    if (thisEthnicity.id == ethnicityId) {
      return thisEthnicity;
    }
  });
};


export const findCountry = (countries, countryId) => {
  if (countryId === null) return null;

  return countries.countries.find(thisCountry => {
    if (thisCountry.id == countryId) {
      return thisCountry;
    }
  });
};

export const findNationality = (nationalities, nationalityId) => {
  if (nationalityId === null) return null;

  return nationalities.nationalities.find(thisCountry => {
    if (thisCountry.id == nationalityId) {
      return thisCountry;
    }
  });
};

export const findRecruitmentSource = (sources, fromId) => {
  if (fromId === null) return null;

  return sources.recruitedFrom.find(thisSource => {
    if (thisSource.id == fromId) {
      return thisSource;
    }
  });
};

export const findQualification = (qualifications, qualificationId) => {
  if (qualificationId === null) return null;

  return qualifications.qualifications.find(thisQualification => {
    if (thisQualification.id == qualificationId) {
      return thisQualification;
    }
  });
};

export const findPostcode = (allPostcodes, thePostcode) => {
  if (thePostcode === null) return null;
  if (!Array.isArray(allPostcodes)) return null;

  return allPostcodes.find(thisPostcode => {
    if (thisPostcode.query === thePostcode) {
      if (thisPostcode.result === null) {
        return null;
      } else {
        return thisPostcode;
      }
    }
  });
};