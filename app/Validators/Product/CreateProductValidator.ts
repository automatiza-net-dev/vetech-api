import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import { BusinessUnitProductMetaType } from "App/Models/BusinessUnitProduct";
import { ProductIcmsOrigin, ProductPurpose } from "App/Models/Product";

export default class CreateProductValidator {
	constructor(protected ctx: HttpContextContract) {}

	private price = schema.object().members({
		maximumStock: schema.number.optional([rules.unsigned()]),
		minimumStock: schema.number.optional([rules.unsigned()]),
		maximumDiscountPercentage: schema.number.optional([rules.unsigned()]),
		maximumDiscountValue: schema.number.optional([rules.unsigned()]),
		price: schema.number([rules.unsigned()]),
		costPrice: schema.number.optional([rules.unsigned()]),
		profitMargin: schema.number.optional([rules.unsigned()]),
		commission: schema.number.optional([rules.unsigned()]),
		meta: schema.number.optional([rules.unsigned()]),
		metaType: schema.enum.optional(Object.values(BusinessUnitProductMetaType)),
		commissionMeta: schema.number.optional([rules.unsigned()]),
	});

	public schema = schema.create({
		description: schema.string({}, []),

		courtesy: schema.boolean.optional([]),
		referenceCode: schema.string.optional({}, []),
		collectionYear: schema.number.optional([rules.unsigned()]),

		subgroupId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "subgroups",
				column: "id",
			}),
		]),
		purpose: schema.enum(Object.values(ProductPurpose)),

		features: schema.string.optional({}, []),
		fractioned: schema.boolean.optional(),
		fractionUnitId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "units", column: "id" }),
		]),
		fractionValue: schema.number.optional(),

		taxationGroupId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "taxation_groups",
				column: "id",
			}),
		]),
		icmsOrigin: schema.enum(Object.values(ProductIcmsOrigin), []),

		ncm: schema.string.optional({}, []),
		cest: schema.string.optional({}, []),
		unitId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "units",
				column: "id",
			}),
		]),

		variationGroup: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "variation_groups",
				column: "id",
			}),
		]),
		variations: schema.array().members(
			schema.object().members({
				barcode: schema.string.optional({}),
				price: this.price,
				variation_options: schema.array().members(schema.string()),
				specificPrice: schema.array.optional([rules.minLength(1)]).members(
					schema.object().members({
						business: schema.string({}, [
							rules.uuid(),
							rules.exists({
								table: "business_units",
								column: "id",
							}),
						]),
						price: this.price,
					}),
				),
			}),
		),

		taxBenefitCode: schema.string.optional({}, []),
		anvisaCode: schema.string.optional({}, []),
		groupId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "groups",
				column: "id",
			}),
		]),
	});

	public messages: CustomMessages = {};
}
