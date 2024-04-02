import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import { TDocumentTemplateType } from "App/Models/DocumentTemplate";

export default interface IDocumentTemplateData {
	description: string;
	title: string;
	type: TDocumentTemplateType;
	header?: string;
	template?: string;
	file?: MultipartFileContract;
	active: boolean;
}
