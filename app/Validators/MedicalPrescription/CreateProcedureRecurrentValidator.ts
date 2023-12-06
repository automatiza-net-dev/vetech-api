import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, schema } from "@ioc:Adonis/Core/Validator";
import {
	MedicalPrescriptionFrequencyQuantityUnit,
	MedicalPrescriptionFrequencyUnit,
} from "App/Models/MedicalPrescription";

export default class CreateProcedureRecurrentValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		frequencyInterval: schema.number.optional(),
		frequencyUnit: schema.enum.optional(
			Object.values(MedicalPrescriptionFrequencyUnit),
		),
		frequencyQuantity: schema.number.optional(),
		frequencyQuantityUnit: schema.enum.optional(
			Object.values(MedicalPrescriptionFrequencyQuantityUnit),
		),
	});

	public messages: CustomMessages = {};
}
