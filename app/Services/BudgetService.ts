import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import Attendance from "App/Models/Attendance";
import Bill, { BillStatus } from "App/Models/Bill";
import { BillItemStatus } from "App/Models/BillItem";
import Budget, { BudgetStatus } from "App/Models/Budget";
import BudgetItem from "App/Models/BudgetItem";
import BudgetPayment from "App/Models/BudgetPayment";
import BusinessUnit from "App/Models/BusinessUnit";
import Kit from "App/Models/Kit";
import Patient from "App/Models/Patient";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import { MovementCategory, MovementType } from "App/Models/TaxationGroupRule";
import UfIcms from "App/Models/UfIcms";
import User from "App/Models/User";
import BillService from "App/Services/BillService";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { GenerateTag } from "App/Utils/GenerateTag";
import {
	ICancelBudgetData,
	IConfirmBudgetData,
	ICreateBudgetData,
	ICreateBudgetItemData,
	IUpdateBudgetItemData,
} from "Contracts/interfaces/IBudgetData";
import Decimal from "decimal.js";
import { DateTime } from "luxon";

interface ISearchPartial {
	fromCreation?: string;
	toCreation?: string;
	fromExpiration?: string;
	toExpiration?: string;
	seller?: string;
	status?: string;
	patient?: string;
	client?: string;
	reviewer?: string;
	tag?: string;
}

interface ISearchComplete {
	budget?: string;
	patient?: string;
	tag?: string;
}

interface ISearchProduct {
	variation?: string;
	description?: string;
	unit?: string;
	quantity?: string;
	minPrice?: string;
	maxPrice?: string;
	maxDiscountPercentage?: string;
	reference?: string;
	barcode?: string;
}

@inject()
export default class BudgetService {
	constructor(
		private sharedService: SharedService,
		private billService: BillService,
	) {}

	public async budgetsFromAttendance(
		authCtx: AuthContext,
		attendanceId: string,
	) {
		return Budget.query()
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.where("attendance_id", attendanceId)
			.orderBy("created_at", "desc")
			.select("id", "budget_date", "total_value", "tag", "status");
	}

	public async listOpenNegotiations(authCtx: AuthContext, patientId: string) {
		return Attendance.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("patient_id", patientId)
			.whereHas("budgets", (query) => {
				query.whereNot("status", BudgetStatus.N);
				query.whereNull("deleted_at");

				query.whereHas("items", (query) => {
					query.whereNull("deleted_at");
				});
			})
			.preload("unit", (query) => {
				query.select("id", "identification");
			})
			.preload("scheduleService", (query) => {
				query.select("id", "description");
			})
			.preload("openUser", (query) => {
				query.select("id", "name");
			})
			.preload("closeUser", (query) => {
				query.select("id", "name");
			})
			.preload("patient", (query) => {
				query.select("id", "name");
			})
			.preload("budgets", (query) => {
				query.select(
					"id",
					"budget_date",
					"total_value",
					"tag",
					"status",
					"finished_at",
					"observation",
					"internal_observation",
					"client_id",
					"patient_id",
					"user_id",
					"seller_id",
					"reviewer_id",
					"conclusion_user_id",
					"cancelation_reason_id",
				);
				query.where("status", BudgetStatus.A);
				query.whereNull("deleted_at");

				query.preload("client", (query) => {
					query.select("id", "name");
				});

				query.preload("patient", (query) => {
					query.select("id", "name");
				});

				query.preload("user", (query) => {
					query.select("id", "name");
				});

				query.preload("conclusionUser", (query) => {
					query.select("id", "name");
				});

				query.preload("seller", (query) => {
					query.select("id", "name");
				});

				query.preload("reviewer", (query) => {
					query.select("id", "name");
				});

				query.preload("cancelationReason", (query) => {
					query.select("id", "reason");
				});

				query.preload("items", (query) => {
					query.select(
						"id",
						"quantity",
						"unitary_value",
						"discount_value",
						"total_value",
						"status",
						"product_variation_id",
					);
					query.whereNull("deleted_at");

					query.preload("productVariation", (query) => {
						query.select("id", "product_id");
						query.preload("product", (query) => {
							query.select("id", "description");
						});
					});
				});
			});
	}

	public async partialIndex(unitId: string, data: ISearchPartial) {
		const qb = Budget.query()
			.where("business_unit_id", unitId)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.preload("patient")
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("seller", (query) => {
				query.select("id", "name");
			})
			.preload("reviewer", (query) => {
				query.select("id", "name");
			})
			.preload("dailyMovement")
			.preload("conclusionUser")
			.preload("cancelationReason")
			.orderBy("created_at", "desc");

		// TODO preload payments

		if (data.fromCreation) {
			qb.whereRaw("budget_date::date >= ?", [data.fromCreation]);
		}

		if (data.toCreation) {
			qb.whereRaw("budget_date::date <= ?", [data.toCreation]);
		}

		if (data.fromExpiration) {
			qb.whereRaw("expiration_date::date >= ?", [data.fromExpiration]);
		}

		if (data.toExpiration) {
			qb.whereRaw("expiration_date::date <= ?", [data.toExpiration]);
		}

		if (data.seller) {
			qb.where("seller_id", data.seller);
		}

		if (data.status) {
			qb.where("status", data.status);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		if (data.client) {
			qb.where("client_id", data.client);
		}

		if (data.reviewer) {
			qb.where("reviewer_id", data.reviewer);
		}

		if (data.tag) {
			qb.where("tag", "ilike", `%${data.tag}%`);
		}

		return qb;
	}

	public async completeIndex(unitId: string, data: ISearchComplete) {
		const qb = Budget.query()
			.where("business_unit_id", unitId)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal");
			})
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("seller", (query) => {
				query.select("id", "name");
			})
			.preload("reviewer", (query) => {
				query.select("id", "name");
			})
			.preload("dailyMovement")
			.preload("conclusionUser")
			.preload("cancelationReason")
			.preload("items", (query) => {
				query.preload("productVariation", (query) => {
					query.preload("product");
				});
			})
			.orderBy("created_at", "desc");

		if (data.budget) {
			qb.where("id", data.budget);
		}

		if (data.patient) {
			qb.where("patient_id", data.patient);
		}

		if (data.tag) {
			qb.where("tag", "ilike", `%${data.tag}%`);
		}

		return qb;
	}

	public async show(unitId: string, id: string) {
		const qb = Budget.query()
			.where("business_unit_id", unitId)
			.where("id", id)
			.preload("client", (query) => {
				query.preload("tutor");
			})
			.preload("patient", (query) => {
				query.preload("patientAnimal");
			})
			.preload("user", (query) => {
				query.select("id", "name");
			})
			.preload("seller", (query) => {
				query.select("id", "name");
			})
			.preload("reviewer", (query) => {
				query.select("id", "name");
			})
			.preload("conclusionUser")
			.preload("cancelationReason")
			.preload("items", (query) => {
				query.preload("productVariation", (query) => {
					query.preload("variationOptions");
					query.preload("product");
				});
			});

		const result = await qb.first();

		if (!result) {
			throw this.sharedService.ResourceNotFound("Orçamento não encontrado");
		}

		return result;
	}

	public async searchProducts(unitId: string, data: ISearchProduct) {
		const today = DateTime.now();
		const group = await this.sharedService.getUserGroup(unitId);

		const qb = Product.query()
			.where("economic_group_id", group.id)
			.whereNotIn("purpose", [ProductPurpose.INTERNAL])
			.where("active", true);

		if (
			data.variation ||
			data.barcode ||
			data.quantity ||
			data.minPrice ||
			data.maxPrice ||
			data.maxDiscountPercentage
		) {
			qb.whereHas("variations", (query) => {
				if (data.variation) {
					query.where("id", data.variation);
				}

				if (data.barcode) {
					query.whereILike("barcode", data.barcode);
				}

				if (
					data.minPrice ||
					data.maxPrice ||
					data.quantity ||
					data.maxDiscountPercentage
				) {
					query.whereHas("businessUnitProducts", (query) => {
						query.where("businness_unit_id", unitId);

						if (data.quantity) {
							query.where("stock", ">=", data.quantity);
						}

						if (data.minPrice) {
							query.where("price", ">=", parseFloat(data.minPrice));
						}

						if (data.maxPrice) {
							query.where("price", "<=", parseFloat(data.maxPrice));
						}

						if (data.maxDiscountPercentage) {
							query.where(
								"maximumDiscountPercentage",
								"<=",
								data.maxDiscountPercentage,
							);
						}
					});
				}
			});
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.unit) {
			qb.where("unit_id", data.unit);
		}

		if (data.reference) {
			qb.where("referenceCode", "ilike", `%${data.reference}%`);
		}

		qb.preload("variations", (query) => {
			query.preload("product");
			query.preload("variationOptions");

			query.preload("kitItems", (query) => {
				query.whereHas("kit", (query) => {
					query.where("active", true);
				});

				query.preload("kit", (query) => {
					qb.whereRaw("(from_expiration >= ? or from_expiration is null)", [
						today.startOf("day").toISO()!,
					]);
					qb.whereRaw("(from_expiration <= ? or from_expiration is null)", [
						today.endOf("day").toISO()!,
					]);

					query.preload("items", (query) => {
						query.where("business_unit_id", unitId);

						query.preload("productVariation");
					});
				});
			});

			query.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", unitId);

				if (data.quantity) {
					query.where("stock", ">=", parseFloat(data.quantity));
				}

				if (data.minPrice) {
					query.where("price", ">=", parseFloat(data.minPrice));
				}

				if (data.maxPrice) {
					query.where("price", "<=", parseFloat(data.maxPrice));
				}

				if (data.maxDiscountPercentage) {
					query.where(
						"maximumDiscountPercentage",
						"<=",
						data.maxDiscountPercentage,
					);
				}
			});
		});
		qb.preload("unit");
		const products = await qb;

		const kits = await Kit.query()
			.where("economic_group_id", group.id)
			.whereRaw("(to_expiration <= ? or to_expiration is null)", [
				today.endOf("day").toISO()!,
			])
			.whereRaw("(from_expiration >= ? or from_expiration is null)", [
				today.startOf("day").toISO()!,
			]);
		// const kits = await Kit.query()
		//   .where('economic_group_id', group.id)
		//   .preload('items', query => {
		//     query.preload('productVariation', query => {
		//       query.whereHas('businessUnitProducts', query => {
		//         query.where('businness_unit_id', unitId);
		//       });

		//       query.preload('product');
		//       query.preload('businessUnitProducts', query => {
		//         query.where('businness_unit_id', unitId);
		//       });
		//     });
		//   });

		return [
			...products,
			...kits.map((elem) => ({ ...elem.toJSON(), type: "kit" })),
		];
	}

	public async createBudget(authCtx: AuthContext, data: ICreateBudgetData) {
		return Database.transaction(async (trx) => {
			const result = await this.sharedService.checkDiscount(
				trx,
				authCtx.unit.id,
				data.items.map((elem) => ({
					variationId: elem.productVariationId,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
				})),
			);
			if (result.length > 0) {
				return result;
			}

			if (authCtx.unit.unitConfig.requiresBillPatient && !data.patientId) {
				throw new BadRequestException(
					"É necessário informar o paciente para realizar o orçamento",
					400,
					"E_ERR",
				);
			}

			if (!data.clientId && !data.clientName) {
				throw new BadRequestException(
					"É necessário informar o cliente para realizar o orçamento",
					400,
					"E_ERR",
				);
			}

			const items = await ProductVariation.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map(({ productVariationId }) => productVariationId),
				);

			const budget = await Budget.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_id: data.clientId,
					patient_id: data.patientId,
					user_id: authCtx.user.id,
					seller_id: data.sellerId,
					daily_movement_id: data.dailyMovementId,
					attendance_id: data.attendanceId,
					reviewer_id: data.reviewerId,

					budgetDate: data.budgetDate,
					expirationDate: data.expirationDate,
					productValue: 0,
					serviceValue: 0,
					discountValue: 0,
					totalValue: 0,
					observation: data.observation,
					internalObservation: data.internalObservation,
					clientName: data.clientName,
					status: BudgetStatus.A,
					tag: GenerateTag(
						parseInt(authCtx.unit.unitConfig.budgetCounter, 10) + 1,
					),
				},
				{
					client: trx,
				},
			);
			await authCtx.unit.unitConfig
				.merge({
					budgetCounter: (
						parseInt(authCtx.unit.unitConfig.budgetCounter, 10) + 1
					).toString(),
				})
				.useTransaction(trx)
				.save();

			data.items.forEach(async (item) => {
				const variation = items.find(
					(variation) => variation.id === item.productVariationId,
				);

				if (!variation) {
					throw this.sharedService.ResourceNotFound(
						"Variação do produto não encontrada",
					);
				}

				await budget.related("items").create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						product_variation_id: variation.id,

						unitaryValue: item.unitaryValue,
						discountValue: item.discountValue,
						quantity: item.quantity,
						totalValue: item.quantity * item.unitaryValue - item.discountValue,
						status: BudgetStatus.A,
					},
					{
						client: trx,
					},
				);
			});

			const unitarySum = data.items.reduce(
				(total, item) =>
					total + (item.unitaryValue * item.quantity - item.discountValue),
				0,
			);

			const discountSum = data.items.reduce(
				(total, item) => total + item.discountValue,
				0,
			);

			await budget
				.merge({
					productValue: unitarySum,
					discountValue: discountSum,
					totalValue: unitarySum,
				})
				.useTransaction(trx)
				.save();

			return budget;
		});
	}

	public async updateBudget(
		authCtx: AuthContext,
		id: string,
		data: {
			sellerId?: string;
			clientId?: string;
			reviewerId?: string;
			patientId?: string;
			clientName?: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.query()
				.useTransaction(trx)
				.where("id", id)
				.andWhere("business_unit_id", authCtx.unit.id)
				.first();

			if (!budget) {
				throw this.sharedService.ResourceNotFound();
			}

			if (budget.status !== BudgetStatus.A) {
				throw new BadRequestException(
					"Não é possível alterar um orçamento que não esteja em aberto",
					400,
					"E_BAD_REQUEST",
				);
			}

			return budget
				.merge({
					seller_id: data.sellerId,
					client_id: data.clientId,
					reviewer_id: data.reviewerId,
					patient_id: data.patientId,
					clientName: data.clientName,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async updateBudgetObservation(
		authCtx: AuthContext,
		id: string,
		data: {
			observation: string;
			internalObservation: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.query()
				.useTransaction(trx)
				.where("id", id)
				.andWhere("business_unit_id", authCtx.unit.id)
				.first();

			if (!budget) {
				throw this.sharedService.ResourceNotFound();
			}

			return budget
				.merge({
					observation: data.observation,
					internalObservation: data.internalObservation,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async createBudgetItem(
		authCtx: AuthContext,
		data: ICreateBudgetItemData,
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.findOrFail(data.budgetId, {
				client: trx,
			});

			const result = await this.sharedService.checkDiscount(
				trx,
				authCtx.unit.id,
				[
					{
						variationId: data.productVariationId,
						discountValue: data.discountValue,
						quantity: data.quantity,
					},
				],
			);
			if (result.length > 0) {
				return result;
			}

			const productVariation = await ProductVariation.query()
				.useTransaction(trx)
				.where("id", data.productVariationId)
				.whereHas("businessUnitProducts", (query) => {
					query.where("businness_unit_id", authCtx.unit.id);
				})
				.preload("product")
				.preload("businessUnitProducts", (query) => {
					query.where("businness_unit_id", authCtx.unit.id);
				})
				.first();
			if (!productVariation) {
				throw new BadRequestException(
					"Não foi possível encontrar um preço para esse produto",
					400,
					"E_NO_VARIATION",
				);
			}

			if (
				productVariation.businessUnitProducts.some(
					(p) => p.maximumDiscountValue < data.discountValue,
				)
			) {
				throw new BadRequestException(
					`Desconto lançado é superior ao permitido - ${productVariation.product.description}`,
					400,
					"E_MAX_DISCOUNT",
				);
			}

			const item = await budget.related("items").create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					product_variation_id: data.productVariationId,

					unitaryValue: data.unitaryValue,
					discountValue: data.discountValue,
					quantity: data.quantity,
					totalValue: data.quantity * data.unitaryValue - data.discountValue,
					status: BudgetStatus.A,
				},
				{
					client: trx,
				},
			);

			await budget
				.merge({
					productValue: budget.productValue + item.totalValue,
					discountValue: budget.discountValue + item.discountValue,
					totalValue: budget.totalValue + item.totalValue,
				})
				.useTransaction(trx)
				.save();

			return null;
		});
	}

	public async createBudgetItems(
		authCtx: AuthContext,
		data: ICreateBudgetItemData[],
	) {
		return Database.transaction(async (trx) => {
			const result = await this.sharedService.checkDiscount(
				trx,
				authCtx.unit.id,
				data.map((elem) => ({
					variationId: elem.productVariationId,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
				})),
			);
			if (result.length > 0) {
				return result;
			}

			const tasks = data.map(async (item) => {
				const budget = await Budget.findOrFail(item.budgetId);
				const dbItem = await budget.related("items").create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						product_variation_id: item.productVariationId,

						unitaryValue: item.unitaryValue,
						discountValue: item.discountValue,
						quantity: item.quantity,
						totalValue: item.quantity * item.unitaryValue - item.discountValue,
						status: BudgetStatus.A,
					},
					{
						client: trx,
					},
				);

				await budget
					.merge({
						productValue: budget.productValue + dbItem.totalValue,
						discountValue: budget.discountValue + dbItem.discountValue,
						totalValue: budget.totalValue + dbItem.totalValue,
					})
					.useTransaction(trx)
					.save();
			});

			await Promise.all(tasks);
			return null;
		});
	}

	public async updateBudgetItem(
		authCtx: AuthContext,
		id: string,
		data: IUpdateBudgetItemData,
	) {
		return Database.transaction(async (trx) => {
			const budgetItem = await BudgetItem.query()
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.preload("budget")
				.first();

			if (!budgetItem) {
				throw this.sharedService.ResourceNotFound();
			}

			const existingItems = await BudgetItem.query().where(
				"budget_id",
				budgetItem.budget_id,
			);

			const result = await this.sharedService.checkDiscount(
				trx,
				authCtx.unit.id,
				[
					{
						variationId: budgetItem.product_variation_id,
						discountValue: data.discountValue,
						quantity: data.quantity,
					},
				],
			);
			if (result.length > 0) {
				return result;
			}

			const updatedItem = await budgetItem
				.merge({
					unitaryValue: data.unitaryValue,
					discountValue: data.discountValue,
					quantity: data.quantity,
					totalValue: data.quantity * data.unitaryValue - data.discountValue,
					status: data.status,
				})
				.useTransaction(trx)
				.save();

			const unitarySum =
				existingItems
					.filter((item) => item.id !== updatedItem.id)
					.filter((item) => item.status === BudgetStatus.A)
					.reduce((total, item) => total + item.totalValue, 0) +
				(data.status === BudgetStatus.A ? updatedItem.totalValue : 0);

			const discountSum =
				existingItems
					.filter((item) => item.id !== updatedItem.id)
					.filter((item) => item.status === BudgetStatus.A)
					.reduce((total, item) => total + item.discountValue, 0) +
				(data.status === BudgetStatus.A ? data.discountValue : 0);

			await budgetItem.budget
				.merge({
					productValue: unitarySum,
					discountValue: discountSum,
					totalValue: unitarySum - discountSum,
				})
				.useTransaction(trx)
				.save();

			return updatedItem;
		});
	}

	public async confirmBudget(
		authCtx: AuthContext,
		id: string,
		data: IConfirmBudgetData,
	) {
		const model = await Budget.query()
			.where("id", id)
			.where("business_unit_id", authCtx.unit.id)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		if (authCtx.unit.unitConfig.requiresBillPatient && !model.patient_id) {
			throw new BadRequestException(
				"É necessário informar o paciente para realizar o orçamento",
				400,
				"E_ERR",
			);
		}

		if (!model.client_id && !data.clientId) {
			throw new BadRequestException(
				"É necessário informar o cliente para confirmar o orçamento",
				400,
				"E_ERR",
			);
		}

		const client = await Patient.query()
			.where("id", model.client_id)
			.preload("tutor")
			.preload("bills")
			.firstOrFail();
		if (client.bills.length === 0) {
			await client
				.merge({
					firstSale: DateTime.now(),
				})
				.save();
		}

		const ufIcms = await UfIcms.query()
			.where("origin_uf", authCtx.unit.state ?? "")
			.where("destination_uf", client.tutor?.state ?? authCtx.unit.state ?? "")
			.first();

		const items = await model
			.related("items")
			.query()
			.preload("productVariation", (query) => {
				query.preload("product");
			});

		const rules = await this.billService.searchTax(authCtx.unit.id, {
			category: MovementCategory.NS,
			type: MovementType.S,
			origin: authCtx.unit.state,
			destination: client.tutor?.state ?? authCtx.unit.state,
			groups: items.map(
				(item) => item.productVariation.product.taxation_group_id,
			),
		});

		return Database.transaction(async (trx) => {
			const totalProductValue = items
				.filter((item) => !data.notConfirmedItems.includes(item.id))
				.reduce((total, item) => total + item.totalValue, 0);
			const totalDiscountValue = items
				.filter((item) => !data.notConfirmedItems.includes(item.id))
				.reduce((total, item) => total + item.discountValue, 0);
			const totalServiceValue = 0;

			const bill = await Bill.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					user_id: authCtx.user.id,
					seller_id: authCtx.user.id,
					daily_movement_id: model.daily_movement_id,

					client_id: model.client_id,
					patient_id: model.patient_id,
					billDate: DateTime.now(),
					productValue: totalProductValue,
					serviceValue: totalServiceValue,
					discountValue: totalDiscountValue,
					totalValue: totalProductValue,
					deliveryValue: 0,
					additionalInformation: "[Concluído a partir de um orçamento]",
					status: BillStatus.A,

					otherValue: 0,
					tag: GenerateTag(
						parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1,
					),
				},
				{ client: trx },
			);
			await authCtx.unit.unitConfig
				.merge({
					billCounter: (
						parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1
					).toString(),
				})
				.useTransaction(trx)
				.save();

			await bill.related("items").createMany(
				items
					.filter((item) => !data.notConfirmedItems.includes(item.id))
					.map((item) => {
						const rule = rules.find(
							(r) =>
								r.taxation_group_id ===
								item.productVariation.product.taxation_group_id,
						);
						const totalValue =
							item.unitaryValue * item.quantity - item.discountValue;
						const icmsBase = rule
							? totalValue * ((100 - rule.icmsPercRedBaseCalculo) / 100)
							: 0;
						const icmsStBase = rule
							? icmsBase + (icmsBase * rule.ivaIcmsSt) / 100
							: 0;
						const icmsValue = rule
							? icmsBase *
							  ((rule.icmsPercRedBaseCalculo *
									((100 - rule.icmsPercRedAliquota) / 100)) /
									100)
							: 0;

						return {
							economic_group_id: authCtx.group.id,
							business_unit_id: authCtx.unit.id,
							bill_id: bill.id,
							product_variation_id: item.product_variation_id,
							tax_rule_id: rule?.id,

							quantity: item.quantity,
							costValue: 0,
							saleValue: item.unitaryValue,
							unitaryValue: item.unitaryValue,
							discountValue: item.discountValue,
							totalValue,
							status: BillItemStatus.A,
							createdAt: bill.createdAt,

							fiscalOperationCode: rule?.taxOperation?.code,
							icmsOriginProduct: item.productVariation.product.icmsOrigin,
							icmsCst:
								item.productVariation.product.type === ProductType.PRODUCT
									? rule?.icmsCst
									: undefined,
							icmsBase:
								item.productVariation.product.type === ProductType.PRODUCT
									? icmsBase
									: undefined,
							icmsPercentage:
								item.productVariation.product.type === ProductType.PRODUCT
									? rule?.icmsPerc
									: undefined,
							icmsValue,
							icmsPercentageRedAliquot: rule?.icmsPercRedAliquota,
							icmsPercentageRedBase: rule?.icmsPercRedBaseCalculo,
							icmsStBase:
								item.productVariation.product.type === ProductType.PRODUCT
									? icmsStBase
									: undefined,
							icmsStPercentageRedBase: rule?.icmsPercRedAliquota,
							icmsStIva: rule?.ivaIcmsSt,
							icmsStPercentageUfDestination: 0,
							icmsStValue:
								item.productVariation.product.type === ProductType.PRODUCT
									? ufIcms
										? icmsStBase * (ufIcms.icmsPercentage / 100) - icmsValue
										: undefined
									: undefined,
							issCst:
								item.productVariation.product.type === ProductType.SERVICE
									? rule?.icmsCst
									: undefined,
							issBase:
								item.productVariation.product.type === ProductType.SERVICE
									? totalValue
									: undefined,
							issPercentage:
								item.productVariation.product.type === ProductType.SERVICE
									? rule?.icmsPerc
									: undefined,
							issValue:
								item.productVariation.product.type === ProductType.SERVICE
									? (totalValue * (rule?.icmsPerc ?? 1)) / 100
									: undefined,

							pisBase: totalValue,
							pisPercentage: rule?.pisPerc,
							pisValue: (totalValue * (rule?.pisPerc ?? 1)) / 100,
							pisRetentionValue: 0,
							pisCst: rule?.pisCst,
							cofinsBase: totalValue,
							cofinsPercentage: rule?.cofinsPerc,
							cofinsValue: (totalValue * (rule?.cofinsPerc ?? 1)) / 100,
							cofinsRetentionValue: 0,
							cofinsCst: rule?.cofinsCst,
							ipiBase: totalValue,
							ipiPercentage: rule?.ipiPerc,
							ipiValue: (totalValue * (rule?.ipiPerc ?? 1)) / 100,
							ipiCst: rule?.ipiCst,
							icmsDeferredValue: 0,
							icmsPartitionValue: 0,
							icmsFcpPercentage: rule?.fcpPerc,
							icmsFcpValue: 0,
							icmsPartitionOriginUfPercentage: rule?.icmsPerc,
							icmsPartitionDestinationUfPercentage: rule?.icmsPercRedAliquota,
							icmsPartitionInterUfPercentage: rule?.icmsPercRedAliquota,
						};
					}),
				{
					client: trx,
				},
			);

			items.forEach(async (item) => {
				await item
					.merge({
						status: data.notConfirmedItems.includes(item.id)
							? BudgetStatus.N
							: BudgetStatus.C,
					})
					.useTransaction(trx)
					.save();
			});

			await bill
				.merge({
					budget_id: model.id,
				})
				.useTransaction(trx)
				.save();

			await model
				.merge({
					bill_id: bill.id,
					conclusion_user_id: authCtx.user.id,
					client_id: data.clientId,
					finishedAt: data.finishedAt,
					status: data.type === "PARCIAL" ? BudgetStatus.P : BudgetStatus.C,
					cancelation_reason_id:
						data.type === "PARCIAL" ? data.reasonId : undefined,
					canceledObservation:
						data.type === "PARCIAL" ? data.canceledObservation : undefined,
					internalObservation: [
						model.internalObservation,
						data.internalObservation,
					]
						.filter(Boolean)
						.join(" - "),
					productValue: totalProductValue,
					serviceValue: totalServiceValue,
					discountValue: totalDiscountValue,
					totalValue: totalProductValue + totalServiceValue,
				})
				.useTransaction(trx)
				.save();

			return bill;
		});
	}

	public async cancelBudget(
		unitId: string,
		id: string,
		user: User,
		data: ICancelBudgetData,
	) {
		const model = await Budget.query()
			.where("id", id)
			.where("business_unit_id", unitId)
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		return model
			.merge({
				conclusion_user_id: user.id,
				finishedAt: data.finishedAt,
				cancelation_reason_id: data.reasonId,
				canceledObservation: data.canceledObservation,
				internalObservation: [
					model.internalObservation,
					data.internalObservation,
				]
					.filter(Boolean)
					.join(" - "),
				status: BudgetStatus.N,
			})
			.save();
	}

	public async deleteBudget(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const model = await Budget.query()
				.useTransaction(trx)
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.first();

			if (!model) {
				throw this.sharedService.ResourceNotFound();
			}

			if (model.status !== BudgetStatus.A) {
				throw new BadRequestException(
					"Orçamento com status inválido para inclusão",
					400,
					"E_ERR",
				);
			}

			await model.softDelete();
		});
	}

	public async addFromKit(
		unitId: string,
		data: {
			budgetId: string;
			kitId: number;
		},
	) {
		await Database.transaction(async (trx) => {
			const unit = await BusinessUnit.findOrFail(unitId, {
				client: trx,
			});

			const budget = await Budget.query()
				.useTransaction(trx)
				.where("id", data.budgetId)
				.andWhere("business_unit_id", unitId)
				.first();

			if (!budget) {
				throw this.sharedService.ResourceNotFound();
			}

			if (budget.status !== BudgetStatus.A) {
				throw new BadRequestException(
					"Orçamento não está aberto",
					400,
					"E_ERR",
				);
			}

			const kit = await Kit.query()
				.useTransaction(trx)
				.where("id", data.kitId)
				.andWhere("economic_group_id", unit.economicGroupId)
				.preload("items", (query) => {
					query.where("business_unit_id", unitId);

					query.preload("productVariation", (query) => {
						query.preload("product");
					});
				})
				.first();

			if (!kit) {
				throw this.sharedService.ResourceNotFound();
			}

			if (!kit.active) {
				throw new BadRequestException("Kit não está ativo", 400, "E_ERR");
			}

			const items = await budget.related("items").createMany(
				kit.items.map((item) => {
					return {
						economic_group_id: unit.economicGroupId,
						business_unit_id: unitId,
						product_variation_id: item.product_variation_id,
						kit_id: kit.id,

						unitaryValue: item.originalPrice,
						discountValue: item.discountPrice,
						quantity: item.quantity,
						totalValue: item.quantity * item.originalPrice - item.discountPrice,
						status: BudgetStatus.A,
					};
				}),
				{
					client: trx,
				},
			);

			await budget
				.merge({
					productValue:
						budget.productValue +
						items.reduce((acc, item) => acc + item.totalValue, 0),
					discountValue:
						budget.discountValue +
						items.reduce((acc, item) => acc + item.discountValue, 0),
					totalValue:
						budget.totalValue +
						items.reduce((acc, item) => acc + item.totalValue, 0),
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async createBudgetPayments(
		authCtx: AuthContext,
		data: {
			budgetId: string;
			items: {
				paymentMethodId: string;
				tefFlagId: string;
				tefAcquirerId: string;

				totalValue: number;
				installments: number;
			}[];
		},
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.query()
				.useTransaction(trx)
				.where("id", data.budgetId)
				.andWhere("business_unit_id", authCtx.unit.id)
				.first();

			if (!budget) {
				throw this.sharedService.ResourceNotFound();
			}

			const sum = this.sharedService.sum(
				data.items.map((elem) => elem.totalValue),
			);
			const decimalTotal = new Decimal(budget.totalValue);
			const decimalSum = new Decimal(sum);
			const decimalPaid = new Decimal(budget.paidValue);

			if (decimalTotal.minus(decimalPaid).lessThan(decimalSum)) {
				throw new BadRequestException(
					"Valores adicionais acima do valor total do orçamento",
					400,
					"E_INVALID",
				);
			}

			const tasks = data.items.map((elem, index) =>
				BudgetPayment.create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						user_id: authCtx.user.id,
						budget_id: budget.id,
						payment_method_id: elem.paymentMethodId,
						tef_flag_id: elem.tefFlagId,
						tef_acquirer_id: elem.tefAcquirerId,

						block: index + 1,
						totalValue: elem.totalValue,
						installments: elem.installments,
						status: "Aberto",
						issueDate: DateTime.now(),
					},
					{ client: trx },
				),
			);
			await Promise.all(tasks);

			await budget
				.merge({
					paidValue: decimalPaid.plus(decimalSum).toNumber(),
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async updateBudgetPayment(
		authCtx: AuthContext,
		data: {
			budgetPaymentId: number;
			paymentMethodId: string;
			tefFlagId: string;
			tefAcquirerId: string;

			totalValue: number;
			installments: number;
			updateDate: DateTime;
		},
	) {
		return Database.transaction(async (trx) => {
			const row = await BudgetPayment.query()
				.useTransaction(trx)
				.where("id", data.budgetPaymentId)
				.andWhere("economic_group_id", authCtx.group.id)
				.andWhere("business_unit_id", authCtx.unit.id)
				.preload("budget")
				.first();

			if (!row) {
				throw this.sharedService.ResourceNotFound();
			}

			if (row.status !== "Aberto") {
				throw new BadRequestException(
					"Pagamento não está aberto",
					400,
					"E_ERR",
				);
			}

			await row
				.merge({
					change_user_id: authCtx.user.id,
					payment_method_id: data.paymentMethodId,
					tef_flag_id: data.tefFlagId,
					tef_acquirer_id: data.tefAcquirerId,

					totalValue: data.totalValue,
					installments: data.installments,
					updateDate: data.updateDate,
				})
				.useTransaction(trx)
				.save();

			const budgetPayments = await BudgetPayment.query()
				.useTransaction(trx)
				.where("budget_id", row.budget_id);

			const sum = this.sharedService.sum(
				budgetPayments.map((elem) => elem.totalValue),
			);
			if (sum > row.budget.totalValue) {
				throw new BadRequestException(
					"Valor pago do orçamento acima do total",
					400,
					"E_ERR",
				);
			}

			await row.budget
				.merge({
					paidValue: sum,
				})
				.useTransaction(trx)
				.save();
		});
	}
}
