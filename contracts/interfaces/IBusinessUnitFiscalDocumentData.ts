import {
  FiscalDocumentMovementType,
  FiscalDocumentType,
} from 'App/Models/FiscalDocument';

export default interface IBusinessUnitFiscalDocumentData {
  type: FiscalDocumentType;
  movement: FiscalDocumentMovementType;
  description: string;
  model: string;
  series: string;
  sequence: number;
}
