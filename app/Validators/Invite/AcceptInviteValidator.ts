import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class AcceptInviteValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		id: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "invites",
				column: "id",
			}),
		]),
		email: schema.string(),
		password: schema.string(),
	});

	public messages: CustomMessages = {};
}
