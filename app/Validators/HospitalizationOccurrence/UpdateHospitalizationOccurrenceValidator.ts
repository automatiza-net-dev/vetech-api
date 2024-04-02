import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateHospitalizationOccurrenceValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		hospitalizationId: schema.string({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "hospitalizations", column: "id" }),
		]),
		occurrenceId: schema.string({ trim: true }, [
			rules.uuid(),
			rules.exists({ table: "occurrences", column: "id" }),
		]),
		hospitalizationMedicalPrescriptionId: schema.string.optional(
			{ trim: true },
			[
				rules.uuid(),
				rules.exists({
					table: "hospitalization_medical_prescriptions",
					column: "id",
				}),
			],
		),
		executedAt: schema.date(),
		previewedAt: schema.date(),
		description: schema.string({ trim: true }),
		resume: schema.string({ trim: true }),
		active: schema.boolean(),
	});

	public messages: CustomMessages = {};
}
