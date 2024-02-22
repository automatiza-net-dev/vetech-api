import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BusinessUnit from "App/Models/BusinessUnit";
import Exam from "App/Models/Exam";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IServiceData, {
	IUpdateService,
} from "Contracts/interfaces/IServiceData";

interface ISearch {
	description?: string;
	subgroup?: string;
	taxation?: string;
	active?: string;
}

@inject()
export default class ServiceService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = authCtx.group
			.related("products")
			.query()
			.where("type", ProductType.SERVICE)
			.preload("unit")
			.preload("group", (query) => {
				query.select("id", "name", "active");
			})
			.preload("subgroup", (query) => {
				query.select("id", "description");
			})
			.preload("variations", (query) => {
				query.orderBy("created_at", "desc");
				query.select("id", "barcode", "active");

				query.preload("businessUnitProducts", (query) => {
					query.preload("businessUnit", (query) => {
						query.select("id", "fantasyName", "companyName", "identification");
					});
				});

				query.preload("variationOptions", (subquery) => {
					subquery.select("id", "description", "active");
				});
			})
			.preload("variationGroup", (query) => {
				query.select("id", "description", "active");
			})
			.preload("taxationGroup");

		if (data.description) {
			qb.whereRaw("unaccent(description) ilike unaccent(?)", [
				`%${data.description}%`,
			]);
		}

		if (data.subgroup) {
			qb.where("subgroup_id", data.subgroup);
		}

		if (data.taxation) {
			qb.where("taxation_group_id", data.taxation);
		}

		if (data.active) {
			qb.where("active", data.active === "true");
		}

		const result = await qb;

		return result.map((service) => ({
			id: service.id,
			type: service.type,
			description: service.description,
			referenceCode: service.referenceCode,
			serviceCode: service.serviceCode,
			active: service.active,
			created_at: service.createdAt,
			subgroup: {
				id: service.subgroup?.id ?? null,
				description: service.subgroup?.description ?? null,
			},
			taxationGroup: {
				id: service.taxationGroup?.id ?? null,
				name: service.taxationGroup?.name ?? null,
			},
			price: {
				id: service.variations[0]?.id ?? null,
				value:
					parseFloat(
						service.variations[0]?.businessUnitProducts[0]
							?.price as unknown as string,
					) ?? null,
			},
		}));
	}

	public async show(authCtx: AuthContext, id: string): Promise<Product> {
		const product = await authCtx.group
			.related("products")
			.query()
			.where("id", id)
			.where("type", ProductType.SERVICE)
			.preload("unit")
			.preload("taxationGroup")
			.preload("group", (query) => {
				query.select("id", "name", "active");
			})
			.preload("subgroup", (query) => {
				query.select("id", "description");
			})
			.preload("variations", (query) => {
				query.orderBy("created_at", "desc");
				query.select("id", "barcode", "active");

				query.preload("businessUnitProducts", (query) => {
					query.preload("businessUnit", (query) => {
						query.select("id", "fantasyName", "companyName", "identification");
					});
				});

				query.preload("variationOptions", (subquery) => {
					subquery.select("id", "description", "active");
				});
			})
			.preload("variationGroup", (query) => {
				query.select("id", "description", "active");
			})
			.first();

		if (!product) {
			throw this.sharedService.ResourceNotFound();
		}

		return product;
	}

	public async store(authCtx: AuthContext, data: IServiceData) {
		await Database.transaction(async (trx) => {
			const businessUnits = await BusinessUnit.query()
				.useTransaction(trx)
				.where("economic_group_id", authCtx.group.id)
				.preload("unitConfig", (query) => {
					query.preload("serviceVariationGroup");
				});

			const someUnitConfig = businessUnits.find(
				(bu) => bu.unitConfig,
			)?.unitConfig;

			const service = await Product.create(
				{
					purpose: ProductPurpose.BOTH,
					description: data.description,
					type: ProductType.SERVICE,
					referenceCode: data.referenceCode,
					features: data.features,
					unit_id: data.unitId,
					economic_group_id: authCtx.group.id,
					taxation_group_id: data.taxationGroupId,
					subgroup_id: data.subgroupId,
					icmsOrigin: "0",
					ncm: "00",
					variation_group_id: someUnitConfig?.service_variation_group_id,
					serviceCode: data.serviceCode,
					serviceType: data.serviceType,
				},
				{
					client: trx,
				},
			);

			if (data.serviceType === "exam") {
				await Exam.create(
					{
						product_id: service.id,
						description: data.description,
						economic_group_id: authCtx.group.id,
						ownLaboratory: false,
						type: undefined,
						system_id: authCtx.system.id,
					},
					{
						client: trx,
					},
				);
			}

			const servVariation = await service.related("variations").create(
				{
					barcode: undefined,
				},
				{
					client: trx,
				},
			);

			await servVariation.related("businessUnitProducts").createMany(
				businessUnits.map((unit) => ({
					businness_unit_id: unit.id,
					stock: 0,
					price: data.price.price,
					costPrice: data.price.costPrice,
					maximumStock: 0,
					minimumStock: 0,
					maximumDiscountPercentage: data.price.maximumDiscountPercentage,
					maximumDiscountValue: data.price.maximumDiscountValue,
					profitMargin: data.price.profitMargin,
					commission: data.price.commission,
					commissionMeta: data.price.commissionMeta,
					meta: data.price.meta,
					metaType: data.price.metaType,
				})),
				{
					client: trx,
				},
			);
		});
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IUpdateService,
	): Promise<Product> {
		return Database.transaction(async (trx) => {
			const service = await this.show(authCtx, id);

			if (data.serviceType === "exam") {
				const exam = await Exam.firstOrCreate(
					{
						product_id: service.id,
					},
					{
						description: data.description,
						economic_group_id: service.economic_group_id,
						product_id: service.id,
						ownLaboratory: false,
						type: data.serviceType,
						system_id: authCtx.system.id,
					},
					{
						client: trx,
					},
				);

				if (exam.description !== data.description) {
					await exam
						.merge({ description: data.description })
						.useTransaction(trx)
						.save();
				}
			}

			return service
				.merge({
					description: data.description,
					referenceCode: data.referenceCode,
					features: data.features,
					unit_id: data.unitId,
					active: data.active,
					subgroup_id: data.subgroupId,
					taxation_group_id: data.taxationGroupId,
					serviceCode: data.serviceCode,
					serviceType: data.serviceType,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async destroy(authCtx: AuthContext, id: string): Promise<void> {
		const product = await this.show(authCtx, id);

		await product.softDelete();
	}
}
