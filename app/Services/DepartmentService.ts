import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Department from "App/Models/Department";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";

@inject()
export default class DepartmentService {
	constructor(private _sharedService: SharedService) {}

	async index(
		authCtx: AuthContext,
		data: { type?: string; id?: string; description?: string; active?: string },
	) {
		if (!data.type || (data.type !== "portal" && data.type !== "sistema")) {
			throw new BadRequestException("Tipo inválido de 'tipo'");
		}

		const qb = Department.query()
			.preload("creationUser")
			.preload("updateUser")
			.where("system_id", authCtx.system.id);

		if (data.type === "portal") {
			qb.whereRaw("(economic_group_id is null and business_unit_id is null)");
		}

		if (data.type === "sistema") {
			qb.whereRaw(
				"((economic_group_id is null or economic_group_id = ?) and (business_unit_id is null or business_unit_id = ?))",
				[authCtx.group.id, authCtx.unit.id],
			);
		}

		if (data.id) {
			qb.where("id", data.id);
		}

		if (data.description) {
			qb.whereRaw("description ilike ?", [`%${data.description}%`]);
		}

		if (data.active === "Ativos") {
			qb.whereRaw("active is true", []);
		}
		if (data.active === "Inativos") {
			qb.whereRaw("active is not true", []);
		}

		const result = await qb;

		return result.map((r) => ({
			system_id: r.system_id,
			economic_group_id: r.economic_group_id,
			business_unit_id: r.business_unit_id,
			id: r.id,
			description: r.description,
			active: r.active,
			created_at: r.createdAt,
			create_user_id: r.creationUser.id,
			create_user_name: r.creationUser.name,
			updated_at: r.updatedAt,
			update_user_id: r.updateUser ? r.updateUser.id : null,
			update_user_name: r.updateUser ? r.updateUser.name : null,
		}));
	}

	async store(
		authCtx: AuthContext,
		data: {
			economicGroupId?: string;
			businessUnitId?: string;

			description: string;
		},
	) {
		return Department.create({
			economic_group_id: data.economicGroupId,
			business_unit_id: data.businessUnitId,
			system_id: authCtx.system.id,
			creation_user_id: authCtx.user.id,

			description: data.description,
			active: true,
		});
	}

	async update(
		authCtx: AuthContext,
		id: string,
		data: {
			businessUnitId?: string;

			description: string;
		},
	) {
		const model = await Department.query()
			.where("id", id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!model) {
			throw new ResourceNotFoundException(
				"Departamento não encontrado",
				400,
				"E_ERR",
			);
		}

		if (!model.economic_group_id) {
			throw new BadRequestException(
				"Não é permitida a alteração de dados de um Departamento padrão do sistema",
				400,
				"E_ERR",
			);
		}

		return model
			.merge({
				business_unit_id: data.businessUnitId,
				updated_user_id: authCtx.user.id,
				description: data.description,
			})
			.save();
	}

	async destroy(authCtx: AuthContext, id: string) {
		const model = await Department.query()
			.where("id", id)
			.where("system_id", authCtx.system.id)
			.first();

		if (!model) {
			throw new ResourceNotFoundException(
				"Departamento não encontrado",
				400,
				"E_ERR",
			);
		}

		if (!model.economic_group_id) {
			throw new BadRequestException(
				"Não é permitida a exclusao de um Departamento padrão do sistema",
				400,
				"E_ERR",
			);
		}

		return model
			.merge({
				deleted_user_id: authCtx.user.id,
				deletedAt: DateTime.now(),
			})
			.save();
	}
}
