import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class CreatePatientEvaluationValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		patientId: schema.string({}, [rules.uuid()]),
		resume: schema.string(),
		protocol: schema.string(),
		realizedAt: schema.date(),
		observation: schema.string.optional(),
		internalObservation: schema.string.optional(),
		technicianId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "users",
				column: "id",
			}),
		]),
		scheduleServiceId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "schedule_service_types",
				column: "id",
			}),
		]),
		photos: schema.array.optional().members(
			schema.file({
				extnames: ["jpg", "gif", "png", "jpeg"],
			}),
		),
	});

	public messages: CustomMessages = {};
}
