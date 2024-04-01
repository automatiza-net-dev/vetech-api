import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class RenderTemplateReplacementValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		documentId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "document_templates",
				column: "id",
			}),
		]),
		businessUnitId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "business_units",
				column: "id",
			}),
		]),
		userId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "users",
				column: "id",
			}),
		]),
		scheduleId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "schedules",
				column: "id",
			}),
		]),
		tutorId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "patients",
				column: "id",
			}),
		]),
		dependentId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "patients",
				column: "id",
			}),
		]),

		tag: schema.string(),
	});

	public messages: CustomMessages = {};
}
