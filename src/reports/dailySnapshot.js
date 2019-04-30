import { allEstablishments } from "../model/sfc.api";
import { createObjectCsvStringifier } from 'csv-writer';
import { findService, findJob, findEthnicity, findCountry, findNationality, findRecruitmentSource, findQualification } from '../utils/findBy';
import { inspect } from 'util';

const separateEstablishments = (allEstablishmentsAndWorkers, referenceServices) => {
  const establishments = [];
  const establishmentIds = [];

  allEstablishmentsAndWorkers.forEach(thisWorker => {
    if (!establishmentIds.includes(thisWorker.EstablishmentID)) {
      establishmentIds.push(thisWorker.EstablishmentID);

      const thisEstablishment = thisWorker;
      const mainServiceByName = findService(referenceServices, thisEstablishment.MainServiceFKValue);
      thisEstablishment.MainServiceValue = mainServiceByName ? mainServiceByName.name : null;
      establishments.push(thisEstablishment);
    }
  });

  return establishments;
}

export const dailySnapshotReportV2 = async (allEstablishmentsAndWorkers, referenceLookups) => {
  console.log("Calling Version 2 of snapshot report")
  const establishments = separateEstablishments(allEstablishmentsAndWorkers, referenceLookups.services);
  
  // remap the workers, which includes calculated CssR ID (the first letter on NMDS ID)
  const workers = allEstablishmentsAndWorkers.map(thisWorker => {
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
      { id: 'NmdsID', title: 'NmdsID'},
      { id: 'NameValue', title: 'Name'},
      { id: 'IsRegulated', title: 'IsRegulated'},
      { id: 'PostCode', title: 'PostCode'},
      { id: 'EstablishmentCreated', title: 'EstablishmentCreated'},
      { id: 'EstablishmentUpdated', title: 'EstablishmentUpdated'},

      // establishment properties
      { id: 'MainServiceFKValue', title: 'MainServiceByID'},
      { id: 'MainServiceValue', title: 'MainService'},
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
      { id: 'WorkerCreated', title: 'WorkerCreated'},
      { id: 'WorkerUpdated', title: 'WorkerUpdated'},
      { id: 'Archived', title: 'Archived'},
      { id: 'LeaveReasonFK', title: 'LeaveReason'},
      { id: 'CompletedValue', title: 'Completed'},

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
  const workersCsv = workerCsvWriter.getHeaderString().concat(workerCsvWriter.stringifyRecords(workers));

  return {
    establishmentsCsv,
    workersCsv
  };
};


export const dailySnapshotReportV3 = async (allEstablishmentsAndWorkers, referenceLookups) => {
  const establishments = separateEstablishments(allEstablishmentsAndWorkers, referenceLookups.services);

  // remap the workers, which includes calculated CssR ID (the first letter on NMDS ID)
  const workers = allEstablishmentsAndWorkers.map(thisWorker => {
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
      { id: 'NmdsID', title: 'NmdsID'},
      { id: 'NameValue', title: 'Name'},
      { id: 'IsRegulated', title: 'IsRegulated'},
      { id: 'PostCode', title: 'PostCode'},
      { id: 'EstablishmentCreated', title: 'EstablishmentCreated'},
      { id: 'EstablishmentUpdated', title: 'EstablishmentUpdated'},

      // WDF
      { id: 'OverallWdfEligibility', title: 'OverallWdfEligibility'},
      { id: 'EstablishmentLastWdfEligibility', title: 'LastWdfEligibility'},

      // establishment properties
      { id: 'MainServiceFKValue', title: 'MainServiceByID'},
      { id: 'MainServiceValue', title: 'MainService'},
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
  const workersCsv = workerCsvWriter.getHeaderString().concat(workerCsvWriter.stringifyRecords(workers));

  return {
    establishmentsCsv,
    workersCsv
  };
};