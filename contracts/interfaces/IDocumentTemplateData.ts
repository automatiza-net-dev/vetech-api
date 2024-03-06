import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";

export default interface IDocumentTemplateData {
	description: string;
	title: string;
	header?: string;
	template?: string;
	file?: MultipartFileContract;
	active: boolean;
}
