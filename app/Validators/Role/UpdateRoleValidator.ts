import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";

export default class UpdateRoleValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string({}, []),
		externalAccess: schema.boolean(),
		active: schema.boolean(),
		profileAccessIdList: schema
			.array([rules.minLength(1)])
			.members(
				schema.number([
					rules.exists({ table: "profile_accesses", column: "id" }),
				]),
			),
	});

	public messages: CustomMessages = {
		minLength: "É necessario informar pelo menos um Departamento para o Acesso",
	};
}
