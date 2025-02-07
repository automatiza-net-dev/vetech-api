import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class FastCreatePatientValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		tutorName: schema.string.optional({}),
		tutorEmail: schema.string.optional({}, [rules.email()]),
		tutorPhone: schema.string({}),
		tutorOriginId: schema.string.optional({}, [
			rules.exists({
				table: "client_origins",
				column: "id",
			}),
		]),
		patientName: schema.string.optional({}),
		patientRaceId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({
				table: "races",
				column: "id",
			}),
		]),
		patientGender: schema.string.optional(),
	});

	public messages: CustomMessages = {};
}
