export type CompanyInfo = {
  name: string;
  phone: string;
  respondent: string;
};

export type VehicleCounts = {
  under3_5t: number | '';
  under5t: number | '';
  under7_5t: number | '';
  under8t: number | '';
  under11t: number | '';
  over11t: number | '';
  towed: number | '';
};

export type LicenseType = 'ordinary' | 'limited5t' | 'semiMedium' | 'limited8t' | 'medium' | 'large' | 'towing';
export type AgeGroup = 'a10' | 'a20' | 'a30' | 'a40' | 'a50' | 'a60';
export type Gender = 'male' | 'female';

export type DriverCount = Record<AgeGroup, Record<Gender, Record<LicenseType, number | ''>>>;

export type RecruitGender = 'male' | 'female' | 'any';
export type RecruitCount = Record<RecruitGender, Record<LicenseType, number | ''>>;

export type SurveyData = {
  company: CompanyInfo;
  vehicles: VehicleCounts;
  drivers: DriverCount;
  recruitment: RecruitCount;
};
