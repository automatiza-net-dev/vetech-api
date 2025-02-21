import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateBillValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		clientId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		financialResponsibleId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		patientId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		dailyMovementId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "daily_movements", column: "id" }),
		]),
		scheduleId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "schedules", column: "id" }),
		]),
		billDate: schema.date(),

		additionalInformation: schema.string.optional(),
		budgetId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "budgets", column: "id" }),
		]),

		internalCode: schema.string.optional(),
		originBillId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "bills", column: "id" }),
		]),

		maxDiscount: schema.boolean([]),

		items: schema.array().members(
			schema.object().members({
				productVariationId: schema.string({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "product_variations", column: "id" }),
				]),
				quantity: schema.number([]),
				unitaryValue: schema.number([]),
				discountValue: schema.number([]),
				courtesy: schema.boolean.optional([]),
				maxDiscount: schema.boolean.optional([]),
				approved: schema.boolean.optional([]),
			}),
		),
	});

	public messages: CustomMessages = {};
}
