import { inject } from "@adonisjs/fold";
import { DateTime } from "luxon";
import WhatsappMessagesConfig from "App/Models/WhatsAppMessagesConfig";
import SharedService, { AuthContext } from "App/Services/SharedService";
import Database from "@ioc:Adonis/Lucid/Database";
import PatientTutor from "App/Models/PatientTutor";
import Patient, { PatientType } from "App/Models/Patient";
import CrmStatus from "App/Models/CrmStatus";
import Opportunity from "App/Models/Opportunity";
import WhatsappClientOrigin from "App/Models/WhatsappClientOrigin";

interface ISearch {
	whatsappPhone?: string;
	platformIntegration?: string;
	status?: string;
	connectionStatus?: string;
}

interface IMessagesSearch {
	platformIntegration?: string;
	whatsappPhone?: string;
	startDate?: string;
	endDate?: string;
	page?: number;
	limit?: number;
}

@inject()
export default class WhatsAppMessagesConfigService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = WhatsappMessagesConfig.query()
			.preload("userCreated", (query) => {
				query.select(["id", "name"]);
			})
			.preload("userUpdated", (query) => {
				query.select(["id", "name"]);
			})
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("deleted_at");

		if (data.whatsappPhone) {
			qb.whereILike("whatsapp_phone", `%${data.whatsappPhone}%`);
		}

		if (data.platformIntegration) {
			qb.where("platform_integration", data.platformIntegration);
		}

		if (data.status) {
			const active = data.status === "Ativo";
			qb.where("active", active);
		}

		if (data.connectionStatus) {
			qb.where("connection_status", data.connectionStatus);
		}

		return qb;
	}

	public async searchMessages(
		authCtx: AuthContext,
		configId: string,
		data: IMessagesSearch,
	) {
		const config = await this.show(authCtx, configId);

		const qb = config.related("messages").query();

		if (data.platformIntegration) {
			qb.where("platform_integration", data.platformIntegration);
		}

		if (data.whatsappPhone) {
			qb.whereILike("phone", `%${data.whatsappPhone}%`);
		}

		if (data.startDate) {
			qb.whereRaw("created_at::date >= ?", [data.startDate]);
		}

		if (data.endDate) {
			qb.whereRaw("created_at::date <= ?", [data.endDate]);
		}

		return qb;
	}

	public async show(authCtx: AuthContext, id: string) {
		const model = await WhatsappMessagesConfig.query()
			.preload("userCreated", (query) => {
				query.select(["id", "name"]);
			})
			.preload("userUpdated", (query) => {
				query.select(["id", "name"]);
			})
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("deleted_at")
			.where("id", id)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		return model;
	}

	public async store(
		authCtx: AuthContext,
		data: {
			tintimClientId: string;
			whatsappPhone: string;
			platformIntegration: string;
		},
	) {
		await WhatsappMessagesConfig.create({
			business_unit_id: authCtx.unit.id,
			user_id_created: authCtx.user.id,
			user_id_updated: authCtx.user.id,
			tintimClientId: data.tintimClientId,
			whatsappPhone: data.whatsappPhone,
			platformIntegration: data.platformIntegration,
			connectionStatus: "Pendente",
			connectionStatusDate: DateTime.now(),
			active: true,
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: {
			whatsappPhone: string;
			tintinClientId: string;
			platformIntegration: string;
			connectionStatus: string;
			active: boolean;
		},
	) {
		const model = await this.show(authCtx, id);

		await model
			.merge({
				user_id_updated: authCtx.user.id,

				tintimClientId: data.tintinClientId,
				whatsappPhone: data.whatsappPhone,
				platformIntegration: data.platformIntegration,
				connectionStatus: data.connectionStatus,
				active: data.active,
			})
			.save();
	}

	public async delete(authCtx: AuthContext, id: string) {
		const model = await this.show(authCtx, id);

		await model
			.merge({
				deletedAt: DateTime.now(),
			})
			.save();
	}

	public async processTintimWebhook(
		data: {
			account: {
				code: string;
				name: string;
			};
			source: string;
			name: string;
			phone: string;
			phone_e164: string;
			event_type: string;
			first_interaction_at: string;
			last_interaction_at: string;
			created: string;
			created_isoformat: string;
			visit: { name: string };
		},
		rawPayload: unknown,
	) {
		return Database.transaction(async (trx) => {
			const config = await WhatsappMessagesConfig.query()
				.useTransaction(trx)
				.preload("businessUnit", (query) => {
					query.preload("economicGroup");
				})
				.where("tintim_client_id", data.account.code)
				.where("active", true)
				.whereNull("deleted_at")
				.first();

			if (!config) {
				return;
			}

			const tutors = await PatientTutor.query()
				.useTransaction(trx)
				.whereRaw("(cellphone = ? or telephone = ?)", [data.phone, data.phone]);

			await config.related("messages").create(
				{
					platformIntegration: "tintim",
					phone: data.phone,
					payload: rawPayload,
					processedMessage: data.visit.name,
					processed: true,
					eventCreated: DateTime.fromISO(data.created_isoformat),
					lastEventInteraction: DateTime.fromISO(data.last_interaction_at),
					message:
						tutors.length > 0 ? "Cliente já existente" : "Criou oportunidade",
				},
				{
					client: trx,
				},
			);

			if (data.event_type === "lead.create") {
				if (tutors.length > 0) {
					return;
				}

				const origin = await WhatsappClientOrigin.query()
					.useTransaction(trx)
					.where("system_id", config.businessUnit.economicGroup.system_id)
					.where("platform_integration", "Tintim")
					.where("description_origin", data.source)
					.first();

				const [{ next_id = 1 }] = await Database.from("economic_groups")
					.select(Database.raw(`max(coalesce(tag, '0')::int) + 1 as next_id`))
					.joinRaw(
						"left join patient_economic_groups on economic_groups.id = patient_economic_groups.economic_group_id",
					)
					.joinRaw(
						"left join patients on patient_economic_groups.patient_id = patients.id",
					)
					.where("economic_groups.id", config.businessUnit.economicGroupId);

				const patient = await Patient.create(
					{
						name: data.name,
						type: PatientType.TUTOR,
						tag: next_id.toString(),
						clientOriginItemDescription: "Tintim",
					},
					{ client: trx },
				);

				await patient.related("tutor").create(
					{
						client_origin_id: origin?.client_origin_id,
						cellphone: data.phone,
					},
					{
						client: trx,
					},
				);

				await config.businessUnit.economicGroup
					.related("patients")
					.attach([patient.id], trx);

				const status = await CrmStatus.query()
					.useTransaction(trx)
					.where("system_id", config.businessUnit.economicGroup.system_id)
					.where("type", "OP")
					.where("tag", "N")
					.first();
				if (!status) {
					return;
				}

				await Opportunity.create(
					{
						system_id: config.businessUnit.economicGroup.system_id,
						business_unit_id: config.businessUnit.id,
						economic_group_id: config.businessUnit.economicGroupId,
						opening_user_id: config.user_id_created,
						user_id: config.user_id_created,
						contact_id: patient.id,
						status_id: status.id,
						openingDate: DateTime.now(),
						contactDate: DateTime.now(),
						description: "Tintim",
						value: 0,
						active: true,
						origin: "agenda",
						// client_id: patient.id,
					},
					{
						client: trx,
					},
				);
			}
		});
	}
}
