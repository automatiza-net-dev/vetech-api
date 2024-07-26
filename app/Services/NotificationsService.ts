import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "App/Services/SharedService";

type Notification = {
	id: number;
	title: string;
	status: string;
	message: string;
	createdAt: string;
	createdAtText: string;
	isRead: boolean;
	link: string;
};

@inject()
export default class NotificationsService {
	public async fullNotifications(
		authCtx: AuthContext,
	): Promise<{ data: Notification[] }> {
		const grid = await Promise.all([this.undefinedRoles(authCtx)]);

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
					createdAt: new Date().toISOString(),
					createdAtText: new Date().toISOString(),
					isRead: false,
					link: "/dashboard/controle-acesso",
				},
			],
		};
	}
}
