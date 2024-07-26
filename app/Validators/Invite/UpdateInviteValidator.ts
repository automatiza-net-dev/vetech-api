import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateInviteValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		businessUnitId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "business_units",
				column: "id",
			}),
		]),
		roleId: schema.number([
			rules.exists({
				table: "roles",
				column: "id",
			}),
		]),
		email: schema.string({}, [rules.email()]),
	});

	public messages: CustomMessages = {};
}
