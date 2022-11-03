import { ClientOriginType } from 'App/Models/ClientOrigin';

export default interface IClientOriginData {
  type: ClientOriginType;
  description: string;
  active: boolean;
}
