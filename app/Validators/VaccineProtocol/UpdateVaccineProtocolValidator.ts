import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateVaccineProtocolValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		name: schema.string(),
		vaccineId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "vaccines", column: "id" }),
		]),
		specieId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "species", column: "id" }),
		]),
		doses: schema.number([rules.unsigned()]),
		interval: schema.number([rules.unsigned()]),
		expirationDays: schema.number.optional([rules.unsigned()]),
		active: schema.boolean(),
	});

	public messages: CustomMessages = {};
}
