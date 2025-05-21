import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";

export default class CreateRoleValidator {
	constructor(protected ctx: HttpContextContract) {}

	// profiles: {
	// 	id: number;
	// 	screens: { id: number; permissions: { id: number }[] }[];
	// }[];
	public schema = schema.create({
		name: schema.string({}, []),
		externalAccess: schema.boolean(),
		profiles: schema.array().members(
			schema.object().members({
				id: schema.number(),
				active: schema.boolean(),
			}),
		),
		screens: schema.array().members(
			schema.object().members({
				id: schema.number(),
				permissions: schema.array().members(
					schema.object().members({
						id: schema.number(),
            active: schema.boolean.optional(),
            status: schema.boolean.optional(),
					}),
				),
			}),
		),
	});

	public messages: CustomMessages = {
		minLength: "É necessario informar pelo menos um Departamento para o Acesso",
	};
}
