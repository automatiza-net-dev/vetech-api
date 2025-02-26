import { MultipartFileContract } from "@ioc:Adonis/Core/BodyParser";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Department from "App/Models/Department";
import DepartmentProduct from "App/Models/DepartmentProduct";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import DepartmentItem from "App/Models/DepartmentItem";
import { v4 } from "uuid";

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
        json_build_object('id', products.id, 'description', products.description, 'type', products.type, 'courtesy',
                          products.courtesy, 'stock', business_unit_products.stock, 'maximum_discount_percentage',
                          business_unit_products.maximum_discount_percentage, 'price', business_unit_products.price,
                          'cost_price', business_unit_products.cost_price
        )
                ) FILTER (WHERE products.id IS NOT NULL),
        '[]'::json) as products`),
			)
			.joinRaw(
				"join department_products on departments.id = department_products.department_id and department_products.deleted_at is null",
			)
			.joinRaw(
				`join products on department_products.product_id = products.id and
                               products.deleted_at is null and
                               products.active is true and products.purpose <> 'internal'`,
			)
			.joinRaw(
				"join product_variations on products.id = product_variations.product_id",
			)
			.joinRaw(
				`join business_unit_products on business_unit_products.product_variation_id = product_variations.id and
                                             business_unit_products.businness_unit_id =
                                             ?`,
				[authCtx.unit.id],
			)
			.whereRaw(
				"(departments.system_id = ? and departments.id = ? and departments.deleted_at is null)",
				[authCtx.system.id, data.departmentId],
			)
			.whereRaw("products.deleted_at is null")
			.whereRaw("departments.active is true")
			.groupBy("departments.id");

		return qb.firstOrFail();
	}

	async storeDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			products: string[];
		},
	) {
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

	async destroyDepartmentProducts(
		authCtx: AuthContext,
		data: {
			departmentId: number;
			products: string[];
		},
	) {
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
