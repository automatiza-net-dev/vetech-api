import { UnitType } from 'App/Models/Unit';

export default interface IUnitData {
  name: string;
  tag: string;
  type: UnitType;
  active: boolean;
}
