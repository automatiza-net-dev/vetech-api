import { ClientOriginType } from "App/Models/ClientOrigin";

export default interface IClientOriginData {
	clientOriginGroupId: number;
	type: ClientOriginType;
	description: string;
	active: boolean;
}
