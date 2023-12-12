import {
  CheckingAccountOperation,
  CheckingAccountType,
} from 'App/Models/CheckingAccount';

export interface IOpenCheckingAccountData {
  description: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  type: CheckingAccountType;
  agency: string;

  businessUnitId?: string;
  agencyPhone?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  limit?: number;
}

export interface IUpdateCheckingAccountData {
  description: string;
  bankCode: string;
  bankName: string;
  agency: string;
  active: boolean;

  businessUnitId?: string | null;
  agencyPhone?: string;
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  limit?: number;
  type?: CheckingAccountType;
}

export interface IUpdateCheckingAccountBalanceData {
  amount: number;
  operation: CheckingAccountOperation;
}
