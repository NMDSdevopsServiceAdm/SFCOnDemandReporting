import { allEstablishments } from "../model/sfc.api";
import { createObjectCsvStringifier } from 'csv-writer';
import { findService, findJob, findEthnicity, findCountry, findNationality, findRecruitmentSource, findQualification } from '../utils/findBy';
import { inspect } from 'util';

export const separateEstablishments = (allEstablishmentsAndWorkers, referenceServices) => {
  const establishments = [];
  const establishmentIds = [];

  allEstablishmentsAndWorkers.forEach(thisWorker => {
    if (!establishmentIds.includes(thisWorker.EstablishmentID)) {
      establishmentIds.push(thisWorker.EstablishmentID);

      const thisEstablishment = thisWorker;
      const mainServiceByName = findService(referenceServices, thisEstablishment.MainServiceFKValue);
      thisEstablishment.MainServiceValue = mainServiceByName ? mainServiceByName.name : null;

      // remap OtherServices, ServiceUsers and Capacities if they are null rather than 0
      if (thisEstablishment.OtherServices == 0 && thisEstablishment.OtherServicesSavedAt === null) {
        thisEstablishment.OtherServices = -1;
      }
      if (thisEstablishment.ServiceUsers == 0 && thisEstablishment.ServiceUsersSavedAt === null) {
        thisEstablishment.ServiceUsers = -1;
      }
      if (thisEstablishment.Capacities == 0 && thisEstablishment.CapacityServicesSavedAt === null) {
        thisEstablishment.Capacities = -1;
      }
      if (thisEstablishment.LocalAuthorities == 0 && thisEstablishment.ShareDataSavedAt === null) {
        thisEstablishment.LocalAuthorities = -1;
      }

      // now add a weighted completion value (between 0 and 100)
      // the properties to check for are:
      // 1. Number Of Staff
      // 2. Employer Type
      // 3. Other Services
      // 3a. Note - don't have enough information to check for capacities
      // 4. Service Users
      // 5. ShareDat
      // 6. Vacancies
      // 7. Starters
      // 8. Leavers
      const totalPropertyCount = 8;
      let weightedPropertyCount = 0;
      if (thisEstablishment.NumberOfStaffSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.EmployerTypeSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.OtherServicesSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.ServiceUsersSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.ShareDataSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.VacanciesSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.StartersSavedAt !== null) {
        weightedPropertyCount++;
      }
      if (thisEstablishment.LeaversSavedAt !== null) {
        weightedPropertyCount++;
      }
      thisEstablishment.WeightedCompletion = Math.floor(weightedPropertyCount/totalPropertyCount*100);
      establishments.push(thisEstablishment);
    }
  });

  return establishments;
}

// in the analysis view an establishment can exist with no workers; in this case, the "WorkerUID" is empty; ignore these records
export const separateWorkers = (allEstablishmentsAndWorkers) => {
  const workers = [];

  allEstablishmentsAndWorkers.forEach(thisWorker => {
    if (thisWorker.WorkerUID) {
      workers.push(thisWorker);
    }
  });

  return workers;
}


export const dailySnapshotReportV5 = async (establishments, workers, referenceLookups) => {
  // remap the workers, which includes calculated CssR ID (the first letter on NMDS ID)
  const mappedWorkers = workers.map(thisWorker => {
    const newWorker = thisWorker;

    // dereference job
    const jobByName = findJob(referenceLookups.jobs, thisWorker.MainJobFKValue);
    newWorker.MainJobValue = jobByName ? jobByName.title : null;

    // dereference ethnicity
    const ethnicityByName = findEthnicity(referenceLookups.ethnicities, thisWorker.EthnicityFKValue);
    newWorker.EthnicityValue = ethnicityByName ? ethnicityByName.ethnicity : null;

    // dereference country of birth/nationality
    const countryByName = findCountry(referenceLookups.countries, thisWorker.CountryOfBirthOtherFK);
    newWorker.CountryOfBirthOther = countryByName ? countryByName.country : null;
    const nationalityByName = findNationality(referenceLookups.nationalities, thisWorker.NationalityOtherFK);
    newWorker.NationalityOther = nationalityByName ? nationalityByName.nationality : null;

    // dereference recruited source
    const recruitmentSourceByName = findRecruitmentSource(referenceLookups.recruitmentSources, thisWorker.RecruitedFromOtherFK);
    newWorker.RecruitedFromOther = recruitmentSourceByName ? recruitmentSourceByName.from : null;

    // dereference social care/other qualification levels
    const socialCareQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.SocialCareQualificationFKValue);
    newWorker.SocialCareQualificationValue = socialCareQualificationLevelByName ? socialCareQualificationLevelByName.level : null;
    const otherQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.HighestQualificationFKValue);
    newWorker.HighestQualificationValue = otherQualificationLevelByName ? otherQualificationLevelByName.level : null;

    newWorker.CssRCalculated = thisWorker.NmdsID.substring(0,1);
    return newWorker;
  });

  const establishmentCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'TribalEstablishmentID', title: 'TribalID'},
      { id: 'NmdsID', title: 'NmdsID'},
      { id: 'NameValue', title: 'Name'},
      { id: 'IsRegulated', title: 'IsRegulated'},
      { id: 'PostCode', title: 'PostCode'},
      { id: 'Eastings', title: 'Eastings'},
      { id: 'Northings', title: 'Northings'},
      { id: 'Latitude', title: 'Latitude'},
      { id: 'Longitude', title: 'Longitude'},

      { id: 'EstablishmentCreated', title: 'EstablishmentCreated'},
      { id: 'EstablishmentUpdated', title: 'EstablishmentUpdated'},
      { id: 'WeightedCompletion', title: 'WeightedCompletion'},

      // WDF
      { id: 'OverallWdfEligibility', title: 'OverallWdfEligibility'},
      { id: 'EstablishmentLastWdfEligibility', title: 'LastWdfEligibility'},

      // parent/subs
      { id: 'IsParent', title: 'IsParent'},
      { id: 'ParentUID', title: 'ParentUID'},

      // establishment properties
      { id: 'MainServiceFKValue', title: 'MainServiceByID'},
      { id: 'MainServiceValue', title: 'MainService'},
      { id: 'MainServiceCapacity', title: 'MainServiceCapacity'},
      { id: 'MainServiceUtilisation', title: 'MainServiceUtilisation'},


      { id: 'EmployerTypeValue', title: 'EmployerType'},
      { id: 'NumberOfStaffValue', title: 'NumberOfStaff'},
      { id: 'OtherServices', title: 'OtherServices'},
      { id: 'Capacities', title: 'Capacities'},
      { id: 'ServiceUsers', title: 'ServiceUsers'},
      { id: 'ShareDataValue', title: 'ShareData'},
      { id: 'ShareDataWithCQC', title: 'ShareWithCQC'},
      { id: 'ShareDataWithLA', title: 'ShareWithLA'},
      { id: 'LocalAuthorities', title: 'LocalAuthorities'},
      { id: 'VacanciesValue', title: 'Vacancies'},
      { id: 'StartersValue', title: 'Starters'},
      { id: 'LeaversValue', title: 'Leavers'},
    ]
  });

  const workerCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'NmdsID', title: 'NmdsID'},

      // workers
      { id: 'WorkerUID', title: 'WorkerUID'},
      { id: 'TribalWorkerID', title: 'TribalID'},
      { id: 'WorkerCreated', title: 'WorkerCreated'},
      { id: 'WorkerUpdated', title: 'WorkerUpdated'},
      { id: 'Archived', title: 'Archived'},
      { id: 'LeaveReasonFK', title: 'LeaveReason'},
      { id: 'CompletedValue', title: 'Completed'},

      // WDF
      { id: 'WorkerLastWdfEligibility', title: 'LastWdfEligibility'},

      // worker properties
      { id: 'ContractValue', title: 'Contract'},
      { id: 'MainJobFKValue', title: 'MainJobByID'},
      { id: 'MainJobValue', title: 'MainJob'},
      { id: 'ApprovedMentalHealthWorkerValue', title: 'ApprovedMentalHealthWorker'},
      { id: 'MainJobStartDateValue', title: 'MainJobStartDate'},
      { id: 'OtherJobsValue', title: 'OtherJobs'},
      { id: 'NationalInsuranceNumberValue', title: 'NationalInsuranceNumber'},
      { id: 'DateOfBirthValue', title: 'Age'},
      { id: 'CssRCalculated', title: 'CssrID'},
      { id: 'DisabilityValue', title: 'DisabilityValue'},
      { id: 'GenderValue', title: 'Gender'},
      { id: 'EthnicityFKValue', title: 'EthnicityByID'},
      { id: 'EthnicityValue', title: 'Ethnicity'},
      { id: 'NationalityValue', title: 'Nationality'},
      { id: 'NationalityOther', title: 'GivenNationality'},
      { id: 'CountryOfBirthValue', title: 'CountryOfBirth'},
      { id: 'CountryOfBirthOther', title: 'GivenCountryOfBirth'},
      { id: 'RecruitedFromValue', title: 'RecruitedFrom'},
      { id: 'RecruitedFromOther', title: 'GivenRecruitedFrom'},
      { id: 'BritishCitizenshipValue', title: 'BritishCitizenship'},
      { id: 'YearArrivedValue', title: 'YearArrived'},
      { id: 'SocialCareStartDateValue', title: 'SocialCareStartDate'},
      { id: 'DaysSickValue', title: 'DaysSick'},
      { id: 'ZeroHoursContractValue', title: 'ZeroHoursContract'},
      { id: 'WeeklyHoursAverageValue', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursAverageHours', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursContractedValue', title: 'WeeklyHoursContracted'},
      { id: 'WeeklyHoursContractedHours', title: 'WeeklyHoursContracted'},
      { id: 'AnnualHourlyPayValue', title: 'AnnualHourlyPay'},
      { id: 'AnnualHourlyPayRate', title: 'AnnualHourlyPay'},
      { id: 'CareCertificateValue', title: 'CareCertificate'},
      { id: 'ApprenticeshipTrainingValue', title: 'ApprenticeshipTraining'},
      { id: 'QualificationInSocialCareValue', title: 'QualificationInSocialCare'},
      { id: 'SocialCareQualificationFKValue', title: 'SocialCareQualificationByID'},
      { id: 'SocialCareQualificationValue', title: 'SocialCareQualification'},
      { id: 'OtherQualificationsValue', title: 'OtherQualifications'},
      { id: 'HighestQualificationFKValue', title: 'HighestQualificationByID'},
      { id: 'HighestQualificationValue', title: 'HighestQualification'},
    ]
  });

  const establishmentsCsv = establishmentCsvWriter.getHeaderString().concat(establishmentCsvWriter.stringifyRecords(establishments));
  const workersCsv = workerCsvWriter.getHeaderString().concat(workerCsvWriter.stringifyRecords(mappedWorkers));

  return {
    establishmentsCsv,
    workersCsv
  };
};

export const dailySnapshotReportV6 = async (establishments, workers, referenceLookups) => {
  // remap the workers, which includes calculated CssR ID (the first letter on NMDS ID)
  const mappedWorkers = workers.map(thisWorker => {
    const newWorker = thisWorker;

    // dereference job
    const jobByName = findJob(referenceLookups.jobs, thisWorker.MainJobFKValue);
    newWorker.MainJobValue = jobByName ? jobByName.title : null;

    // dereference ethnicity
    const ethnicityByName = findEthnicity(referenceLookups.ethnicities, thisWorker.EthnicityFKValue);
    newWorker.EthnicityValue = ethnicityByName ? ethnicityByName.ethnicity : null;

    // dereference country of birth/nationality
    const countryByName = findCountry(referenceLookups.countries, thisWorker.CountryOfBirthOtherFK);
    newWorker.CountryOfBirthOther = countryByName ? countryByName.country : null;
    const nationalityByName = findNationality(referenceLookups.nationalities, thisWorker.NationalityOtherFK);
    newWorker.NationalityOther = nationalityByName ? nationalityByName.nationality : null;

    // dereference recruited source
    const recruitmentSourceByName = findRecruitmentSource(referenceLookups.recruitmentSources, thisWorker.RecruitedFromOtherFK);
    newWorker.RecruitedFromOther = recruitmentSourceByName ? recruitmentSourceByName.from : null;

    // dereference social care/other qualification levels
    const socialCareQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.SocialCareQualificationFKValue);
    newWorker.SocialCareQualificationValue = socialCareQualificationLevelByName ? socialCareQualificationLevelByName.level : null;
    const otherQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.HighestQualificationFKValue);
    newWorker.HighestQualificationValue = otherQualificationLevelByName ? otherQualificationLevelByName.level : null;

    newWorker.CssRCalculated = thisWorker.NmdsID.substring(0,1);
    return newWorker;
  });

  const establishmentCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'EstablishmentDataSource', title: 'EstablishmentDataSource'},
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'TribalEstablishmentID', title: 'TribalID'},
      { id: 'NmdsID', title: 'NmdsID'},
      { id: 'NameValue', title: 'Name'},
      { id: 'IsRegulated', title: 'IsRegulated'},
      { id: 'PostCode', title: 'PostCode'},
      { id: 'Eastings', title: 'Eastings'},
      { id: 'Northings', title: 'Northings'},
      { id: 'Latitude', title: 'Latitude'},
      { id: 'Longitude', title: 'Longitude'},

      { id: 'EstablishmentCreated', title: 'EstablishmentCreated'},
      { id: 'EstablishmentUpdated', title: 'EstablishmentUpdated'},
      { id: 'WeightedCompletion', title: 'WeightedCompletion'},

      // WDF
      { id: 'OverallWdfEligibility', title: 'OverallWdfEligibility'},
      { id: 'EstablishmentLastWdfEligibility', title: 'LastWdfEligibility'},

      // parent/subs
      { id: 'IsParent', title: 'IsParent'},
      { id: 'ParentUID', title: 'ParentUID'},

      // establishment properties
      { id: 'MainServiceFKValue', title: 'MainServiceByID'},
      { id: 'MainServiceValue', title: 'MainService'},
      { id: 'MainServiceCapacity', title: 'MainServiceCapacity'},
      { id: 'MainServiceUtilisation', title: 'MainServiceUtilisation'},


      { id: 'EmployerTypeValue', title: 'EmployerType'},
      { id: 'NumberOfStaffValue', title: 'NumberOfStaff'},
      { id: 'OtherServices', title: 'OtherServices'},
      { id: 'Capacities', title: 'Capacities'},
      { id: 'ServiceUsers', title: 'ServiceUsers'},
      { id: 'ShareDataValue', title: 'ShareData'},
      { id: 'ShareDataWithCQC', title: 'ShareWithCQC'},
      { id: 'ShareDataWithLA', title: 'ShareWithLA'},
      { id: 'LocalAuthorities', title: 'LocalAuthorities'},
      { id: 'VacanciesValue', title: 'Vacancies'},
      { id: 'StartersValue', title: 'Starters'},
      { id: 'LeaversValue', title: 'Leavers'},
    ]
  });

  const workerCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'WorkerDataSource', title: 'WorkerDataSource'},
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'NmdsID', title: 'NmdsID'},

      // workers
      { id: 'WorkerUID', title: 'WorkerUID'},
      { id: 'TribalWorkerID', title: 'TribalID'},
      { id: 'WorkerCreated', title: 'WorkerCreated'},
      { id: 'WorkerUpdated', title: 'WorkerUpdated'},
      { id: 'Archived', title: 'Archived'},
      { id: 'LeaveReasonFK', title: 'LeaveReason'},
      { id: 'CompletedValue', title: 'Completed'},

      // WDF
      { id: 'WorkerLastWdfEligibility', title: 'LastWdfEligibility'},

      // worker properties
      { id: 'ContractValue', title: 'Contract'},
      { id: 'MainJobFKValue', title: 'MainJobByID'},
      { id: 'MainJobValue', title: 'MainJob'},
      { id: 'ApprovedMentalHealthWorkerValue', title: 'ApprovedMentalHealthWorker'},
      { id: 'MainJobStartDateValue', title: 'MainJobStartDate'},
      { id: 'OtherJobsValue', title: 'OtherJobs'},
      { id: 'NationalInsuranceNumberValue', title: 'NationalInsuranceNumber'},
      { id: 'DateOfBirthValue', title: 'Age'},
      { id: 'CssRCalculated', title: 'CssrID'},
      { id: 'DisabilityValue', title: 'DisabilityValue'},
      { id: 'GenderValue', title: 'Gender'},
      { id: 'EthnicityFKValue', title: 'EthnicityByID'},
      { id: 'EthnicityValue', title: 'Ethnicity'},
      { id: 'NationalityValue', title: 'Nationality'},
      { id: 'NationalityOther', title: 'GivenNationality'},
      { id: 'CountryOfBirthValue', title: 'CountryOfBirth'},
      { id: 'CountryOfBirthOther', title: 'GivenCountryOfBirth'},
      { id: 'RecruitedFromValue', title: 'RecruitedFrom'},
      { id: 'RecruitedFromOther', title: 'GivenRecruitedFrom'},
      { id: 'BritishCitizenshipValue', title: 'BritishCitizenship'},
      { id: 'YearArrivedValue', title: 'YearArrived'},
      { id: 'SocialCareStartDateValue', title: 'SocialCareStartDate'},
      { id: 'DaysSickValue', title: 'DaysSick'},
      { id: 'ZeroHoursContractValue', title: 'ZeroHoursContract'},
      { id: 'WeeklyHoursAverageValue', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursAverageHours', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursContractedValue', title: 'WeeklyHoursContracted'},
      { id: 'WeeklyHoursContractedHours', title: 'WeeklyHoursContracted'},
      { id: 'AnnualHourlyPayValue', title: 'AnnualHourlyPay'},
      { id: 'AnnualHourlyPayRate', title: 'AnnualHourlyPay'},
      { id: 'CareCertificateValue', title: 'CareCertificate'},
      { id: 'ApprenticeshipTrainingValue', title: 'ApprenticeshipTraining'},
      { id: 'QualificationInSocialCareValue', title: 'QualificationInSocialCare'},
      { id: 'SocialCareQualificationFKValue', title: 'SocialCareQualificationByID'},
      { id: 'SocialCareQualificationValue', title: 'SocialCareQualification'},
      { id: 'OtherQualificationsValue', title: 'OtherQualifications'},
      { id: 'HighestQualificationFKValue', title: 'HighestQualificationByID'},
      { id: 'HighestQualificationValue', title: 'HighestQualification'},
    ]
  });

  const establishmentsCsv = establishmentCsvWriter.getHeaderString().concat(establishmentCsvWriter.stringifyRecords(establishments));
  const workersCsv = workerCsvWriter.getHeaderString().concat(workerCsvWriter.stringifyRecords(mappedWorkers));

  return {
    establishmentsCsv,
    workersCsv
  };
};

export const dailySnapshotReportV7 = async (establishments, workers, referenceLookups) => {
  // remap the workers, which includes calculated CssR ID (the first letter on NMDS ID)
  const mappedWorkers = workers.map(thisWorker => {
    const newWorker = thisWorker;

    // dereference job
    const jobByName = findJob(referenceLookups.jobs, thisWorker.MainJobFKValue);
    newWorker.MainJobValue = jobByName ? jobByName.title : null;

    // dereference ethnicity
    const ethnicityByName = findEthnicity(referenceLookups.ethnicities, thisWorker.EthnicityFKValue);
    newWorker.EthnicityValue = ethnicityByName ? ethnicityByName.ethnicity : null;

    // dereference country of birth/nationality
    const countryByName = findCountry(referenceLookups.countries, thisWorker.CountryOfBirthOtherFK);
    newWorker.CountryOfBirthOther = countryByName ? countryByName.country : null;
    const nationalityByName = findNationality(referenceLookups.nationalities, thisWorker.NationalityOtherFK);
    newWorker.NationalityOther = nationalityByName ? nationalityByName.nationality : null;

    // dereference recruited source
    const recruitmentSourceByName = findRecruitmentSource(referenceLookups.recruitmentSources, thisWorker.RecruitedFromOtherFK);
    newWorker.RecruitedFromOther = recruitmentSourceByName ? recruitmentSourceByName.from : null;

    // dereference social care/other qualification levels
    const socialCareQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.SocialCareQualificationFKValue);
    newWorker.SocialCareQualificationValue = socialCareQualificationLevelByName ? socialCareQualificationLevelByName.level : null;
    const otherQualificationLevelByName = findQualification(referenceLookups.qualifications, thisWorker.HighestQualificationFKValue);
    newWorker.HighestQualificationValue = otherQualificationLevelByName ? otherQualificationLevelByName.level : null;

    newWorker.CssRCalculated = thisWorker.NmdsID.substring(0,1);
    return newWorker;
  });

  const establishmentCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'EstablishmentDataSource', title: 'EstablishmentDataSource'},
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'TribalEstablishmentID', title: 'TribalID'},
      { id: 'NmdsID', title: 'NmdsID'},
      { id: 'NameValue', title: 'Name'},
      { id: 'IsRegulated', title: 'IsRegulated'},
      { id: 'LocationID', title: 'LocationID'},
      { id: 'ProvID', title: 'ProvID'},
      { id: 'PostCode', title: 'PostCode'},
      { id: 'Eastings', title: 'Eastings'},
      { id: 'Northings', title: 'Northings'},
      { id: 'Latitude', title: 'Latitude'},
      { id: 'Longitude', title: 'Longitude'},

      { id: 'EstablishmentCreated', title: 'EstablishmentCreated'},
      { id: 'EstablishmentUpdated', title: 'EstablishmentUpdated'},
      { id: 'WeightedCompletion', title: 'WeightedCompletion'},

      // WDF
      { id: 'OverallWdfEligibility', title: 'OverallWdfEligibility'},
      { id: 'EstablishmentLastWdfEligibility', title: 'LastWdfEligibility'},

      // parent/subs
      { id: 'IsParent', title: 'IsParent'},
      { id: 'ParentUID', title: 'ParentUID'},

      // establishment properties
      { id: 'MainServiceFKValue', title: 'MainServiceByID'},
      { id: 'MainServiceValue', title: 'MainService'},
      { id: 'MainServiceCapacity', title: 'MainServiceCapacity'},
      { id: 'MainServiceUtilisation', title: 'MainServiceUtilisation'},


      { id: 'EmployerTypeValue', title: 'EmployerType'},
      { id: 'NumberOfStaffValue', title: 'NumberOfStaff'},
      { id: 'OtherServices', title: 'OtherServices'},
      { id: 'Capacities', title: 'Capacities'},
      { id: 'ServiceUsers', title: 'ServiceUsers'},
      { id: 'ShareDataValue', title: 'ShareData'},
      { id: 'ShareDataWithCQC', title: 'ShareWithCQC'},
      { id: 'ShareDataWithLA', title: 'ShareWithLA'},
      { id: 'LocalAuthorities', title: 'LocalAuthorities'},
      { id: 'VacanciesValue', title: 'Vacancies'},
      { id: 'StartersValue', title: 'Starters'},
      { id: 'LeaversValue', title: 'Leavers'},
    ]
  });

  const workerCsvWriter  = createObjectCsvStringifier({
    header: [
      // establishment
      { id: 'WorkerDataSource', title: 'WorkerDataSource'},
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
      { id: 'NmdsID', title: 'NmdsID'},

      // workers
      { id: 'WorkerUID', title: 'WorkerUID'},
      { id: 'TribalWorkerID', title: 'TribalID'},
      { id: 'WorkerCreated', title: 'WorkerCreated'},
      { id: 'WorkerUpdated', title: 'WorkerUpdated'},
      { id: 'Archived', title: 'Archived'},
      { id: 'LeaveReasonFK', title: 'LeaveReason'},
      { id: 'CompletedValue', title: 'Completed'},

      // WDF
      { id: 'WorkerLastWdfEligibility', title: 'LastWdfEligibility'},

      // worker properties
      { id: 'ContractValue', title: 'Contract'},
      { id: 'MainJobFKValue', title: 'MainJobByID'},
      { id: 'MainJobValue', title: 'MainJob'},
      { id: 'ApprovedMentalHealthWorkerValue', title: 'ApprovedMentalHealthWorker'},
      { id: 'MainJobStartDateValue', title: 'MainJobStartDate'},
      { id: 'OtherJobsValue', title: 'OtherJobs'},
      { id: 'NationalInsuranceNumberValue', title: 'NationalInsuranceNumber'},
      { id: 'DateOfBirthValue', title: 'Age'},
      { id: 'CssRCalculated', title: 'CssrID'},
      { id: 'DisabilityValue', title: 'DisabilityValue'},
      { id: 'GenderValue', title: 'Gender'},
      { id: 'EthnicityFKValue', title: 'EthnicityByID'},
      { id: 'EthnicityValue', title: 'Ethnicity'},
      { id: 'NationalityValue', title: 'Nationality'},
      { id: 'NationalityOther', title: 'GivenNationality'},
      { id: 'CountryOfBirthValue', title: 'CountryOfBirth'},
      { id: 'CountryOfBirthOther', title: 'GivenCountryOfBirth'},
      { id: 'RecruitedFromValue', title: 'RecruitedFrom'},
      { id: 'RecruitedFromOther', title: 'GivenRecruitedFrom'},
      { id: 'BritishCitizenshipValue', title: 'BritishCitizenship'},
      { id: 'YearArrivedValue', title: 'YearArrived'},
      { id: 'SocialCareStartDateValue', title: 'SocialCareStartDate'},
      { id: 'DaysSickValue', title: 'DaysSick'},
      { id: 'ZeroHoursContractValue', title: 'ZeroHoursContract'},
      { id: 'WeeklyHoursAverageValue', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursAverageHours', title: 'WeeklyHoursAverage'},
      { id: 'WeeklyHoursContractedValue', title: 'WeeklyHoursContracted'},
      { id: 'WeeklyHoursContractedHours', title: 'WeeklyHoursContracted'},
      { id: 'AnnualHourlyPayValue', title: 'AnnualHourlyPay'},
      { id: 'AnnualHourlyPayRate', title: 'AnnualHourlyPay'},
      { id: 'CareCertificateValue', title: 'CareCertificate'},
      { id: 'ApprenticeshipTrainingValue', title: 'ApprenticeshipTraining'},
      { id: 'QualificationInSocialCareValue', title: 'QualificationInSocialCare'},
      { id: 'SocialCareQualificationFKValue', title: 'SocialCareQualificationByID'},
      { id: 'SocialCareQualificationValue', title: 'SocialCareQualification'},
      { id: 'OtherQualificationsValue', title: 'OtherQualifications'},
      { id: 'HighestQualificationFKValue', title: 'HighestQualificationByID'},
      { id: 'HighestQualificationValue', title: 'HighestQualification'},
      { id: 'RegisteredNurseValue', title: 'RegisteredNurseValue'},
      { id: 'NurseSpecialismValue', title: 'NurseSpecialismValue'},
    ]
  });

  const establishmentsCsv = establishmentCsvWriter.getHeaderString().concat(establishmentCsvWriter.stringifyRecords(establishments));
  const workersCsv = workerCsvWriter.getHeaderString().concat(workerCsvWriter.stringifyRecords(mappedWorkers));

  return {
    establishmentsCsv,
    workersCsv
  };
};