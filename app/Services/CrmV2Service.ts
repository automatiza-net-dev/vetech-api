import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import CrmStatus, { CrmStatusType } from "App/Models/CrmStatus";
import Kanban from "App/Models/Kanban";
import KanbanUser from "App/Models/KanbanUser";
import { DateTime } from "luxon";
import { AuthContext } from "./SharedService";

@inject()
export default class CrmV2Service {
	public async listKanbans(
		authCtx: AuthContext,
		data: {
			businessUnitId?: string;
			description?: string;
			type?: string;
			active?: string;
		},
	) {
		const qb = Kanban.query()
			.where("kanbans.economic_group_id", authCtx.group.id)
			.whereNull("kanbans.deleted_at")
			.preload("creationUser")
			.preload("updatedUser")
			.preload("users", (query) => {
				query.whereNull("deleted_at");

				query.preload("user");
			})
			.preload("crmStatuses");

		if (data.businessUnitId) {
			qb.where("kanbans.business_unit_id", data.businessUnitId);
		}

		if (data.description) {
			qb.whereILike(
				"kanbans.description",
				`%${data.description
					.split(" ")
					.map((r) => r.trim())
					.filter(Boolean)
					.join("|")}%`,
			);
		}

		if (data.active === "true") {
			qb.whereRaw("kanbans.active is true");
		}

		if (data.active === "false") {
			qb.whereRaw("kanbans.active is false");
		}

		const result = await qb;

		return result.map((row) => ({
			id: row.id,
			economic_group_id: row.economic_group_id,
			business_unit_id: row.business_unit_id,
			description: row.description,
			type: row.type,
			active: row.active,
			created_at: row.createdAt,
			user_creation_id: row.creationUser.id,
			user_creation_name: row.creationUser.name,
			updated_at: row.updatedAt,
			user_update_id: row.updatedUser?.id ?? null,
			user_update_name: row.updatedUser?.name ?? null,
			kanban_users: row.users.map((inner) => ({
				user_id: inner.user_id,
				user_name: inner.user.name,
				active: inner.active,
			})),
			crm_statuses: row.crmStatuses.map((inner) => ({
				id: inner.id,
				description: inner.description,
				type: inner.type,
				tag: inner.tag,
				ganho: inner.ganho,
				perda: inner.perda,
				sync_schedules: inner.syncSchedules,
				order: inner.order,
				active: inner.active,
			})),
		}));
	}

	public async createKanban(
		authCtx: AuthContext,
		data: {
			businessUnitId?: string;
			users: string[];
			description: string;
			type?: "text";
			crmStatuses: {
				description: string;
				order: number;
				ganhoStatus: boolean;
				perdaStatus: boolean;
				syncSchedules: boolean;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: data.businessUnitId,
					user_creation_id: authCtx.user.id,

					description: data.description,
					type: data.type,
				},
				{ client: trx },
			);

			await KanbanUser.createMany(
				data.users.map((row) => ({
					kanban_id: kanban.id,
					user_creation_id: authCtx.user.id,
					user_id: row,
				})),
				{ client: trx },
			);

			await CrmStatus.createMany(
				data.crmStatuses.map<Partial<CrmStatus>>((row) => ({
					economic_group_id: authCtx.group.id,
					kanban_id: kanban.id,
					system_id: authCtx.system.id,
					user_creation_id: authCtx.user.id,

					description: row.description,
					type: "OP" as CrmStatusType,
					ganho: row.ganhoStatus,
					perda: row.perdaStatus,
					order: row.order,
					syncSchedules: row.syncSchedules,
				})),
				{ client: trx },
			);
		});
	}

	public async updateKanban(
		authCtx: AuthContext,
		data: {
			id: number;
			businessUnitId?: string;
			users: string[];
			description: string;
			type?: "text";
			active: boolean;
			crmStatuses: {
				id?: number;
				description: string;
				order: number;
				ganhoStatus: boolean;
				perdaStatus: boolean;
				syncSchedules: boolean;
				active: boolean;
			}[];
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.first();

			if (!kanban) {
				throw new ResourceNotFoundException(
					"Kanban não encontrado",
					404,
					"E_ERR",
				);
			}

			await kanban
				.merge({
					business_unit_id: data.businessUnitId,
					user_updated_id: authCtx.user.id,

					description: data.description,
					type: data.type,
					active: data.active,
				})
				.useTransaction(trx)
				.save();

			const existingKanbanUsers = await KanbanUser.query()
				.useTransaction(trx)
				.where("kanban_id", kanban.id);

			const toDelete = existingKanbanUsers.reduce((acc, curr) => {
				if (!data.users.includes(curr.user_id)) {
					acc.push(curr.id);
				}

				return acc;
			}, [] as number[]);

			await KanbanUser.query()
				.useTransaction(trx)
				.whereIn("id", toDelete)
				.delete();

			await KanbanUser.updateOrCreateMany(
				["kanban_id", "user_id"],
				data.users.map((row) => ({
					kanban_id: kanban.id,
					user_creation_id: authCtx.user.id,
					user_id: row,
				})),
				{ client: trx },
			);

			const tasks = data.crmStatuses.map((row) => {
				if (row.id) {
					return CrmStatus.query()
						.useTransaction(trx)
						.where("id", row.id)
						.update({
							user_updated_id: authCtx.user.id,
							description: row.description,
							ganho: row.ganhoStatus,
							perda: row.perdaStatus,
							order: row.order,
							sync_schedules: row.syncSchedules,
							active: row.active,
						});
				}

				return CrmStatus.create(
					{
						economic_group_id: authCtx.group.id,
						kanban_id: kanban.id,
						system_id: authCtx.system.id,
						user_creation_id: authCtx.user.id,
						description: row.description,
						type: "OP",
						ganho: row.ganhoStatus,
						perda: row.perdaStatus,
						order: row.order,
						syncSchedules: row.syncSchedules,
						active: row.active,
					},
					{ client: trx },
				);
			});
			await Promise.all(tasks);
		});
	}

	public async deleteKanban(
		authCtx: AuthContext,
		data: {
			id: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const kanban = await Kanban.query()
				.useTransaction(trx)
				.where("id", data.id)
				.where("economic_group_id", authCtx.group.id)
				.first();

			if (!kanban) {
				throw new ResourceNotFoundException(
					"Kanban não encontrado",
					404,
					"E_ERR",
				);
			}

			await kanban
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}
}
