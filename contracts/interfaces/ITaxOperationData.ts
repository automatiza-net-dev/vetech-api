import { MovementCategory, MovementType } from 'App/Models/TaxationGroupRule';

export default interface ITaxOperation {
  code: string;
  description: string;
  movementType: MovementType;
  movementCategory: MovementCategory;
  generatesFinancial: boolean;
  accountingResult: boolean;
  active: boolean;
}
