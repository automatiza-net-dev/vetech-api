import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { FinanceType } from "App/Models/Finance";
import { PaymentMethodType } from "App/Models/PaymentMethod";

export default class UpdateGroupedFinanceDownValidator {
	constructor(protected ctx: HttpContextContract) {}

	/*
	 * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
	 *
	 * For example:
	 * 1. The username must be of data type string. But then also, it should
	 *    not contain special characters or numbers.
	 *    ```
	 *     schema.string([ rules.alpha() ])
	 *    ```
	 *
	 * 2. The email must be of data type string, formatted as a valid
	 *    email. But also, not used by any other user.
	 *    ```
	 *     schema.string([
	 *       rules.email(),
	 *       rules.unique({ table: 'users', column: 'email' }),
	 *     ])
	 *    ```
	 */
	public schema = schema.create({
		idList: schema.array().members(
			schema.string({}, [
				rules.uuid(),
				rules.exists({
					table: "finances",
					column: "id",
				}),
			]),
		),
		tefAcquirerId: schema.string([
			rules.exists({ table: "tef_acquirers", column: "id" }),
		]),

		paymentMethodId: schema.string.optional([
			rules.exists({ table: "payment_methods", column: "id" }),
		]),
		tefFlagId: schema.string.optional([
			rules.exists({ table: "tef_flags", column: "id" }),
		]),
		type: schema.enum.optional(Object.values(FinanceType)),
		expirationDate: schema.date.optional(),
		tef: schema.string.optional(),
	});

	/**
	 * Custom messages for validation failures. You can make use of dot notation `(.)`
	 * for targeting nested fields and array expressions `(*)` for targeting all
	 * children of an array. For example:
	 *
	 * {
	 *   'profile.username.required': 'Username is required',
	 *   'scores.*.number': 'Define scores as valid numbers'
	 * }
	 *
	 */
	public messages: CustomMessages = {};
}
