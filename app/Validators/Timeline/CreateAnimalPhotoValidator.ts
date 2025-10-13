import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateAnimalPhotoValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		tag: schema.string({}, [rules.uuid()]),
		technicianId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "users",
				column: "id",
			}),
		]),
		photos: schema.array().members(
			schema.file({
				extnames: [
					"jpg",
					"gif",
					"png",
					"jpeg",
					"doc",
					"docx",
					"txt",
					"xls",
					"xlsx",
					"pdf",
				],
			}),
		),
		title: schema.string.optional({}, []),
		observation: schema.string.optional({}, []),
		createdAt: schema.date.optional({}, []),
	});

	public messages: CustomMessages = {};
}
