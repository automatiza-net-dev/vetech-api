import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class LoginValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		email: schema.string({}, [
			rules.exists({ table: "users", column: "email" }),
		]),
		password: schema.string({}),
		business_unit_id: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "business_units",
				column: "id",
			}),
		]),
		system: schema.string({}, [
			rules.exists({
				table: "systems",
				column: "name",
			}),
		]),
		systemUrl: schema.string({}, [
			rules.exists({
				table: "system_urls",
				column: "url",
			}),
		]),
		ip: schema.string.optional({}),
	});

	public messages: CustomMessages = {};
}
