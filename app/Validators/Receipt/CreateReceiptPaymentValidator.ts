import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateReceiptPaymentValidator {
	constructor(protected ctx: HttpContextContract) {}

	/*
	 * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
	 *
	 * For example:
	 * 1. The username must be of data type string. But then also, it should
	 *    not contain special characters or numbers.
	 *    ```
	 *     schema.string({}, [ rules.alpha() ])
	 *    ```
	 *
	 * 2. The email must be of data type string, formatted as a valid
	 *    email. But also, not used by any other user.
	 *    ```
	 *     schema.string({}, [
	 *       rules.email(),
	 *       rules.unique({ table: 'users', column: 'email' }),
	 *     ])
	 *    ```
	 */
	public schema = schema.create({
		receiptId: schema.string([
			rules.uuid(),
			rules.exists({ table: "receipts", column: "id" }),
		]),
		items: schema.array().members(
			schema.object().members({
				paymentMethodId: schema.string({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "payment_methods", column: "id" }),
				]),
				tefAcquirerId: schema.string.optional({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "tef_acquirers", column: "id" }),
				]),
				tefFlagId: schema.string.optional({ trim: true }, [
					rules.uuid(),
					rules.exists({ table: "tef_flags", column: "id" }),
				]),

				installments: schema.number(),
				installmentValue: schema.number([]),
				issueDate: schema.date(),
				expirationDate: schema.date(),
				nsuDocument: schema.string.optional(),
			}),
		),
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
