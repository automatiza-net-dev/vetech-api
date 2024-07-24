import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { AuthContext } from "App/Services/SharedService";

@inject()
export default class NotificationsService {
	public async undefinedRoles(authCtx: AuthContext) {
		const [undefinedRoles] = await Database.from("role_permissions")
			.select(Database.raw("count(id) as count"))
			.whereIn(
				"role_id",
				authCtx.$roleMetas.map((r) => r.role_id),
			);

		if (undefinedRoles.count === 0) {
			return {
				response: {
					data: [],
				},
			};
		}

		return {
			response: {
				data: [
					{
						id: 1,
						title: "Controle Acesso",
						status: "",
						message:
							"Existem acessos que ainda não definidos para os Perfis de Acesso desta Unidade. Clique Aqui para ir para a tela de Controles de Acessos.",
						createdAt: new Date(),
						createdAtText: new Date(),
						isRead: false,
						link: "/dashboard/controle-acesso",
					},
				],
			},
		};
	}
}
