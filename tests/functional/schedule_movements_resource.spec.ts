import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import { PatientType } from "App/Models/Patient";
import Schedule from "App/Models/Schedule";
import Bill from "App/Models/Bill";
import PatientFactory from "Database/factories/PatientFactory";
import ScheduleServiceTypeFactory from "Database/factories/ScheduleServiceTypeFactory";
import ScheduleStatusFactory from "Database/factories/ScheduleStatusFactory";
import { DateTime } from "luxon";

import { generateJwtToken, userBootstrap } from "../utils";
import Budget, { BudgetStatus } from "App/Models/Budget";
import ScheduleMovementsService from "App/Services/ScheduleMovementsService";

test.group("Schedule Movements resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, business, system, group } = await userBootstrap();

		const status = await ScheduleStatusFactory.create();
		const serviceType = await ScheduleServiceTypeFactory.create();

		const holder = await PatientFactory.create();
		await holder.merge({ type: PatientType.TUTOR }).save();

		const patient = await PatientFactory.create();
		await patient.merge({ type: PatientType.ANIMAL }).save();

		await holder.related("dependents").attach([patient.id]);

		const schedule = await Schedule.create({
			patientName: "any name",
			patientPhone: "any phone",
			holder_id: holder.id,
			age: 2,
			startHour: DateTime.now(),
			endHour: DateTime.now().endOf("day"),
			majorComplaint: "some complaint",
			business_unit_id: business.id,
			user_id: user.id,
			patient_id: holder.id,
		});

		const bill = await Bill.create({
			economic_group_id: group.id,
			business_unit_id: business.id,
			user_id: user.id,
			seller_id: user.id,
			tag: "2024_00001",
		});

		const budget = await Budget.create({
			business_unit_id: business.id,
			status: BudgetStatus.A,
		});

		return {
			user,
			status,
			serviceType,
			business,
			holder,
			system,
			patient,
			schedule,
			bill,
			budget,
		};
	};

	test("should create", async ({ assert, client }) => {
		const { user, schedule, bill, budget } = await createData();
		const token = await generateJwtToken(client, {
			email: user.email,
			password: "102030",
		});

		const result = await client
			.post("/schedule-movements/store")
			.json({
				items: [
					{
						scheduleId: schedule.id,
						movementId: bill.id,
						type: "bill",
					},

					{
						scheduleId: schedule.id,
						movementId: budget.id,
						type: "budget",
					},
				] as Parameters<ScheduleMovementsService["createScheduleMovements"]>[1],
			})
			.bearerToken(token);

		assert.equal(201, result.status());
	});
});
