import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import { BudgetStatus } from "App/Models/Budget";
import { AuthContext } from "App/Services/SharedService";
import Notification from "App/Models/Notification";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import { DateTime } from "luxon";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import NotificationUser from "App/Models/NotificationUser";

type LogicalNotification = {
	id: number;
	title: string;
	status: string;
	message: string;
	createdAt: string | null;
	createdAtText: string | null;
	isRead: boolean;
	link: string;
};

@inject()
export default class NotificationsService {
	public async listNotifications(authCtx: AuthContext) {
		const notifications = await Database.from("notifications")
			.select(Database.raw("id, is_required, type, message, image"))
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.whereNull("deleted_at")
			.whereRaw(
				"id not in (select notification_id from notification_users where user_id = ?)",
				[authCtx.user.id],
			);

		await NotificationUser.createMany(
			notifications.map((n) => ({
				notification_id: n.id,
				user_id: authCtx.user.id,
				read_at: DateTime.now(),
				viewed_at: DateTime.now(),
			})),
		);

		return notifications;
	}

	public async createNotification(
		authCtx: AuthContext,
		data: {
			economicGroupId?: string;
			isRequired: boolean;
			type: "Aviso" | "Comunicado";
			message: string;
			image?: MultipartFileContract;
		},
	) {
		const imageKey = data.image
			? `${new Date().getTime()}-${data.image.clientName}`
			: null;
		if (data.image) {
			await data.image.moveToDisk(
				"notifications",
				{
					name: imageKey ?? "NEVER",
					visibility: "private",
					contentType: data.image.extname,
				},
				"s3",
			);
		}

		await Notification.create({
			system_id: authCtx.system.id,
			economic_group_id: data.economicGroupId,
			creation_user_id: authCtx.user.id,
			is_required: data.isRequired,
			type: data.type,
			message: data.message,
			image: imageKey ? `notifications/${imageKey}` : null,
		});
	}

	public async updateNotification(
		authCtx: AuthContext,
		id: string,
		data: {
			economicGroupId?: string;
			isRequired: boolean;
			type: "Aviso" | "Comunicado";
			message: string;
			image?: MultipartFileContract;
		},
	) {
		const notification = await Notification.query()
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			])
			.where("id", id)
			.first();

		if (!notification) {
			throw new ResourceNotFoundException(
				"Notification não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		let imageUrl = notification.image;
		if (data.image) {
			const imageKey = `${new Date().getTime()}-${data.image.clientName}`;
			await data.image.moveToDisk(
				"notifications",
				{
					name: imageKey,
					visibility: "private",
					contentType: data.image.extname,
				},
				"s3",
			);
			imageUrl = `notifications/${imageKey}`;
		}

		await notification
			.merge({
				updated_user_id: authCtx.user.id,
				// economic_group_id: data.economicGroupId,
				is_required: data.isRequired,
				type: data.type,
				message: data.message,
				image: imageUrl,
			})
			.save();
	}

	public async excludeNotification(authCtx: AuthContext, id: string) {
		if (!authCtx.hasPermission("NOT03")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para fazer a atividade",
				400,
				"E_ERR",
			);
		}

		const notification = await Notification.query()
			.where("system_id", authCtx.system.id)
			.whereRaw("economic_group_id = ?", [authCtx.group.id])
			.where("id", id)
			.first();

		if (!notification) {
			throw new ResourceNotFoundException(
				"Notification não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		await notification
			.merge({
				deleted_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			})
			.save();
	}

	public async fullNotifications(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		const grid = await Promise.all([
			this.undefinedRoles(authCtx),
			this.pendingBills(authCtx),
			this.pendingBudgets(authCtx),
			this.pendingBillItemEvaluations(authCtx),
			this.pendingBillPaymentEvaluations(authCtx),
			this.pendingBillPaymentApprovals(authCtx),
		]);

		const grouped = grid.reduce((acc, curr) => {
			return acc.concat(...curr.data);
		}, [] as LogicalNotification[]);

		return { data: grouped };
	}

	public async undefinedRoles(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		const [undefinedRoles] = await Database.from("role_permissions")
			.select(Database.raw("count(id)::int as count"))
			.whereIn(
				"role_id",
				authCtx.$roleMetas.map((r) => r.role_id),
			)
			.whereNull("status");

		if (undefinedRoles.count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Controle Acesso",
					status: "",
					message:
						"Existem acessos que ainda não definidos para os Perfis de Acesso desta Unidade. Clique Aqui para ir para a tela de Controles de Acessos.",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard/controle-acesso",
				},
			],
		};
	}

	public async pendingBills(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		const [{ count }]: { count: number }[] = await Database.from("bills")
			.select(Database.raw("count(bills.id)::int"))
			.where("business_unit_id", authCtx.unit.id)
			.where("pending", true);

		if (count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Vendas Pendentes",
					status: "",
					message:
						"Existem vendas que estão pendentes de liberação de Cortesia / Desconto Máximo. Clique Aqui para ir para a tela de Vendas.",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard/vendas?pending=true",
				},
			],
		};
	}

	public async pendingBudgets(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		const [{ count }]: { count: number }[] = await Database.from("budgets")
			.select(Database.raw("count(budgets.id)::int"))
			.where("business_unit_id", authCtx.unit.id)
			.where("pending", true)
			.whereNot("status", BudgetStatus.N);

		if (count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Orçamentos Pendentes",
					status: "",
					message:
						"Existem orçamentos que estão pendentes de liberação de Cortesia / Desconto Máximo. Clique Aqui para ir para a tela de Orçamentos",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard/orcamentos?pending=true",
				},
			],
		};
	}

	public async pendingBillItemEvaluations(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		if (!authCtx.hasPermission("VEN19")) {
			return { data: [] };
		}

		const [{ count }]: { count: number }[] = await Database.from("bill_items")
			.select(Database.raw("count(bill_items.id)::int"))
			.where("business_unit_id", authCtx.unit.id)
			.where("cancelled", "P");

		if (count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Vendas Pendentes Avaliacao Itens",
					status: "",
					message:
						"Existem Solicitações de Cancelamento de Vendas que necessitam de Avaliação",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard?msg=pending-bill-payment-evaluations",
				},
			],
		};
	}

	public async pendingBillPaymentEvaluations(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		if (!authCtx.hasPermission("VEN20")) {
			return { data: [] };
		}

		const [{ count }]: { count: number }[] = await Database.from(
			"bill_payments",
		)
			.select(Database.raw("count(bill_payments.id)::int"))
			.where("business_unit_id", authCtx.unit.id)
			.where("cancelled", "P");

		if (count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Vendas Pendentes Avaliacao Pagamentos",
					status: "",
					message:
						"Existem Solicitações de Cancelamento de Vendas que necessitam de Avaliação",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard?msg=pending-bill-payment-evaluations",
				},
			],
		};
	}

	public async pendingBillPaymentApprovals(
		authCtx: AuthContext,
	): Promise<{ data: LogicalNotification[] }> {
		if (!authCtx.hasPermission("VEN21")) {
			return { data: [] };
		}

		const [{ count }]: { count: number }[] = await Database.from(
			"bill_payments",
		)
			.select(Database.raw("count(bill_payments.id)::int"))
			.where("business_unit_id", authCtx.unit.id)
			.where("cancelled", "A");

		if (count === 0) {
			return {
				data: [],
			};
		}

		return {
			data: [
				{
					id: 1,
					title: "Vendas Pendentes Aprovação",
					status: "",
					message:
						"Existem Solicitações de Cancelamento de Vendas que foram Avaliadas e estão pendentes de Finalização",
					createdAt: null,
					createdAtText: null,
					isRead: false,
					link: "/dashboard?msg=pending-bill-payment-evaluations",
				},
			],
		};
	}
}
