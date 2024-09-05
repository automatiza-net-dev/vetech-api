import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreateBillPaymentValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		billId: schema.string({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "bills", column: "id" }),
		]),
		paymentMethodId: schema.string({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "payment_methods", column: "id" }),
		]),
		paymentMethodFlagId: schema.string.optional({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "payment_method_flags", column: "id" }),
		]),
		paymentMethodFlagInstallmentId: schema.number.optional([
			rules.exists({ table: "payment_method_flag_installments", column: "id" }),
		]),
		acquirerId: schema.string.optional({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "tef_acquirers", column: "id" }),
		]),
		flagId: schema.string.optional({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "tef_flags", column: "id" }),
		]),
		budgetPaymentId: schema.number.optional([
			rules.exists({ table: "budget_payments", column: "id" }),
		]),
		expirationDate: schema.date(),
		installmentsValue: schema.number([]),
		maxParcelas: schema.boolean.optional(),
		nsuDocument: schema.string.optional(),
		installments: schema.number.optional(),
	});

	public messages: CustomMessages = {};
}
