import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { CustomMessages, rules, schema } from "@ioc:Adonis/Core/Validator";
import WeekDay from "App/Models/shared/WeekDay";

export default class CreateManyWorkingDayValidator {
	constructor(protected ctx: HttpContextContract) {}

	public schema = schema.create({
		items: schema.array().members(
			schema.object().members({
				id: schema.string({}, [
					rules.uuid(),
					rules.exists({
						table: "working_days",
						column: "id",
					}),
				]),
				userId: schema.string({}, [
					rules.uuid(),
					rules.exists({
						table: "users",
						column: "id",
					}),
				]),
				dayOfWeek: schema.enum(Object.values(WeekDay), []),
				startHour: schema.string({}),
				endHour: schema.string({}),
			}),
		),
	});

	public messages: CustomMessages = {};
}
