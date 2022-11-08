import {
  CheckingAccountOperation,
  CheckingAccountType,
} from 'App/Models/CheckingAccount';

export interface IOpenCheckingAccountData {
  description: string;
  accountNumber: string;
  bankCode: string;
  bankName: string;
  agency: string;
  type: CheckingAccountType;
}

export interface IUpdateCheckingAccountData {
  description: string;
  bankCode: string;
  bankName: string;
  agency: string;
  agencyPhone: string;
  managerName: string;
  managerPhone: string;
  managerEmail: string;
  limit: number;
  type: CheckingAccountType;
  active: boolean;
}

export interface IUpdateCheckingAccountBalanceData {
  amount: number;
  operation: CheckingAccountOperation;
}
