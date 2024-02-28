import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateOpportunityValidator {
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
		userId: schema.string([
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		statusId: schema.number([
			rules.exists({ table: "crm_statuses", column: "id" }),
		]),
		contactDate: schema.date(),
		clientOriginItemDescription: schema.string.optional({}, []),

		businessUnitId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "business_units", column: "id" }),
		]),
		contactId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		contactTypeId: schema.number.optional([
			rules.exists({ table: "contact_types", column: "id" }),
		]),
		contactSubjectId: schema.number.optional([
			rules.exists({ table: "contact_subjects", column: "id" }),
		]),
		clientId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		raceId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "races", column: "id" }),
		]),
		originId: schema.string.optional([
			rules.uuid(),
			rules.exists({ table: "client_origins", column: "id" }),
		]),

		description: schema.string.optional(),
		observation: schema.string.optional(),
		value: schema.number.optional(),
		active: schema.boolean(),
		gender: schema.string.optional(),
		weight: schema.number.optional(),
		castrated: schema.boolean.optional(),
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
