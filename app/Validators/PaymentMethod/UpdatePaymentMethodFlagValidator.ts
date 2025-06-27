import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdatePaymentMethodFlagValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		tefAcquirerId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "tef_acquirers", column: "id" }),
		]),
		active: schema.boolean(),
		maxInstallments: schema.number.optional(),
		daysUntilTransfer: schema.number.optional(),
		installmentsWithoutPassword: schema.number.optional(),
		flagInstallments: schema.array().members(
			schema.object().members({
				id: schema.number([
					rules.exists({
						table: "payment_method_flag_installments",
						column: "id",
					}),
				]),
				fee: schema.number(),
			}),
		),
	});

	public messages: CustomMessages = {};
}
