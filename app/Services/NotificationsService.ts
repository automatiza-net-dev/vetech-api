import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import Bill from "App/Models/Bill";
import Budget, { BudgetStatus } from "App/Models/Budget";
import { AuthContext } from "App/Services/SharedService";

type Notification = {
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
	public async fullNotifications(
		authCtx: AuthContext,
	): Promise<{ data: Notification[] }> {
		const grid = await Promise.all([
			this.undefinedRoles(authCtx),
			this.pendingBills(authCtx),
			this.pendingBudgets(authCtx),
		]);

		const grouped = grid.reduce((acc, curr) => {
			return acc.concat(...curr.data);
		}, [] as Notification[]);

		return { data: grouped };
	}

	public async undefinedRoles(
		authCtx: AuthContext,
	): Promise<{ data: Notification[] }> {
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
	): Promise<{ data: Notification[] }> {
		const pendingBills = await Bill.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("pending", true);

		if (pendingBills.length === 0) {
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
	): Promise<{ data: Notification[] }> {
		const pendingBudgets = await Budget.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("pending", true)
			.whereNot("status", BudgetStatus.N);

		if (pendingBudgets.length === 0) {
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
}
