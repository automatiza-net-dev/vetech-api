import { BusinessUnitFiscalDocumentMovementType } from 'App/Models/BusinessUnitFiscalDocument';
import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

export default interface IBusinessUnitFiscalDocumentData {
  type: FiscalDocumentType;
  movement: FiscalDocumentMovementType;
  fiscalDocumentId: string;
  description: string;
  model: string;
  series: string;
  sequence: number;
}

export interface IAuthorizeFiscalDocument {
  billId: string;
  unitFiscalDocumentId: string;
  type: BusinessUnitFiscalDocumentMovementType;
  accessKeyRef: string;
}

export interface IAuthorizeNfseFiscalDocument {
  billId: string;
  unitFiscalDocumentId: string;
}

export interface ICancelFiscalDocument {
  issuedDocumentId: string;
  reason: string;
}

export interface IDisableFiscalDocument {
  issuedDocumentId: string;
  reason: string;
}

export interface ICorrectFiscalDocument {
  issuedDocumentId: string;
  reason: string;
}
