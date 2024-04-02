import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";
import { DocumentTemplateType } from "App/Models/DocumentTemplate";

export default class UpdateDocumentTemplateValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		title: schema.string({}, []),
		description: schema.string({}, []),
		header: schema.string.optional({}, []),
		type: schema.enum(DocumentTemplateType),
		template: schema.string.optional({}, []),
		file: schema.file.optional({ extnames: ["doc", "docx"] }),
		active: schema.boolean([]),
	});

	public messages: CustomMessages = {};
}
