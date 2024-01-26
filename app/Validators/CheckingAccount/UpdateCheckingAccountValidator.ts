import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";
import { CheckingAccountType } from "App/Models/CheckingAccount";

export default class UpdateCheckingAccountValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		description: schema.string(),
		type: schema.enum(Object.values(CheckingAccountType)),
		active: schema.boolean(),

		accountNumber: schema.string.optional(),
		bankCode: schema.string.optional(),
		bankName: schema.string.optional(),
		agency: schema.string.optional(),
		businessUnitId: schema.string.nullableAndOptional([
			rules.uuid(),
			rules.exists({ table: "business_units", column: "id" }),
		]),
		agencyPhone: schema.string.optional(),
		managerName: schema.string.optional(),
		managerPhone: schema.string.optional(),
		managerEmail: schema.string.optional(),
		limit: schema.number.optional(),
	});

	public messages: CustomMessages = {};
}
