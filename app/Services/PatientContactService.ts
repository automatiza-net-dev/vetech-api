import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import PatientContact, { PatientContactType } from "App/Models/PatientContact";
import PatientTutor from "App/Models/PatientTutor";
import SharedService, { AuthContext } from "App/Services/SharedService";

@inject()
export default class PatientContactService {
	constructor(private sharedService: SharedService) {}

	async index(authCtx: AuthContext, patientId: string) {
		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", patientId)
			.preload("contacts")
			.first();

		if (!patient) {
			throw this.sharedService.ResourceNotFound();
		}

		return patient.contacts;
	}

	async store(
		authCtx: AuthContext,
		data: {
			patientId: string;
			main: boolean;
			notGiven: boolean;
			contact?: string;
			observation?: string;
			type: (typeof PatientContactType)[number];
		},
	) {
		const patient = await authCtx.group
			.related("patients")
			.query()
			.where("patient_id", data.patientId)
			.preload("tutor")
			.first();

		if (!patient) {
			throw this.sharedService.ResourceNotFound();
		}

		if (data.type === "celular") {
			await PatientTutor.query().where("patient_id", data.patientId).update({
				cellphone: data.contact,
			});
		}

		if (data.type === "email" && data.contact) {
			await PatientTutor.query().where("patient_id", data.patientId).update({
				email: data.contact,
			});
		}

		if (["residencial", "comercial", "recado"].includes(data.type)) {
			await PatientTutor.query().where("patient_id", data.patientId).update({
				telephone: data.contact,
			});
		}

		await patient.related("contacts").create({
			main: data.main,
			contact: data.contact ?? patient?.tutor.email,
			observation: data.observation,
			type: data.type,
			notGiven: data.notGiven,
		});
	}

	async batchStore(
		authCtx: AuthContext,
		data: {
			items: {
				patientId: string;
				main: boolean;
				notGiven: boolean;
				contact?: string;
				observation?: string;
				type: (typeof PatientContactType)[number];
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			if (
				data.items.some(
					(i) => i.type === "email" && i.notGiven === false && !i.contact,
				)
			) {
				throw new BadRequestException(
					"O contato de email é obrigatório",
					400,
					"E_MISSING",
				);
			}

			const uniquePatients = new Set(data.items.map((i) => i.patientId));

			const patients = await authCtx.group
				.related("patients")
				.query()
				.useTransaction(trx)
				.whereIn("patient_id", Array.from(uniquePatients));

			const tasks = patients.map((elem) => {
				const items = data.items.filter((f) => f.patientId === elem.id);

				return elem.related("contacts").createMany(
					items.map((inner) => ({
						main: inner.main,
						contact: inner.contact,
						observation: inner.observation,
						type: inner.type,
						notGiven: inner.notGiven,
					})),
					{ client: trx },
				);
			});

			const result = await Promise.all(tasks);

			const updateTasks = result.flat().map((elem) => {
				if (elem.type === "celular") {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							cellphone: elem.contact,
						});
				}

				if (elem.type === "email") {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							email: elem.contact,
						});
				}

				if (["residencial", "comercial", "recado"].includes(elem.type)) {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							telephone: elem.contact,
						});
				}
			});
			await Promise.all(updateTasks);
		});
	}

	async update(
		authCtx: AuthContext,
		id: number,
		data: {
			main: boolean;
			notGiven: boolean;
			contact?: string;
			observation?: string;
			type: (typeof PatientContactType)[number];
			active: boolean;
		},
	) {
		await Database.transaction(async (trx) => {
			const contact = await PatientContact.query()
				.useTransaction(trx)
				.where("id", id)
				.whereHas("patient", (query) => {
					query.whereHas("economicGroup", (query) => {
						query.where("economic_group_id", authCtx.group.id);
					});
				})
				.first();

			if (!contact) {
				throw this.sharedService.ResourceNotFound();
			}

			if (data.type === "celular") {
				await PatientTutor.query()
					.where("patient_id", contact.patient_id)
					.update({
						cellphone: data.contact,
					});
			}

			if (data.type === "email") {
				await PatientTutor.query()
					.where("patient_id", contact.patient_id)
					.update({
						email: data.contact,
					});
			}

			if (["residencial", "comercial", "recado"].includes(data.type)) {
				await PatientTutor.query()
					.where("patient_id", contact.patient_id)
					.update({
						telephone: data.contact,
					});
			}

			await contact.merge(data).useTransaction(trx).save();
		});
	}
	async batchUpdate(
		authCtx: AuthContext,
		data: {
			items: {
				id: number;
				main: boolean;
				notGiven: boolean;
				contact: string;
				observation?: string;
				type: (typeof PatientContactType)[number];
				active: boolean;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			if (
				data.items.some(
					(i) => i.type === "email" && i.notGiven === false && !i.contact,
				)
			) {
				throw new BadRequestException(
					"O contato de email é obrigatório",
					400,
					"E_MISSING",
				);
			}

			const contacts = await PatientContact.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((i) => i.id),
				)
				.whereHas("patient", (query) => {
					query.whereHas("economicGroup", (query) => {
						query.where("economic_group_id", authCtx.group.id);
					});
				});

			if (contacts.length < data.items.length) {
				throw new BadRequestException(
					"Algum contato não foi encontrado",
					400,
					"E_MISSING",
				);
			}

			const tasks = contacts.map((elem) => {
				const entry = data.items.find((f) => f.id === elem.id);

				if (!entry) {
					throw new BadRequestException(
						"Algum contato não foi encontrado",
						400,
						"E_MISSING",
					);
				}

				return elem
					.merge({
						main: entry.main,
						contact: entry.contact,
						observation: entry.observation,
						type: entry.type,
						active: entry.active,
					})
					.useTransaction(trx)
					.save();
			});
			const result = await Promise.all(tasks);

			const updateTasks = result.map((elem) => {
				if (elem.type === "celular") {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							cellphone: elem.contact,
						});
				}

				if (elem.type === "email") {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							email: elem.contact,
						});
				}

				if (["residencial", "comercial", "recado"].includes(elem.type)) {
					return PatientTutor.query()
						.where("patient_id", elem.patient_id)
						.update({
							telephone: elem.contact,
						});
				}
			});
			await Promise.all(updateTasks);
		});
	}

	async destroy(authCtx: AuthContext, id: number) {
		const contact = await PatientContact.query()
			.where("id", id)
			.whereHas("patient", (query) => {
				query.whereHas("economicGroup", (query) => {
					query.where("economic_group_id", authCtx.group.id);
				});
			})
			.first();

		if (!contact) {
			throw this.sharedService.ResourceNotFound();
		}

		await contact.delete();
	}
}
