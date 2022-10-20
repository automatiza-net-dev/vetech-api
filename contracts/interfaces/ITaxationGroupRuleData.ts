import {
  CompanyType,
  COMPLETE_ICMS,
  IPI_CST,
  MovementCategory,
  MovementType,
  PIS_CST__COFINS_CST,
} from 'App/Models/TaxationGroupRule';

export default interface ITaxationGroupRuleData {
  companyType: CompanyType;
  movementType: MovementType;
  movementCategory: MovementCategory;
  fromUf: string;
  toUf: string;
  icmsCst: typeof COMPLETE_ICMS[number];
  icmsPerc: number;
  icmsPercRedAliquota: number;
  icmsPercRedBaseCalculo: number;
  ivaIcmsSt: number;
  fcpPerc: number;
  taxBenefitCode: string;
  ipiCst: typeof IPI_CST[number];
  ipiPerc: number;
  pisCst: typeof PIS_CST__COFINS_CST[number];
  pisPerc: number;
  cofinsCst: typeof PIS_CST__COFINS_CST[number];
  cofinsPerc: number;
  icmsPercRedBaseCalculoST: number;
  icmsPercDiferimento: number;
  active: boolean;

  taxationGroupId: string;
  taxOperationId: string;
}
