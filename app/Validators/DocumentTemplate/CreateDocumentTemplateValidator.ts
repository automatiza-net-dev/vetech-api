import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateDocumentTemplateValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		title: schema.string({}, []),
		description: schema.string({}, []),
		header: schema.string.optional({}, []),
		template: schema.string.optional({}, []),
		file: schema.file.optional({ extnames: ["doc", "docx"] }),
	});

	public messages: CustomMessages = {};
}
