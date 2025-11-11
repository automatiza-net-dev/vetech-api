import { inject } from "@adonisjs/fold";
import { DateTime } from "luxon";
import WhatsappMessagesConfig from "App/Models/WhatsAppMessagesConfig";
import SharedService, { AuthContext } from "App/Services/SharedService";

interface ISearch {
	whatsappPhone?: string;
	platformIntegration?: string;
	status?: string;
	connectionStatus?: string;
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
			whatsappPhone: string;
			platformIntegration: string;
		},
	) {
		await WhatsappMessagesConfig.create({
			business_unit_id: authCtx.unit.id,
			user_id_created: authCtx.user.id,
			user_id_updated: authCtx.user.id,
			whatsappPhone: data.whatsappPhone,
			platformIntegration: data.platformIntegration,
			connectionStatus: "Teste",
			connectionStatusDate: DateTime.now(),
			active: true,
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: {
			whatsappPhone?: string;
			platformIntegration?: string;
			connectionStatus?: string;
			active?: boolean;
		},
	) {
		const model = await this.show(authCtx, id);

		await model
			.merge({
				user_id_updated: authCtx.user.id,

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

	public async processWebhook(
		configID: string,
		data: {
			account: {
				code: string;
				name: string;
			};
			name: string;
			phone: string;
			phone_e164: string;
			event_type: string;
			first_interaction_at: string;
			last_interaction_at: string;
			created: string;
			visit: { name: string };
		},
		rawPayload: unknown,
	) {
		const config = await WhatsappMessagesConfig.query()
			.where("id", configID)
			.where("active", true)
			.whereNull("deleted_at")
			.first();

		if (!config) {
			return;
		}

		await config.related("messages").create({
			platformIntegration: "tintim",
			phone: data.phone,
			// message: data.me,
			payload: rawPayload,
			processedMessage: data.visit.name,
			processed: true,
			eventCreated: DateTime.fromISO(data.created),
			lastEventInteraction: DateTime.fromISO(data.last_interaction_at),
		});
	}
}
