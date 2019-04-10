import { allEstablishments } from "../model/sfc.api";
import { createObjectCsvStringifier } from 'csv-writer';
import { inspect } from 'util';

export const dailySnapshotReportV1 = async (allEstablishmentsAndWorkers) => {
  console.log("WA DEBUG - number of Workers: ", allEstablishmentsAndWorkers.length);

  const csvWriter = createObjectCsvStringifier({
    header: [
      { id: 'EstablishmentID', title: 'EstablishmentID'},
      { id: 'EstablishmentUID', title: 'EstablishmentUID'},
    ]
  });
  return csvWriter.getHeaderString().concat(csvWriter.stringifyRecords(allEstablishmentsAndWorkers));
};

export const dailySnapshotReportV2 = async (allEstablishmentsAndWorkers) => {
  console.log("WA DEBUG - number of Workers: ", allEstablishmentsAndWorkers.length);

  const csvWriter = createObjectCsvStringifier({
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
      { id: 'MainServiceFKValue', title: 'MainService'},
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

      // workers
      { id: 'WorkerUID', title: 'WorkerUID'},
      { id: 'WorkerCreated', title: 'WorkerCreated'},
      { id: 'WorkerUpdated', title: 'WorkerUpdated'},
      { id: 'Archived', title: 'Archived'},
      { id: 'LeaveReasonFK', title: 'LeaveReason'},
      { id: 'CompletedValue', title: 'Completed'},

      // worker properties
      { id: 'ContractValue', title: 'Contract'},
      { id: 'MainJobFKValue', title: 'MainJob'},
      { id: 'ApprovedMentalHealthWorkerValue', title: 'ApprovedMentalHealthWorker'},
      { id: 'MainJobStartDateValue', title: 'MainJobStartDate'},
      { id: 'OtherJobsValue', title: 'OtherJobs'},
      { id: 'NationalInsuranceNumberValue', title: 'NationalInsuranceNumber'},
      { id: 'DateOfBirthValue', title: 'Age'},
      { id: 'PostcodeValue', title: 'Postcode'},
      { id: 'DisabilityValue', title: 'DisabilityValue'},
      { id: 'GenderValue', title: 'Gender'},
      { id: 'EthnicityFKValue', title: 'Ethnicity'},
      { id: 'NationalityValue', title: 'Nationality'},
      { id: 'CountryOfBirthValue', title: 'CountryOfBirth'},
      { id: 'RecruitedFromValue', title: 'RecruitedFrom'},
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
      { id: 'SocialCareQualificationFKValue', title: 'SocialCareQualification'},
      { id: 'OtherQualificationsValue', title: 'OtherQualifications'},
      { id: 'HighestQualificationFKValue', title: 'HighestQualification'},

    ]
  });
  return csvWriter.getHeaderString().concat(csvWriter.stringifyRecords(allEstablishmentsAndWorkers));
};