import { schema, CustomMessages, rules } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";

export default class UpdateBudgetValidator {
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
	 *
	 */
	public schema = schema.create({
		id: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "budgets", column: "id" }),
		]),
		sellerId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		reviewerId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "users", column: "id" }),
		]),
		clientId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "patients", column: "id" }),
		]),
		dailyMovementId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "daily_movements", column: "id" }),
		]),
		budgetRelatedTypeId: schema.number.optional([
			rules.exists({ table: "bill_related_types", column: "id" }),
		]),
		clientName: schema.string.optional(),
		observation: schema.string.optional(),
		internalObservation: schema.string.optional(),
		budgetDate: schema.date(),
		expirationDate: schema.date(),
		maxDiscount: schema.boolean(),
		items: schema.array().members(
			schema.object().members({
				budgetItemId: schema.string.optional(),
				productVariationId: schema.string([
					rules.uuid(),
					rules.exists({ table: "product_variations", column: "id" }),
				]),
				maxDiscount: schema.boolean(),
				courtesy: schema.boolean.optional(),
				discountValue: schema.number(),
				quantity: schema.number(),
				unitaryValue: schema.number(),
				saleValue: schema.number.optional(),
				budgetItemDepartmentId: schema.number.optional([
					rules.exists({ table: "budget_item_departments", column: "id" }),
				]),
				departmentId: schema.number.optional([
					rules.exists({ table: "departments", column: "id" }),
				]),
				departmentItemId: schema.number.optional([
					rules.exists({ table: "department_items", column: "id" }),
				]),
				observation: schema.string.optional(),
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
