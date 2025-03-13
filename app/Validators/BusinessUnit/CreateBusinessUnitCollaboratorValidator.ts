import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateBusinessUnitCollaboratorValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		systemId: schema.number([rules.exists({ table: "systems", column: "id" })]),
		roleId: schema.number([
			rules.exists({
				column: "id",
				table: "roles",
			}),
		]),
		name: schema.string({}),
		email: schema.string({}),
		password: schema.string({}, [rules.confirmed()]),
	});

	public messages: CustomMessages = {};
}
