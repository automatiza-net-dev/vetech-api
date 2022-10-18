export default interface ITaxOperation {
  code: string;
  description: string;
  movementType: string; // TODO fix correct type
  movementCategory: string; // TODO fix correct type
  generatesFinancial: boolean;
  accountingResult: boolean;
  active: boolean;
}
