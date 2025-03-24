import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Department from "App/Models/Department";
import DepartmentProduct from "App/Models/DepartmentProduct";
import { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import DepartmentItem from "App/Models/DepartmentItem";
import { v4 } from "uuid";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";

@inject()
export default class DepartmentService {
	async resume(
		authCtx: AuthContext,
		data: { type?: string; id?: string; description?: string },
	) {
		const qb = Department.query().where("system_id", authCtx.system.id);

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

		const result = await qb;

		return result.map((r) => ({
			systemId: r.system_id,
			economicGroupId: r.economic_group_id,
			businessUnitId: r.business_unit_id,
			departmentId: r.id,
			description: r.description,
		}));
	}

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
			.preload("items", (query) => {
				query.whereNull("deleted_at");
			})
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
			items: r.items.map((row) => ({
				id: row.id,
				description: row.description,
				photo: row.photo,
				requiresObservation: row.requiresObservation,
			})),
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

	async listDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId?: string;
			productId?: string;
		},
	) {
		if (!data.departmentId) {
			throw new BadRequestException(
				"É preciso informar o departamento",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("departments")
			.select(
				Database.raw(`departments.id,
       departments.description,
       COALESCE
       (json_agg(
        json_build_object('id', products.id, 'description', products.description, 'active', products.active
        )
                ) FILTER (WHERE products.id IS NOT NULL),
        '[]'::json) as products`),
			)
			.joinRaw(
				"left join department_products on departments.id = department_products.department_id and department_products.deleted_at is null",
			)
			.joinRaw(
				"left join products on department_products.product_id = products.id",
			)
			.whereRaw(
				"(departments.system_id = ? and departments.id = ? and departments.deleted_at is null)",
				[authCtx.system.id, data.departmentId],
			)
			.whereRaw("products.deleted_at is null")
			.groupBy("departments.id");

		if (data.productId) {
			qb.whereRaw("products.id = ?", [data.productId]);
		}

		return qb.firstOrFail();
	}

	async listDepartmentItems(
		authCtx: AuthContext,
		data: {
			departmentId?: string;
			description?: string;
			active?: string;
		},
	) {
		if (!data.departmentId) {
			throw new BadRequestException(
				"É preciso informar o departamento",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("departments")
			.select(
				Database.raw(`departments.id,
       departments.description,
       COALESCE
       (json_agg(
        json_build_object('id', department_items.id, 'description', department_items.description, 'photo',
                          department_items.photo, 'requiresObservation', department_items.requires_observation
        )
                ) FILTER (WHERE department_items.id IS NOT NULL),
        '[]'::json) as items`),
			)
			.joinRaw(
				"join department_items on departments.id = department_items.department_id and department_items.deleted_at is null",
			)
			.whereRaw(
				"(departments.system_id = ? and departments.id = ? and departments.deleted_at is null)",
				[authCtx.system.id, data.departmentId],
			)
			.groupBy("departments.id");

		if (data.description) {
			qb.whereRaw("department_items.description ilike ?", [
				`%${data.description}%`,
			]);
		}

		if (data.active === "Ativos") {
			qb.whereRaw("department_items.active is true", []);
		}
		if (data.active === "Inativos") {
			qb.whereRaw("department_items.active is not true", []);
		}

		return qb.firstOrFail();
	}

	async listDepartmentProductsForMovements(
		authCtx: AuthContext,
		data: {
			departmentId?: string;
		},
	) {
		const deptosQb = Department.query().where("system_id", authCtx.system.id);

		const productsQb = Database.from("department_items")
			.select(
				Database.raw(`departments.id as depto_id,
       products.id,
       products.description,
       products.type,
       products.courtesy,
       business_unit_products.stock,
       business_unit_products.maximum_discount_percentage,
       business_unit_products.price,
       business_unit_products.cost_price`),
			)
			.joinRaw(
				"join departments on department_items.department_id = departments.id and departments.system_id = ? and departments.economic_group_id = ?",
				[authCtx.system.id, authCtx.group.id],
			)
			.joinRaw(`join department_products
              on departments.id = department_products.department_id and department_products.deleted_at is null and
                 department_products.active = true`)
			.joinRaw(`join products on department_products.product_id = products.id and products.deleted_at is null and
                          products.active is true`)
			.joinRaw(`join product_variations
              on products.id = product_variations.product_id and product_variations.deleted_at is null`)
			.joinRaw(
				`join business_unit_products on business_unit_products.product_variation_id = product_variations.id and
                                        business_unit_products.deleted_at is null and
                                        business_unit_products.businness_unit_id = ?`,
				[authCtx.unit.id],
			)
			.whereRaw("department_items.deleted_at is null")
			.whereRaw("departments.deleted_at is null")
			.whereRaw("department_products.deleted_at is null")
			.whereRaw("products.deleted_at is null")
			.whereRaw("product_variations.deleted_at is null")
			.whereRaw("departments.active is true")
			.whereRaw("department_items.active is true")
			.whereRaw("department_products.active is true")
			.whereRaw("products.active is true")
			.whereRaw("products.purpose <> 'internal'");

		const itemsQb = Database.from("department_items")
			.select(
				Database.raw(`departments.id as depto_id,
       department_items.id,
       department_items.description,
       department_items.photo,
       department_items.requires_observation`),
			)
			.joinRaw(
				"join departments on department_items.department_id = departments.id and departments.system_id = ? and departments.economic_group_id = ?",
				[authCtx.system.id, authCtx.group.id],
			)
			.whereRaw("department_items.deleted_at is null")
			.whereRaw("departments.deleted_at is null")
			.whereRaw("departments.active is true")
			.whereRaw("department_items.active is true");

		if (data.departmentId) {
			deptosQb.whereRaw("id = ?", [data.departmentId]);
			productsQb.whereRaw("departments.id = ?", [data.departmentId]);
			itemsQb.whereRaw("departments.id = ?", [data.departmentId]);
		}

		const [deptos, products, items] = await Promise.all([
			deptosQb,
			productsQb,
			itemsQb,
		]);

		return deptos.map((row) => ({
			id: row.id,
			description: row.description,
			products: products.filter((pred) => pred.depto_id === row.id),
			items: items.filter((pred) => pred.depto_id === row.id),
		}));
	}

	async storeDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			products: string[];
		},
	) {
		if (!authCtx.hasPermission("DPT01")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para fazer a operação",
				400,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
				.where("system_id", authCtx.system.id)
				.first();

			if (!model) {
				throw new ResourceNotFoundException(
					"Departamento não encontrado",
					400,
					"E_ERR",
				);
			}

			await DepartmentProduct.createMany(
				data.products.map((elem) => ({
					department_id: data.departmentId,
					product_id: elem,
					creation_user_id: authCtx.user.id,
					active: true,
				})),
				{
					client: trx,
				},
			);
		});
	}

	async updateDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			products: string[];
		},
	) {
		if (!authCtx.hasPermission("DPT02")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para fazer a operação",
				400,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
				.where("system_id", authCtx.system.id)
				.first();

			if (!model) {
				throw new ResourceNotFoundException(
					"Departamento não encontrado",
					400,
					"E_ERR",
				);
			}

			await DepartmentProduct.query()
				.useTransaction(trx)
				.where("department_id", data.departmentId)
				.whereNull("deleted_at")
				.update({
					deleted_user_id: authCtx.user.id,
					deleted_at: DateTime.now(),
				});

			await DepartmentProduct.createMany(
				data.products.map((elem) => ({
					department_id: data.departmentId,
					product_id: elem,
					creation_user_id: authCtx.user.id,
					active: true,
				})),
				{
					client: trx,
				},
			);
		});
	}

	async destroyDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			products: string[];
		},
	) {
		if (!authCtx.hasPermission("DPT03")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para fazer a operação",
				400,
				"E_ERR",
			);
		}

		await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
				.where("system_id", authCtx.system.id)
				.first();

			if (!model) {
				throw new ResourceNotFoundException(
					"Departamento não encontrado",
					400,
					"E_ERR",
				);
			}

			await DepartmentProduct.query()
				.where("department_id", data.departmentId)
				.whereIn("product_id", data.products)
				.update({
					deleted_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				});
		});
	}

	async createDepartmentItem(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			description: string;
			photo?: MultipartFileContract;
			requiresObservation: boolean;
			order?: number;
		},
	) {
		return await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
				.where("system_id", authCtx.system.id)
				.first();

			if (!model) {
				throw new ResourceNotFoundException(
					"Departamento não encontrado",
					400,
					"E_ERR",
				);
			}

			const photoKey = data.photo ? `${v4()}.${data.photo.extname}` : null;
			if (data.photo) {
				await data.photo.moveToDisk(
					"department-items",
					{
						name: photoKey ?? "--",
						visibility: "private",
					},
					"s3",
				);
			}

			return await DepartmentItem.create(
				{
					department_id: data.departmentId,
					creation_user_id: authCtx.user.id,

					description: data.description,
					photo: photoKey ? `department-items/${photoKey}` : undefined,
					requiresObservation: data.requiresObservation,
					order: data.order,
				},
				{
					client: trx,
				},
			);
		});
	}

	async updateDepartmentItem(
		authCtx: AuthContext,
		departmentItemID: string,
		data: {
			departmentId: number;
			description: string;
			photo?: MultipartFileContract;
			requiresObservation: boolean;
			order?: number;
			active: boolean;
		},
	) {
		return await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
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
					"Não é permitida a alteração de dados de Itens de um Departamento padrão do sistema",
					400,
					"E_ERR",
				);
			}

			const item = await DepartmentItem.query()
				.where("department_id", data.departmentId)
				.where("id", departmentItemID)
				.firstOrFail();

			const photoKey = data.photo
				? `${v4()}.${data.photo.extname}`
				: item.photo;
			if (data.photo) {
				await data.photo.moveToDisk(
					"department-items",
					{
						name: photoKey ?? "--",
						visibility: "private",
					},
					"s3",
				);
			}

			return await item
				.merge({
					updated_user_id: authCtx.user.id,

					description: data.description,
					photo: data.photo ? `department-items/${photoKey}` : photoKey,
					requiresObservation: data.requiresObservation,
					order: data.order,
				})
				.useTransaction(trx)
				.save();
		});
	}

	async deleteDepartmentItem(
		authCtx: AuthContext,
		departmentItemID: string,
		data: {
			departmentId: number;
		},
	) {
		return await Database.transaction(async (trx) => {
			const model = await Department.query()
				.useTransaction(trx)
				.where("id", data.departmentId)
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
					"Não é permitida a alteração de dados de Itens de um Departamento padrão do sistema",
					400,
					"E_ERR",
				);
			}

			const item = await DepartmentItem.query()
				.where("department_id", data.departmentId)
				.where("id", departmentItemID)
				.firstOrFail();

			await item
				.merge({
					deleted_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}
}
