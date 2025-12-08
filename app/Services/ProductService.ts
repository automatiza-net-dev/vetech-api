import Logger from "@ioc:Adonis/Core/Logger";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import BillItem from "App/Models/BillItem";
import BudgetItem from "App/Models/BudgetItem";
import BusinessUnit from "App/Models/BusinessUnit";
import DepositItem from "App/Models/DepositItem";
import DepositMovementItem from "App/Models/DepositMovementItem";
import KitItem from "App/Models/KitItem";
import Product, { ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import ReceiptItem from "App/Models/ReceiptItem";
import VariationGroup from "App/Models/VariationGroup";
import SharedService, { AuthContext } from "App/Services/SharedService";
import IProductData, {
	IProductDataVariation,
} from "Contracts/interfaces/IProductData";
import IUpdateProduct from "Contracts/interfaces/IUpdateProduct";
import Decimal from "decimal.js";
import { DateTime } from "luxon";
import { TReceiptStatus } from "App/Models/Receipt";

interface ISearch {
	description?: string;
	reference?: string;
	collection?: number;
	purpose?: string;
	subgroup?: string;
	taxation?: string;
	active?: string;
}

@inject()
export default class ProductService {
	constructor(private readonly sharedService: SharedService) {}

	public async forMovement(
		authCtx: AuthContext,
		data: {
			type?: "estoque" | "saida" | "entrada";
			description?: string;
			barcode?: string;
			subgroups?: string[];
			departments?: string[];
		},
	) {
		if (!data.type) {
			throw new BadRequestException("É preciso enviar o tipo", 400, "E_ERR");
		}

		const qb = Database.from("products")
			.select(
				Database.raw(`products.type,
       products.id                                                                                                                 as productId,
       null                                                                                                                        as kitId,
       courtesy,
       products.description,
       reference_code,
       json_build_array(json_build_object('id', product_variations.id, 'barcode', product_variations.barcode,
                                          'variationOptions',
                                          json_agg(json_build_object('id', variation_options.id, 'description',
                                                                     variation_options.description)),
                                          'businessUnitProducts',
                                          json_agg(json_build_object('id', business_unit_products.id, 'price',
                                                                     business_unit_products.price,
                                                                     'maximum_discount_percentage',
                                                                     business_unit_products.maximum_discount_percentage))))::jsonb as variations`),
			)
			.joinRaw(
				"join product_variations on products.id = product_variations.product_id",
			)
			.joinRaw(
				`join business_unit_products
              on product_variations.id = business_unit_products.product_variation_id and business_unit_products.businness_unit_id = ?`,
				[authCtx.unit.id],
			)
			.joinRaw(
				"join variation_options on variation_group_id = products.variation_group_id",
			)
			.joinRaw(
				"left join department_products on products.id = department_products.product_id",
			)
			.whereRaw("products.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("products.active is true")
			.whereRaw("products.deleted_at is null")
			.groupByRaw(
				"products.id, product_variations.id, products.variation_group_id",
			);

		const kitsQb = Database.from("kits")
			.select(
				Database.raw(`'kit'                      as type,
		    null                       as productId,
		    kits.id                    as kitId,
		    false                      as courtesy,
		    kits.description,
		    null                       as reference_code,
		    cast(null as jsonB)::jsonb as variations`),
			)
			.joinRaw("join kit_items on kits.id = kit_items.kit_id")
			.joinRaw(
				"join product_variations on kit_items.product_variation_id = product_variations.id",
			)
			.joinRaw("join products on product_variations.product_id = products.id")
			.joinRaw(
				"left join department_products on products.id = department_products.product_id",
			)
			.whereRaw("kits.economic_group_id = ?", [authCtx.group.id])
			.whereRaw(
				"(kits.to_expiration::date <= now()::date or kits.to_expiration is null)",
			)
			.whereRaw(
				"(kits.from_expiration::date >= now()::date or kits.from_expiration is null)",
			)
			.groupByRaw("kits.id")
			.orderByRaw("description");

		if (data.type === "estoque" || data.type === "entrada") {
			// ignore kits
			kitsQb.whereRaw("1=0");
		}

		if (data.type === "saida") {
			qb.whereRaw("products.purpose not in ('internal')");
		}

		if (data.description) {
			qb.whereRaw("description ilike ?", [`%${data.description}%`]);
			kitsQb.whereRaw("products.description ilike ?", [
				`%${data.description}%`,
			]);
		}

		if (data.barcode) {
			qb.whereRaw(
				"(product_variations.barcode = ? or products.reference_code = ?)",
				[data.barcode, data.barcode],
			);
		}

		if (data.subgroups) {
			qb.whereIn("products.subgroup_id", data.subgroups);
			kitsQb.whereIn("products.subgroup_id", data.subgroups);
		}

		if (data.departments) {
			qb.whereIn("department_products.department_id", data.departments);
			kitsQb.whereIn("department_products.department_id", data.departments);
		}

		const [products, kits] = await Promise.all([qb, kitsQb]);

		return products.concat(kits);
	}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = authCtx.group
			.related("products")
			.query()
			.preload("brand")
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

				query.preload("kitItems", (query) => {
					query.whereHas("kit", (query) => {
						query.where("active", true);
					});

					query.preload("kit");
				});

				query.preload("businessUnitProducts", (query) => {
					query.where("businness_unit_id", authCtx.unit.id);

					query.preload("businessUnit", (query) => {
						query.select("id", "fantasyName", "companyName", "identification");
					});
				});

				query.preload("variationOptions", (query) => {
					query.select("id", "description", "active");
				});
			})
			.preload("variationGroup", (query) => {
				query.select("id", "description", "active");
			})
			.preload("taxationGroup")
			.where("type", ProductType.PRODUCT);

		if (data.description) {
			qb.whereRaw("unaccent(description) ilike unaccent(?)", [
				`%${data.description}%`,
			]);
		}

		if (data.reference) {
			qb.where("reference_code", "ilike", `%${data.reference}%`);
		}

		if (data.collection) {
			qb.where("collection_year", data.collection);
		}

		if (data.purpose) {
			qb.where("purpose", data.purpose);
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

		const depositRows: {
			quantity: string;
			product_variation_id: string;
		}[] = await Database.from("deposits")
			.select(
				Database.raw(
					"sum(quantity) as quantity, deposit_items.product_variation_id",
				),
			)
			.joinRaw("join deposit_items on deposits.id = deposit_items.deposit_id")
			.whereRaw("deposits.business_unit_id = ?", [authCtx.unit.id])
			.whereRaw("deposits.type = 'Venda'", [])
			.whereRaw("deposits.deleted_at is null", [])
			.whereIn(
				"deposit_items.product_variation_id",
				result.flatMap((p) => p.variations.map((pv) => pv.id)),
			)
			.groupByRaw("deposit_items.product_variation_id");

		return result.map((product) => ({
			id: product.id,
			description: product.description,
			referenceCode: product.referenceCode,
			purpose: product.purpose,
			active: product.active,
			courtesy: product.courtesy,
			created_at: product.createdAt,
			businessUnitId: authCtx.unit.id,
			stock: product.variations
				.reduce((acc, curr) => {
					return depositRows
						.filter((row) => row.product_variation_id === curr.id)
						.reduce((acc2, curr2) => {
							return acc2.plus(new Decimal(curr2.quantity));
						}, acc);
				}, new Decimal(0))
				.toNumber(),
			variations: product.variations.map((pv) => pv.id),
			buProducts: product.variations.flatMap((pv) =>
				pv.businessUnitProducts.map((bup) => bup.id),
			),
			subgroup: this.sharedService.captureGroup(product.subgroup, (v) => ({
				id: v.id,
				description: v.description,
			})),
			taxationGroup: this.sharedService.captureGroup(
				product.taxationGroup,
				(v) => ({
					id: v.id,
					name: v.name,
				}),
			),
			price: {
				id: product.variations[0]?.id ?? null,
				ref: product.variations[0]?.businessUnitProducts[0]?.id ?? null,
				value:
					Number.parseFloat(
						product.variations[0]?.businessUnitProducts[0]
							?.price as unknown as string,
					) ?? null,
			},
			kits: product.variations.flatMap((v) => v.kitItems),
		}));
	}

	public async show(authCtx: AuthContext, id: string) {
		const product = await authCtx.group
			.related("products")
			.query()
			.where("id", id)
			.preload("brand")
			.preload("fractionUnit")
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
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		const depositRows: {
			quantity: string;
			product_variation_id: string;
			business_unit_product_id: string;
		}[] = await Database.from("deposits")
			.select(
				Database.raw(
					"quantity, deposit_items.product_variation_id, deposit_items.business_unit_product_id",
				),
			)
			.joinRaw("join deposit_items on deposits.id = deposit_items.deposit_id")
			.whereRaw("deposits.business_unit_id = ?", [authCtx.unit.id])
			.whereRaw("deposits.type = 'Venda'", [])
			.whereRaw("deposits.deleted_at is null", [])
			.whereIn(
				"deposit_items.product_variation_id",
				product.variations.map((pv) => pv.id),
			);

		const receiptRows: {
			id: string;
			tag: string;
		}[] = await Database.from("receipts")
			.select(Database.raw("receipts.id, receipts.tag"))
			.joinRaw("join receipt_items on receipts.id = receipt_items.receipt_id")
			.whereRaw("receipts.business_unit_id = ?", [authCtx.unit.id])
			.whereIn(
				"receipt_items.product_variation_id",
				product.variations.map((pv) => pv.id),
			)
			.orderByRaw("receipts.created_at desc")
			.limit(1);

		return {
			...product.toJSON(),
			_invalidConfig: !!(!product.subgroup || !product.purpose),
			receipt: receiptRows.at(0) ?? null,
			variations: product.variations.map((vr) => ({
				...vr.toJSON(),
				businessUnitProducts: vr.businessUnitProducts.map((bup) => ({
					...bup.toJSON(),
					stock: new Decimal(
						depositRows.find(
							(dr) =>
								dr.product_variation_id === vr.id &&
								dr.business_unit_product_id === bup.id,
						)?.quantity ?? "0",
					).toNumber(),
				})),
			})),
		};
	}

	public async store(
		unitId: string,
		data: Omit<IProductData, "active">,
	): Promise<Product> {
		const group = await this.sharedService.getUserGroup(unitId);
		const businessUnits = await BusinessUnit.query().where(
			"economic_group_id",
			group.id,
		);

		const variationGroup = data.variationGroup
			? await VariationGroup.find(data.variationGroup)
			: null;

		const trx = await Database.transaction();

		try {
			const product = await Product.create(
				{
					economic_group_id: group.id,
					variation_group_id: variationGroup?.id,
					unit_id: data.unitId,
					fraction_unit_id: data.fractionUnitId,
					group_id: data.groupId,
					subgroup_id: data.subgroupId,
					brand_id: data.brandId,
					taxation_group_id: data.taxationGroupId,

					courtesy: data.courtesy,
					fractioned: data.fractioned ?? false,
					fractionValue: new Decimal(data.fractionValue ?? 1),
					description: data.description,
					type: ProductType.PRODUCT,
					referenceCode: data.referenceCode,
					collectionYear: data.collectionYear,
					ncm: data.ncm,
					cest: data.cest,
					features: data.features,
					icmsOrigin: data.icmsOrigin,
					taxBenefitCode: data.taxBenefitCode,
					anvisaCode: data.anvisaCode,
					purpose: data.purpose,
				},
				{
					client: trx,
				},
			);

			// eslint-disable-next-line no-restricted-syntax
			for await (const variation of data.variations) {
				// product_variations
				const prodVariation = await product.related("variations").create(
					{
						barcode: variation.barcode,
					},
					{
						client: trx,
					},
				);

				await prodVariation
					.related("variationOptions")
					.sync(variation.variation_options ?? []);

				// eslint-disable-next-line no-restricted-syntax
				for await (const unit of businessUnits) {
					const unitPrice = this.checkForPrice(unit, variation);

					// business_unit_products
					await prodVariation.related("businessUnitProducts").create(
						{
							businness_unit_id: unit.id,
							stock: 0,
							price: unitPrice.price,
							costPrice: unitPrice.costPrice,
							maximumStock: unitPrice.maximumStock,
							minimumStock: unitPrice.minimumStock,
							maximumDiscountPercentage: unitPrice.maximumDiscountPercentage,
							maximumDiscountValue: unitPrice.maximumDiscountValue,
							profitMargin: unitPrice.profitMargin,
							commission: unitPrice.commission,
							commissionMeta: unitPrice.commissionMeta,
							meta: unitPrice.meta,
							metaType: unitPrice.metaType,
						},
						{
							client: trx,
						},
					);
				}
			}

			await trx.commit();

			return product;
		} catch (e) {
			Logger.error(e);
			await trx.rollback();

			throw new InternalErrorException(
				"Erro na execução",
				500,
				"E_INTERNAL_ERROR",
			);
		}
	}

	public async update(
		authCtx: AuthContext,
		id: string,
		data: IUpdateProduct,
	): Promise<Product> {
		const product = await authCtx.group
			.related("products")
			.query()
			.where("id", id)
			.preload("brand")
			.preload("fractionUnit")
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
			throw new ResourceNotFoundException(
				"Recurso não encontrado",
				404,
				"E_NOT_FOUND",
			);
		}

		return product
			.merge({
				unit_id: data.unitId,
				// fraction_unit_id: data.fractionUnitId,
				group_id: data.groupId,
				subgroup_id: data.subgroupId,
				taxation_group_id: data.taxationGroupId,
				brand_id: data.brandId,

				courtesy: data.courtesy,
				// fractioned: data.fractioned ?? false,
				// fractionValue: new Decimal(data.fractionValue ?? 1),
				description: data.description,
				referenceCode: data.referenceCode,
				collectionYear: data.collectionYear,
				ncm: data.ncm,
				cest: data.cest,
				features: data.features,
				active: data.active,
				icmsOrigin: data.icmsOrigin,
				taxBenefitCode: data.taxBenefitCode,
				anvisaCode: data.anvisaCode,
				purpose: data.purpose,
			})
			.save();
	}

	public async calculateStock(
		_authCtx: AuthContext,
		data: {
			businessUnitId: string;
			productVariationId: string;
			businessUnitProductId: string;
		},
	): Promise<{ description: string; quantity: string }[]> {
		return Database.from("deposits")
			.select(Database.raw("description, quantity"))
			.joinRaw("join deposit_items on deposits.id = deposit_items.deposit_id")
			.whereRaw("deposits.business_unit_id = ?", [data.businessUnitId])
			.whereRaw("deposits.type = 'Venda'", [])
			.whereRaw("deposits.deleted_at is null", [])
			.whereRaw("deposit_items.product_variation_id = ?", [
				data.productVariationId,
			])
			.whereRaw("deposit_items.business_unit_product_id = ?", [
				data.businessUnitProductId,
			])
			.orderByRaw("deposits.description");
	}

	public async destroy(authCtx: AuthContext, id: string): Promise<void> {
		await Database.transaction(async (trx) => {
			const product = await Product.query()
				.useTransaction(trx)
				.where("id", id)
				.preload("variations")
				.first();

			if (!product) {
				throw new ResourceNotFoundException(
					"Recurso não encontrado",
					404,
					"E_NOT_FOUND",
				);
			}

			const biQb = BillItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();
			const buQb = BudgetItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();
			const riQb = ReceiptItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();
			const diQb = DepositItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();
			const dmiQb = DepositMovementItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();
			const kiQb = KitItem.query()
				.useTransaction(trx)
				.whereIn(
					"product_variation_id",
					product.variations.map((pv) => pv.id),
				)
				.first();

			const items = await Promise.all([biQb, buQb, riQb, diQb, dmiQb, kiQb]);
			if (items.some(Boolean)) {
				throw new BadRequestException(
					"Produto já lançado em movimentações, impossível excluir. Marque o produto como Inativo",
					400,
					"E_ERR",
				);
			}

			await ProductVariation.query()
				.useTransaction(trx)
				.where("product_id", product.id)
				.update({
					deleted_at: DateTime.now(),
				});

			await product
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();
		});
	}

	private checkForPrice(unit: BusinessUnit, data: IProductDataVariation) {
		if (!data.specificPrice || data.specificPrice.length === 0) {
			return data.price;
		}

		const specificPrice = data.specificPrice.find(
			(f) => f.business === unit.id,
		);

		if (specificPrice) return specificPrice.price;

		return data.price;
	}
}
