import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class RequestBillCancellationValidator {
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
		reasonId: schema.string.optional([
			rules.exists({ table: "reasons", column: "id" }),
		]),
		cancelReason: schema.string.optional(),
		billId: schema.string([rules.exists({ table: "bills", column: "id" })]),
		billItems: schema.array().members(
			schema.object().members({
				id: schema.string([
					rules.exists({ table: "bill_items", column: "id" }),
				]),
				quantity: schema.number([]),
			}),
		),
		billPayments: schema
			.array()
			.members(
				schema.string([rules.exists({ table: "bill_payments", column: "id" })]),
			),

		notes: schema.string.optional(),
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
