import Database from "@ioc:Adonis/Lucid/Database";
import { test } from "@japa/runner";
import Attendance from "App/Models/Attendance";
import { PatientType } from "App/Models/Patient";
import Schedule from "App/Models/Schedule";
import ScheduleServiceType from "App/Models/ScheduleServiceType";
import {
	SS_ATTENDANCE_FINISHED,
	SS_LATE,
	SS_NOT_CONFIRMED,
} from "App/Models/ScheduleStatus";
import { IAttendanceData } from "Contracts/interfaces/IAttendanceData";
import { ICreateTreatment } from "Contracts/interfaces/ITreatmentData";
import PatientFactory from "Database/factories/PatientFactory";
import { DateTime } from "luxon";

import { generateJwtToken, userBootstrap } from "../utils";

test.group("Attendance resource", (group) => {
	group.each.setup(async () => {
		await Database.beginGlobalTransaction();
		return () => Database.rollbackGlobalTransaction();
	});

	const createData = async () => {
		const { user, business, group } = await userBootstrap();

		const patient = await PatientFactory.create();
		await patient.merge({ type: PatientType.ANIMAL }).save();

		const holder = await PatientFactory.create();
		await holder.merge({ type: PatientType.TUTOR }).save();
		await holder.related("tutor").create({
			document: "94562755000123",
			street: "some street",
			number: "123",
			district: "some district",
			city: "some city",
			state: "some state",
		});

		await patient.related("tutors").attach([holder.id]);
		await group.related("patients").attach([patient.id, holder.id]);

		const client = Database.connection();
		await client
			.from("holder_dependents")
			.where("dependent_id", patient.id)
			.where("holder_id", holder.id)
			.update({ is_main: true });

		const attendance = await Attendance.create({
			business_unit_id: business.id,
			patient_id: patient.id,
			tutor_id: holder.id,
			startDate: DateTime.now().minus({ hour: 1 }),
		});

		const scheduleServiceType = await ScheduleServiceType.create({
			description: "Agendado (Confirmado)",
			reservedMinutes: 30,
		});

		return { user, patient, holder, attendance, scheduleServiceType, business };
	};

	test("should get all attendances", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client.get(`/attendances`).bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should get all attendances with qs", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const qs = new URLSearchParams();
		qs.append("description", "some");
		qs.append("resume", "some");
		qs.append("patient", props.patient.id);
		qs.append("tutor", props.holder.id);
		const response = await client
			.get(`/attendances?${qs.toString()}`)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should get attendance", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.get(`/attendances/show/${props.attendance.id}`)
			.bearerToken(token);

		assert.equal(200, response.status());
	});

	test("should throw BadRequestException if opening with no relevant info", async ({
		assert,
		client,
	}) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.post(`/attendances/open`)
			.json({
				protocol: "some",
				scheduleServiceId: props.scheduleServiceType.id,
				internalObservation: "some",
			} as ICreateTreatment)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should open attendance with schedule", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const schedule = await Schedule.create({
			patientName: "any name",
			patientPhone: "any phone",
			holder_id: props.holder.id,
			age: 2,
			startHour: DateTime.now(),
			endHour: DateTime.now(),
			majorComplaint: "some complaint",
			business_unit_id: props.business.id,
			user_id: props.user.id,
			patient_id: props.holder.id,
			schedule_service_type_id: props.scheduleServiceType.id,
			schedule_status_id: SS_LATE,
		});

		const response = await client
			.post(`/attendances/open`)
			.json({
				protocol: "some",
				scheduleServiceId: props.scheduleServiceType.id,
				scheduleId: schedule.id,
			} as ICreateTreatment)
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should open attendance with patient with schedule", async ({
		assert,
		client,
	}) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		await Schedule.create({
			patientName: "any name",
			patientPhone: "any phone",
			holder_id: props.holder.id,
			age: 2,
			startHour: DateTime.now(),
			endHour: DateTime.now(),
			majorComplaint: "some complaint",
			business_unit_id: props.business.id,
			user_id: props.user.id,
			patient_id: props.patient.id,
			schedule_service_type_id: props.scheduleServiceType.id,
			schedule_status_id: SS_NOT_CONFIRMED,
		});

		const response = await client
			.post(`/attendances/open`)
			.json({
				protocol: "some",
				scheduleServiceId: props.scheduleServiceType.id,
				patientId: props.patient.id,
			} as ICreateTreatment)
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should open attendance with patient no schedule", async ({
		assert,
		client,
	}) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.post(`/attendances/open`)
			.json({
				protocol: "some",
				scheduleServiceId: props.scheduleServiceType.id,
				patientId: props.patient.id,
			} as ICreateTreatment)
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should open attendance with internal observation", async ({
		assert,
		client,
	}) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.post(`/attendances/open`)
			.json({
				protocol: "some",
				internalObservation: "some",
				scheduleServiceId: props.scheduleServiceType.id,
				patientId: props.patient.id,
			} as ICreateTreatment)
			.bearerToken(token);

		assert.equal(201, response.status());
	});

	test("should update attendance", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.put(`/attendances/update/${props.attendance.id}`)
			.json({
				protocol: "some",
				resume: "some",
				scheduleServiceId: SS_ATTENDANCE_FINISHED,
			} as IAttendanceData)
			.bearerToken(token);

		assert.equal(204, response.status());
	});

	test("should throw BadRequestException if attendance is already close", async ({
		assert,
		client,
	}) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		await props.attendance.merge({ endDate: DateTime.now() }).save();

		const response = await client
			.put(`/attendances/close/${props.attendance.id}`)
			.bearerToken(token);

		assert.equal(400, response.status());
	});

	test("should close attendance", async ({ assert, client }) => {
		const props = await createData();
		const token = await generateJwtToken(client, {
			email: props.user.email,
			password: "102030",
		});

		const response = await client
			.put(`/attendances/close/${props.attendance.id}`)
			.bearerToken(token);

		assert.equal(204, response.status());
	});
});
