export default interface ITaxOperation {
  code: string;
  description: string;
  movementType: string; // TODO fix correct type
  movementCategory: string; // TODO fix correct type
  generatesFinancial: boolean;
  financialTrouble: boolean;
  active: boolean;
}
