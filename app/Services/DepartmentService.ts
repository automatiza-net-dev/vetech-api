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

		const s3Urls = await SharedService.ComputePublicS3Link(
			result.map((r) => r.image).filter(Boolean) as string[],
		);

		return result.map((r) => ({
			systemId: r.system_id,
			economicGroupId: r.economic_group_id,
			businessUnitId: r.business_unit_id,
			departmentId: r.id,
			description: r.description,
			image: r.image ? s3Urls.find((s3) => s3.key === r.image)?.view : null,
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

		const s3Urls = await SharedService.ComputePublicS3Link(
			[
				...result.map(
					(r) => r.image,
					...result.flatMap((r) => r.items.map((r2) => r2.photo)),
				),
			].filter(Boolean) as string[],
		);

		return result.map((r) => ({
			system_id: r.system_id,
			economic_group_id: r.economic_group_id,
			business_unit_id: r.business_unit_id,
			id: r.id,
			description: r.description,
			image: s3Urls.find((s3) => s3.key === r.image)?.view ?? null,
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
				photo: row.photo ? (s3Urls[row.photo] ?? null) : null,
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
			image?: MultipartFileContract;
		},
	) {
		let img: string | null = null;

		if (data.image) {
			const s3Key = `${authCtx.unit.id}/${Date.now()}-${data.image.clientName}`;
			await data.image.moveToDisk("departments", { name: s3Key }, "s3");
			img = `departments/${s3Key}`;
		}

		return Department.create({
			economic_group_id: data.economicGroupId,
			business_unit_id: data.businessUnitId,
			system_id: authCtx.system.id,
			creation_user_id: authCtx.user.id,

			description: data.description,
			image: img,
			active: true,
		});
	}

	async update(
		authCtx: AuthContext,
		id: string,
		data: {
			businessUnitId?: string;

			description: string;
			image?: MultipartFileContract;
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

		let img: string | null = model.image;

		if (data.image) {
			const s3Key = `${authCtx.unit.id}/${Date.now()}-${data.image.clientName}`;
			await data.image.moveToDisk("departments", { name: s3Key }, "s3");
			img = `departments/${s3Key}`;
		}

		return model
			.merge({
				business_unit_id: data.businessUnitId,
				updated_user_id: authCtx.user.id,
				description: data.description,
				image: img,
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

		const row = await qb.firstOrFail();

		const s3Urls = await SharedService.ComputePublicS3Link(
			row.items.map((r2) => r2.photo).filter(Boolean) as string[],
		);

		return {
			...row,
			items: row.items.map((r2) => ({
				...r2,
				photo: r2.photo ? s3Urls.find((s3) => s3.key === r2.photo)?.view : null,
			})),
		};
	}

	async listDepartmentProductsForMovements(
		authCtx: AuthContext,
		data: {
			departmentId?: string;
		},
	) {
		const itemsQb = Database.from("departments")
			.select(
				Database.raw(`departments.id, departments.description, departments.image,
json_agg(json_build_object('id', deptItems_temp.id, 'description', deptItems_temp.description, 'photo', deptItems_temp.photo, 'requiresObservation', deptItems_temp.requires_observation, 'order', deptItems_temp.order )) as items`),
			)
			.joinRaw(`join (select department_items.department_id,
                      department_items.id,
                      department_items.description,
                      department_items.photo,
                      department_items.requires_observation,
                      department_items.order

               from department_items

               where department_items.deleted_at is null
                 and department_items.active = true

               order by department_items.order) deptItems_temp on departments.id = deptItems_temp.department_id`)
			.whereRaw("departments.deleted_at is null")
			.whereRaw("departments.active = true")
			.whereRaw("departments.system_id = ?", [authCtx.system.id])
			.whereRaw(
				"(departments.economic_group_id = ? or departments.economic_group_id is null)",
				[authCtx.group.id],
			)
			.whereRaw(
				"(departments.business_unit_id = ? or departments.business_unit_id is null)",
				[authCtx.unit.id],
			)
			.groupByRaw("departments.id");

		const productsQb = Database.from("departments")
			.select(
				Database.raw(`departments.id,
       json_agg(json_build_object('id', deptProd_temp.id, 'product_variation_id', deptProd_temp.product_variation_id, 'description', deptProd_temp.description,  'type', deptProd_temp.type, 'courtesy', deptProd_temp.courtesy, 'stock', deptProd_temp.stock,
       'maximum_discount_percentage', deptProd_temp.maximum_discount_percentage , 'price', deptProd_temp.price , 'cost_price', deptProd_temp.cost_price ) ) as products`),
			)
			.joinRaw(
				`join (
    select department_products.department_id, products.id, product_variations.id AS product_variation_id, products.description, products.type, products.courtesy, business_unit_products.stock,
             business_unit_products.maximum_discount_percentage , business_unit_products.price , business_unit_products.cost_price
 from department_products
   join products on department_products.product_id = products.id and products.deleted_at is null and products.active is true and products.purpose <> 'internal'
   join product_variations on products.id = product_variations.product_id and product_variations.deleted_at is null
   join business_unit_products on business_unit_products.product_variation_id = product_variations.id and business_unit_products.deleted_at is null
   and business_unit_products.businness_unit_id = ?
where department_products.deleted_at is null and department_products.active = true
order by products.description ) deptProd_temp  on departments.id = deptProd_temp.department_id`,
				[authCtx.unit.id],
			)
			.whereRaw("departments.deleted_at is null")
			.whereRaw("departments.active = true")
			.whereRaw("departments.system_id = ?", [authCtx.system.id])
			.whereRaw(
				"(departments.economic_group_id = ? or departments.economic_group_id is null)",
				[authCtx.group.id],
			)
			.whereRaw(
				"(departments.business_unit_id = ? or departments.business_unit_id is null)",
				[authCtx.unit.id],
			)
			.groupByRaw("departments.id");

		if (data.departmentId) {
			itemsQb.whereRaw("departments.id = ?", [data.departmentId]);
			productsQb.whereRaw("departments.id = ?", [data.departmentId]);
		}

		const [items, products] = await Promise.all([itemsQb, productsQb]);
		const s3Urls = await SharedService.ComputePublicS3Link(
			[
				...items.map((r) => r.image),
				...items.flatMap((r) => r.items.map((r2) => r2.photo)),
			].filter(Boolean),
		);

		return items.map((row) => ({
			id: row.id,
			description: row.description,
			image: s3Urls[row.image] ?? null,
			items: row.items.map((it) => ({
				...it,
				photo: it.photo ? s3Urls.find((s3) => s3.key === it.photo)?.view : null,
			})),
			products: products.find((pr) => pr.id === row.id)?.products ?? [],
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
