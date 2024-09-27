import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema, rules } from "@ioc:Adonis/Core/Validator";
import { AccountPlanGroupType } from "App/Models/AccountPlanGroup";

export default class UpdateAccountPlanGroupValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		dreGroupId: schema.number.optional([
			rules.exists({
				table: "dre_groups",
				column: "id",
			}),
		]),
		description: schema.string(),
		type: schema.enum(Object.values(AccountPlanGroupType)),
		active: schema.boolean(),
	});
	public messages: CustomMessages = {};
}
