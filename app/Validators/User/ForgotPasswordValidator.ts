import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class ForgotPasswordValidator {
	constructor(protected ctx: HttpContextContract) {}
	public schema = schema.create({
		systemId: schema.number([rules.exists({ table: "systems", column: "id" })]),
		email: schema.string({}, [
			rules.email(),
			rules.exists({ table: "users", column: "email" }),
		]),
	});
	public messages: CustomMessages = {};
}
