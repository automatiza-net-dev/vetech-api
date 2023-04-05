import { BedType } from 'App/Models/Bed';

export default interface IBedData {
  name: string;
  tag: string;
  type: BedType;
  active: boolean;
}
