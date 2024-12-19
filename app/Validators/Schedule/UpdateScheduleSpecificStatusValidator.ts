import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";

export default class UpdateScheduleSpecificStatusValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		scheduleId: schema.string({}, [
			rules.uuid(),
			rules.exists({
				table: "schedules",
				column: "id",
			}),
		]),
		statusId: schema.string({}, [
			rules.uuid(),
			rules.exists({ table: "schedule_statuses", column: "id" }),
		]),

		reasonId: schema.string.optional({}, [
			rules.uuid(),
			rules.exists({ table: "reasons", column: "id" }),
		]),
		observation: schema.string.optional(),
		ignoreConflict: schema.boolean.optional(),
	});

	public messages: CustomMessages = {};
}
