import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";
import { ClientOriginType } from "App/Models/ClientOrigin";

export default class CreateClientOriginValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		clientOriginGroupId: schema.number([
			rules.exists({ table: "client_origin_groups", column: "id" }),
		]),
		type: schema.enum(Object.values(ClientOriginType)),
		description: schema.string(),
	});

	public messages: CustomMessages = {};
}
