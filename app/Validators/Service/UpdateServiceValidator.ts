import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { PServiceType } from "App/Models/Product";

export default class UpdateServiceValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		description: schema.string({}, []),
		referenceCode: schema.string.optional({}, []),
		courtesy: schema.boolean.optional([]),
		subgroupId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "subgroups",
				column: "id",
			}),
		]),
		features: schema.string.optional({}, []),
		taxationGroupId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "taxation_groups",
				column: "id",
			}),
		]),
		unitId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "units",
				column: "id",
			}),
		]),
		serviceCode: schema.string.optional(),
		active: schema.boolean(),
		serviceType: schema.enum(PServiceType),
	});

	public messages: CustomMessages = {};
}
