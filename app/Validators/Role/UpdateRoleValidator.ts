import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateRoleValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string({}, []),
		externalAccess: schema.boolean(),
		active: schema.boolean(),
		profiles: schema.array().members(
			schema.object().members({
				id: schema.number(),
			}),
		),
		screens: schema.array().members(
			schema.object().members({
				id: schema.number(),
				permissions: schema.array().members(
					schema.object().members({
						id: schema.number(),
					}),
				),
			}),
		),
	});

	public messages: CustomMessages = {
		minLength: "É necessario informar pelo menos um Departamento para o Acesso",
	};
}
