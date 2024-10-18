import Hash from "@ioc:Adonis/Core/Hash";
import Database from "@ioc:Adonis/Lucid/Database";
import { inject } from "@adonisjs/fold";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import Attendance from "App/Models/Attendance";
import Bill, { BillStatus } from "App/Models/Bill";
import BillDocument from "App/Models/BillDocument";
import { BillItemStatus } from "App/Models/BillItem";
import Budget, { BudgetStatus } from "App/Models/Budget";
import BudgetItem from "App/Models/BudgetItem";
import BudgetPayment, {
	TBudgetPaymentExclusionOrigin,
	TBudgetPaymentStatus,
} from "App/Models/BudgetPayment";
import BusinessUnit from "App/Models/BusinessUnit";
import Kit from "App/Models/Kit";
import Patient from "App/Models/Patient";
import PaymentMethodFlagInstallment from "App/Models/PaymentMethodFlagInstallment";
import Product, { ProductPurpose, ProductType } from "App/Models/Product";
import ProductVariation from "App/Models/ProductVariation";
import TaxationGroupRule, {
	CompanyType,
	MovementCategory,
	MovementType,
} from "App/Models/TaxationGroupRule";
import Treatment from "App/Models/Treatment";
import UfIcms from "App/Models/UfIcms";
import User from "App/Models/User";
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
import DepositService from "./DepositService";
import { v4 } from "uuid";
import PaymentMethod from "App/Models/PaymentMethod";
import PaymentMethodFlag from "App/Models/PaymentMethodFlag";

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
	budget_id?: string;
	pending?: string;
}

interface ISearchComplete {
	budget?: string;
	patient?: string;
	tag?: string;
	pending?: string;
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
		private depositService: DepositService,
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
		const attendances = await Attendance.query()
			.orderByRaw("attendances.start_date desc")
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
					"pending",
					"internal_observation",
					"client_id",
					"patient_id",
					"user_id",
					"seller_id",
					"reviewer_id",
					"conclusion_user_id",
					"cancelation_reason_id",
					"bill_id",
				);
				// query.where("status", BudgetStatus.A);
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

				query.preload("payments", (query) => {
					query.select(
						"id",
						"block",
						"total_value",
						"installments",
						"status",
						"payment_method_id",
						"tef_flag_id",
						"tef_acquirer_id",
					);

					query.preload("paymentMethod", (query) => {
						query.select("id", "description");
					});

					query.preload("tefFlag", (query) => {
						query.select("id", "description");
					});

					query.preload("tefAcquirer", (query) => {
						query.select("id", "description");
					});
				});
			});

		const statuses: { id: string; status: string }[] = await Database.from(
			"budgets",
		)
			.select(
				Database.raw(
					`id,
       case
           when
               (select true
                from budget_items
                where (courtesy = true or max_discount = true)
                  and (approved = false and courtesy_approved_at is not null)
                  and deleted_at is null
                  and budget_items.budget_id = budgets.id
                group by budget_id) = true then 'Nao Aprovada'
           else budgets.status end as status`,
				),
			)
			.where("business_unit_id", authCtx.unit.id)
			.orderByRaw("created_at desc");

		return Promise.all(
			attendances.map(async (elem) => {
				const jsonObj = elem.toJSON();

				Object.assign(jsonObj, {
					budgets: elem.budgets.map((b) => ({
						...b.toJSON(),
						status: statuses.find((s) => s.id === b.id)?.status ?? b.status,
					})),
				});

				const bills = await Bill.query()
					.whereIn(
						"id",
						elem.budgets.map((b) => b.bill_id),
					)
					.select("id", "tag", "documents_status", "created_at", "budget_id");
				Object.assign(jsonObj, {
					bills: bills.map((b) => {
						return { ...b.toJSON(), budget_id: b.budget_id };
					}),
				});

				const billDocuments = await BillDocument.query()
					.whereIn(
						"bill_id",
						bills.map((b) => b.id),
					)
					.preload("generationUser", (query) => {
						query.select("id", "name");
					})
					.preload("printUser", (query) => {
						query.select("id", "name");
					})
					.preload("documentTemplate", (query) => {
						query.select("id", "description", "type", "template");
					});
				Object.assign(jsonObj, {
					documents: billDocuments,
				});

				if (elem.budgets.some((b) => b.status === BudgetStatus.C)) {
					const treatments = await Treatment.query()
						.where("economic_group_id", authCtx.group.id)
						.where("business_unit_id", authCtx.unit.id)
						.whereIn(
							"bill_id",
							elem.budgets.map((b) => b.bill_id).filter(Boolean),
						)
						.preload("items", (query) => {
							// query.whereNull('deleted_at')
							query.preload("productVariation", (query) => {
								query.preload("product");
							});
						})
						.preload("executions", (query) => {
							query.preload("executionUser");
							query.preload("productivityItem");
							// query.whereNull('deleted_at')
						});

					Object.assign(jsonObj, {
						treatments: treatments.map((elem) => ({
							id: elem.id,
							emission_date: elem.emissionDate,
							observations: elem.observations,
							status: elem.status,
							cancellation_date: elem.cancellationDate,
							cancellation_observations: elem.cancellationObservations,

							items: elem.items.map((exec) => ({
								description: exec.productVariation.product.description,
								quantity: exec.quantity,
								quantity_executed: exec.quantityExecuted,
								scheduled_quantity: exec.scheduledQuantity,
								observations: exec.observations,
								status: exec.status,
							})),

							executions: elem.executions.map((exec) => ({
								schedule_id: exec.schedule_id,
								schedule_date: exec.scheduleDate,
								scheduled_quantity: exec.scheduledQuantity,
								quantity_executed: exec.quantityExecuted,
								execution_date: exec.executionDate,
								observations: exec.observations,
								status: exec.status,
								user: this.sharedService.captureGroup(
									exec.executionUser,
									(v) => ({
										id: v.id,
										name: v.name,
									}),
								),
								productivitItem: this.sharedService.captureGroup(
									exec.productivityItem,
									(v) => ({
										id: v.id,
										description: v.description,
									}),
								),
							})),
						})),
					});
				}

				return jsonObj;
			}),
		);
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

		if (data.budget_id) {
			qb.where("id", data.budget_id);
		}

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
			qb.where("tag", data.tag);
		}

		if (data.pending === "true") {
			qb.where("pending", true);
		} else if (data.pending === "false") {
			qb.where("pending", false);
		}

		const result = await qb;

		const status: { id: string; status: string }[] = await Database.from(
			"budgets",
		)
			.select(
				Database.raw(
					`id,
       case
           when
               (select true
                from budget_items
                where (courtesy = true or max_discount = true)
                  and (approved = false and courtesy_approved_at is not null)
                  and deleted_at is null
                  and budget_items.budget_id = budgets.id
                group by budget_id) = true then 'Nao Aprovada'
           else budgets.status end as status`,
				),
			)
			.whereIn(
				"id",
				result.map((b) => b.id),
			)
			.orderByRaw("created_at desc");

		return result.map((b) => ({
			...b.toJSON(),
			status: status.find((s) => s.id === b.id)?.status ?? b.status,
		}));
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
			qb.where("tag", data.tag);
		}

		if (data.pending === "true") {
			qb.where("pending", true);
		} else if (data.pending === "false") {
			qb.where("pending", false);
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

					query.preload("businessUnitProducts", (query) => {
						query.where("businness_unit_id", unitId);
						query.select("id", "maximum_discount_percentage");
					});
				});

				query.preload("courtesyIssuedUser", (query) => {
					query.select(["id", "name"]);
				});

				query.preload("courtesyApprovedUser", (query) => {
					query.select(["id", "name"]);
				});
			})
			.preload("payments", (query) => {
				query.preload("approvalUser", (query) => {
					query.select(["id", "name"]);
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
			.orderByRaw("description asc")
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
							query.where("price", ">=", Number.parseFloat(data.minPrice));
						}

						if (data.maxPrice) {
							query.where("price", "<=", Number.parseFloat(data.maxPrice));
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
					query.where("stock", ">=", Number.parseFloat(data.quantity));
				}

				if (data.minPrice) {
					query.where("price", ">=", Number.parseFloat(data.minPrice));
				}

				if (data.maxPrice) {
					query.where("price", "<=", Number.parseFloat(data.maxPrice));
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
				authCtx,
				data.items.map((elem) => ({
					variationId: elem.productVariationId,
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
					courtesy: elem.courtesy,
					maxDiscount: elem.maxDiscount,
				})),
			);
			if (result.length > 0) {
				// return result;
				throw new BadRequestException(
					"Desconto máximo foi excedido",
					400,
					"E_ERR",
				);
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
				.preload("product")
				.whereIn(
					"id",
					data.items.map(({ productVariationId }) => productVariationId),
				);

			for (const item of data.items.filter((i) => i.courtesy)) {
				const variation = items.find((v) => v.id === item.productVariationId);

				if (!variation) {
					throw new InternalErrorException(
						"Produto enviado não foi encontrado",
						500,
						"E_ERR",
					);
				}

				if (item.courtesy && !variation.product.courtesy) {
					throw new BadRequestException(
						`Produto '${variation.product.description}' não pode ser usado com cortesia`,
						400,
						"E_ERR",
					);
				}
			}

			const budget = await Budget.create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					client_id: data.clientId,
					patient_id: data.patientId,
					user_id: authCtx.user.id,
					seller_id: data.sellerId ?? authCtx.user.id,
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
					pending: data.items.some((i) => i.courtesy || i.maxDiscount),
					tag: GenerateTag(
						Number.parseInt(authCtx.unit.unitConfig.budgetCounter, 10) + 1,
					),
				},
				{
					client: trx,
				},
			);
			await authCtx.unit.unitConfig
				.merge({
					budgetCounter: (
						Number.parseInt(authCtx.unit.unitConfig.budgetCounter, 10) + 1
					).toString(),
				})
				.useTransaction(trx)
				.save();

			for (const item of data.items) {
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
						courtesy_issued_user_id:
							item.courtesy || item.maxDiscount ? authCtx.user.id : undefined,

						courtesy: item.courtesy,
						saleValue: new Decimal(item.saleValue),
						maxDiscount: item.maxDiscount ?? false,
						unitaryValue: item.courtesy ? 0 : item.unitaryValue,
						discountValue: item.courtesy ? 0 : item.discountValue,
						quantity: new Decimal(item.quantity),
						totalValue: item.courtesy
							? 0
							: item.quantity * item.unitaryValue - item.discountValue,
						status: BudgetStatus.A,
					},
					{
						client: trx,
					},
				);
			}

			const [productSum, serviceSum, discountSum] = data.items
				.filter((f) => !f.courtesy)
				.reduce(
					(acc, curr) => {
						const item = items.find((i) => i.id === curr.productVariationId);
						if (!item) {
							throw new InternalErrorException(
								"Não deveria acontecer, mas um item não foi encontrado",
								400,
								"E_ERR",
							);
						}

						if (item.product.type === ProductType.PRODUCT) {
							acc[0] += curr.unitaryValue * curr.quantity - curr.discountValue;
						}
						if (item.product.type === ProductType.SERVICE) {
							acc[1] += curr.unitaryValue * curr.quantity - curr.discountValue;
						}

						acc[2] += curr.discountValue;

						return acc;
					},
					[0, 0, 0],
				);

			await budget
				.merge({
					pending: data.items.some((f) => f.courtesy || f.maxDiscount),
					productValue: productSum,
					serviceValue: serviceSum,
					discountValue: discountSum,
					totalValue: productSum + serviceSum,
				})
				.useTransaction(trx)
				.save();

			return budget;
		});
	}

	public async updateBudget(
		authCtx: AuthContext,
		data: {
			id: string;
			clientId: string;
			expirationDate: DateTime;
			sellerId: string;
			reviewerId?: string;
			observation?: string;
			internalObservation?: string;
			maxDiscount: boolean;
			items: {
				budgetItemId?: string;
				maxDiscount: boolean;
				courtesy?: boolean;
				discountValue: number;
				productVariationId: string;
				quantity: number;
				unitaryValue: number;
				saleValue?: number;
			}[];
			budgetDate: DateTime;
			dailyMovementId: string;
		},
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.query()
				.useTransaction(trx)
				.where("id", data.id)
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

			const tasks = data.items.map(async (elem) => {
				const productVariation = await ProductVariation.query()
					.useTransaction(trx)
					.where("id", elem.productVariationId)
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

				if (elem.courtesy && !productVariation.product.courtesy) {
					throw new BadRequestException(
						`Produto '${productVariation.product.description}' não pode ser usado com cortesia`,
						400,
						"E_ERR",
					);
				}

				if (
					productVariation.businessUnitProducts.some(
						(p) =>
							!data.maxDiscount && p.maximumDiscountValue < elem.discountValue,
					)
				) {
					throw new BadRequestException(
						"Desconto máximo foi excedido",
						400,
						"E_MAX_DISCOUNT",
					);
				}

				return elem.budgetItemId
					? BudgetItem.query()
							.useTransaction(trx)
							.where("budget_id", budget.id)
							.where("id", elem.budgetItemId)
							.update({
								courtesy_issued_user_id: elem.courtesy
									? authCtx.user.id
									: undefined, // mantém valor anterior

								courtesy: elem.courtesy,
								max_discount: elem.maxDiscount,
								saleValue: new Decimal(elem.saleValue ?? 0).toNumber(),
								unitaryValue: elem.courtesy ? 0 : elem.unitaryValue,
								discountValue: elem.courtesy ? 0 : elem.discountValue,
								quantity: new Decimal(elem.quantity).toNumber(),
								totalValue: elem.courtesy
									? 0
									: elem.quantity * elem.unitaryValue - elem.discountValue,
							})
					: BudgetItem.create(
							{
								economic_group_id: authCtx.group.id,
								business_unit_id: authCtx.unit.id,
								product_variation_id: elem.productVariationId,
								courtesy_issued_user_id: elem.courtesy ? authCtx.user.id : null,
								budget_id: budget.id,

								courtesy: elem.courtesy,
								maxDiscount: elem.maxDiscount,
								saleValue: new Decimal(elem.saleValue ?? 0),
								unitaryValue: elem.courtesy ? 0 : elem.unitaryValue,
								discountValue: elem.courtesy ? 0 : elem.discountValue,
								quantity: new Decimal(elem.quantity),
								totalValue: elem.courtesy
									? 0
									: elem.quantity * elem.unitaryValue - elem.discountValue,
								status: BudgetStatus.A,
							},
							{ client: trx },
						);
			});
			await Promise.all(tasks);

			const existingItems = await BudgetItem.query()
				.useTransaction(trx)
				.where("budget_id", budget.id)
				.where("status", BudgetStatus.A)
				.where("courtesy", false)
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			const [productSum, serviceSum, discountSum] = existingItems.reduce(
				(acc, curr) => {
					if (curr.productVariation.product.type === ProductType.PRODUCT) {
						// acc[0] +=
						// 	curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
						acc[0] += curr.totalValue;
					}
					if (curr.productVariation.product.type === ProductType.SERVICE) {
						// acc[1] +=
						// 	curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
						acc[1] += curr.totalValue;
					}

					acc[2] += curr.discountValue;

					return acc;
				},
				[0, 0, 0],
			);

			const pendingItems = await BudgetItem.query()
				.useTransaction(trx)
				.where("budget_id", budget.id)
				.where("status", BudgetStatus.A)
				.whereRaw(
					"((courtesy = true or max_discount = true) and courtesy_approved_at is null)",
				);

			return budget
				.merge({
					seller_id: data.sellerId,
					client_id: data.clientId,
					reviewer_id: data.reviewerId,
					daily_movement_id: data.dailyMovementId,

					pending: pendingItems.length > 0,
					productValue: productSum,
					serviceValue: serviceSum,
					discountValue: discountSum,
					totalValue: productSum + serviceSum,

					expirationDate: data.expirationDate,
					budgetDate: data.budgetDate,
					observation: data.observation,
					internalObservation: data.internalObservation,
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

			if (!data.courtesy || !data.maxDiscount) {
				const result = await this.sharedService.checkDiscount(trx, authCtx, [
					{
						variationId: data.productVariationId,
						unitaryValue: data.unitaryValue,
						discountValue: data.discountValue,
						quantity: data.quantity,
						courtesy: data.courtesy,
						maxDiscount: data.maxDiscount,
					},
				]);
				if (result.length > 0) {
					// return result;
					throw new BadRequestException(
						"Desconto máximo foi excedido",
						400,
						"E_ERR",
					);
				}
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

			if (data.courtesy && !productVariation.product.courtesy) {
				throw new BadRequestException(
					`Produto '${productVariation.product.description}' não pode ser usado com cortesia`,
					400,
					"E_ERR",
				);
			}

			if (
				productVariation.businessUnitProducts.some(
					(p) => p.maximumDiscountValue < data.discountValue,
				)
			) {
				throw new BadRequestException(
					"Desconto máximo foi excedido",
					400,
					"E_MAX_DISCOUNT",
				);
			}

			const item = await budget.related("items").create(
				{
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					product_variation_id: data.productVariationId,
					courtesy_issued_user_id: data.courtesy ? authCtx.user.id : null,

					courtesy: data.courtesy,
					saleValue: new Decimal(data.saleValue),
					unitaryValue: data.courtesy ? 0 : data.unitaryValue,
					discountValue: data.courtesy ? 0 : data.discountValue,
					quantity: new Decimal(data.quantity),
					totalValue: data.courtesy
						? 0
						: data.quantity * data.unitaryValue - data.discountValue,
					status: BudgetStatus.A,
				},
				{
					client: trx,
				},
			);

			await budget
				.merge({
					pending: data.courtesy || data.maxDiscount ? true : budget.pending,

					productValue:
						productVariation.product.type === ProductType.PRODUCT &&
						!data.courtesy
							? budget.productValue + item.totalValue
							: budget.productValue,
					serviceValue:
						productVariation.product.type === ProductType.SERVICE &&
						!data.courtesy
							? budget.serviceValue + item.totalValue
							: budget.serviceValue,
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
				authCtx,
				data.map((elem) => ({
					variationId: elem.productVariationId,
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
					courtesy: elem.courtesy,
					maxDiscount: elem.maxDiscount,
				})),
			);
			if (result.length > 0) {
				// return result;
				throw new BadRequestException(
					"Desconto máximo foi excedido",
					400,
					"E_ERR",
				);
			}

			const variations = await ProductVariation.query()
				.useTransaction(trx)
				.preload("product")
				.whereIn(
					"id",
					data.map((d) => d.productVariationId),
				);

			const tasks = data.map(async (item) => {
				const budget = await Budget.findOrFail(item.budgetId);
				const dbItem = await budget.related("items").create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						product_variation_id: item.productVariationId,
						courtesy_issued_user_id: item.courtesy ? authCtx.user.id : null,

						courtesy: item.courtesy,
						maxDiscount: item.maxDiscount,
						saleValue: new Decimal(item.saleValue),
						unitaryValue: item.courtesy ? 0 : item.unitaryValue,
						discountValue: item.courtesy ? 0 : item.discountValue,
						quantity: new Decimal(item.quantity),
						totalValue: item.courtesy
							? 0
							: item.quantity * item.unitaryValue - item.discountValue,
						status: BudgetStatus.A,
					},
					{
						client: trx,
					},
				);

				const variation = variations.find(
					(v) => v.id === item.productVariationId,
				);
				if (!variation) {
					throw new BadRequestException(
						"Variação não encontrada",
						400,
						"E_ERR",
					);
				}

				await budget
					.merge({
						pending: data.some((f) => f.courtesy || f.maxDiscount)
							? true
							: budget.pending,
						productValue:
							variation.product.type === ProductType.PRODUCT && !item.courtesy
								? budget.productValue + dbItem.totalValue
								: budget.productValue,
						serviceValue:
							variation.product.type === ProductType.SERVICE && !item.courtesy
								? budget.serviceValue + dbItem.totalValue
								: budget.serviceValue,
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
		data: IUpdateBudgetItemData[],
	) {
		return Database.transaction(async (trx) => {
			const budgetItems = await BudgetItem.query()
				.whereIn(
					"id",
					data.map((d) => d.budgetItemId),
				)
				.where("business_unit_id", authCtx.unit.id)
				.preload("budget")
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			const result = await this.sharedService.checkDiscount(
				trx,
				authCtx,
				data.map((elem) => ({
					variationId:
						budgetItems.find((f) => f.id === elem.budgetItemId)
							?.product_variation_id ?? v4(),
					unitaryValue: elem.unitaryValue,
					discountValue: elem.discountValue,
					quantity: elem.quantity,
					courtesy: elem.courtesy,
					maxDiscount: elem.maxDiscount,
				})),
			);
			if (result.length > 0) {
				// return result;
				throw new BadRequestException(
					"Desconto máximo foi excedido",
					400,
					"E_ERR",
				);
			}

			const tasks = data.map(async (elem) => {
				const budgetItem = budgetItems.find((f) => f.id === elem.budgetItemId);
				if (!budgetItem) {
					throw new BadRequestException(
						"Item do orçamento não encontrado",
						400,
						"E_ERR",
					);
				}

				return budgetItem
					.merge({
						courtesy_issued_user_id: elem.courtesy
							? budgetItem.courtesy_approved_user_id || authCtx.user.id
							: null,
						unitaryValue: elem.unitaryValue,
						discountValue: elem.discountValue,
						quantity: new Decimal(elem.quantity),
						totalValue: elem.quantity * elem.unitaryValue - elem.discountValue,
						status: elem.status,
						courtesy: elem.courtesy,
					})
					.useTransaction(trx)
					.save();
			});
			const updatedItems = await Promise.all(tasks);

			const budget = await Budget.query()
				.where("id", updatedItems.at(0)?.budget_id ?? v4())
				.useTransaction(trx)
				.firstOrFail();

			const existingItems = await BudgetItem.query()
				.where("budget_id", budget.id)
				.where("status", BudgetStatus.A)
				.where("courtesy", false)
				.preload("productVariation", (query) => {
					query.preload("product");
				});

			const [productSum, serviceSum, discountSum] = existingItems.reduce(
				(acc, curr) => {
					if (curr.productVariation.product.type === ProductType.PRODUCT) {
						// acc[0] +=
						// 	curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
						acc[0] += curr.totalValue;
					}
					if (curr.productVariation.product.type === ProductType.SERVICE) {
						// acc[1] +=
						// 	curr.unitaryValue * curr.quantity.toNumber() - curr.discountValue;
						acc[1] += curr.totalValue;
					}

					acc[2] += curr.discountValue;

					return acc;
				},
				[0, 0, 0],
			);

			const pendingItems = await BudgetItem.query()
				.where("budget_id", budget.id)
				.where("status", BudgetStatus.A)
				.whereRaw(
					"((courtesy = true or max_discount = true) and courtesy_approved_at is null)",
				);

			await budget
				.merge({
					pending: pendingItems.length > 0,
					productValue: productSum,
					serviceValue: serviceSum,
					discountValue: discountSum,
					totalValue: productSum + serviceSum,
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async deleteBudgetItem(authCtx: AuthContext, id: string) {
		return Database.transaction(async (trx) => {
			const budgetItem = await BudgetItem.query()
				.where("id", id)
				.where("business_unit_id", authCtx.unit.id)
				.preload("budget")
				.first();

			if (!budgetItem) {
				throw this.sharedService.ResourceNotFound();
			}

			if (budgetItem.status !== BudgetStatus.A) {
				throw new BadRequestException(
					"Apenas itens ativos podem ser excluidos",
					400,
					"E_INVALID_STATUS",
				);
			}

			if (
				budgetItem.budget.paidValue >
				budgetItem.budget.totalValue - budgetItem.totalValue
			) {
				throw new BadRequestException(
					"Valor dos pagamentos lançados, é maior que o valor do Orçamento sem o item que está sendo excluído. Para excluir o item, é necessário excluir parte dos pagamentos lançados no Orçamento",
					400,
					"",
				);
			}

			const updatedItem = await budgetItem
				.merge({
					exclusion_user_id: authCtx.user.id,
					deletedAt: DateTime.now(),
					status: BudgetStatus.E,
				})
				.useTransaction(trx)
				.save();

			const existingItems = await BudgetItem.query()
				.where("budget_id", budgetItem.budget_id)
				.whereNot("id", id)
				.where("status", BudgetStatus.A)
				.preload("productVariation", (q) => {
					q.preload("product");
				});

			const [productSum, serviceSum, discountSum] = existingItems
				.filter((f) => !f.courtesy)
				.reduce(
					(acc, curr) => {
						if (curr.productVariation.product.type === ProductType.PRODUCT) {
							acc[0] +=
								curr.unitaryValue * curr.quantity.toNumber() -
								curr.discountValue;
						}
						if (curr.productVariation.product.type === ProductType.SERVICE) {
							acc[1] +=
								curr.unitaryValue * curr.quantity.toNumber() -
								curr.discountValue;
						}

						acc[2] += curr.discountValue;

						return acc;
					},
					[0, 0, 0],
				);

			const budgetPayments = await BudgetPayment.query()
				.useTransaction(trx)
				.where("budget_id", budgetItem.budget_id)
				.where("status", "Aberto" as TBudgetPaymentStatus);

			await budgetItem.budget
				.merge({
					pending:
						existingItems.some((i) => i.courtesy || i.maxDiscount) ||
						budgetPayments.some((p) => p.pending),
					productValue: productSum,
					serviceValue: serviceSum,
					discountValue: discountSum,
					totalValue: productSum + serviceSum,
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

		if (model.pending) {
			throw new BadRequestException(
				"Orçamento possui pendencias de liberação e não pode ser confirmado",
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
			.whereNotIn("id", data.notConfirmedItems)
			.preload("productVariation", (query) => {
				query.preload("product");
			});

		if (items.some((i) => (i.courtesy || i.maxDiscount) && !i.approved)) {
			throw new BadRequestException(
				"Este orçamento possui pendencias de Cortesia/Desconto Máximo que precisam ser aprovadas antes de ser confirmado",
				400,
				"E_ERR",
			);
		}

		const rules = await TaxationGroupRule.query()
			.whereHas("taxationGroup", (query) => {
				query.whereIn(
					"id",
					items.map((item) => item.productVariation.product.taxation_group_id),
				);
			})
			.where("movement_type", MovementType.S)
			.where("movement_category", MovementCategory.NS)
			.where("fromUf", authCtx.unit.state ?? "")
			.where("toUf", authCtx.unit.state ?? "")
			.where(
				"company_type",
				authCtx.unit.simple ? CompanyType.S : CompanyType.N,
			)
			.preload("taxationGroup")
			.preload("taxOperation");

		return Database.transaction(async (trx) => {
			const invalidRows = await this.depositService.validateDepositOperation(
				trx,
				authCtx,
				items
					.filter((f) => !data.notConfirmedItems.includes(f.id))
					.map((elem) => ({
						productVariationId: elem.product_variation_id,
						quantity: elem.quantity.toNumber(),
					})),
			);
			if (invalidRows.length > 0) {
				throw new BadRequestException(
					`Produto(s) não existe no depósito= ${invalidRows.map((r) => r.description).join(" | ")}`,
					400,
					"E_ERR",
				);
			}

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
					documentStatus: "Não Gerados",

					otherValue: 0,
					tag: GenerateTag(
						Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1,
					),
				},
				{ client: trx },
			);
			await authCtx.unit.unitConfig
				.merge({
					billCounter: (
						Number.parseInt(authCtx.unit.unitConfig.billCounter, 10) + 1
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
						const totalValue = item.quantity
							.times(item.unitaryValue)
							.minus(item.discountValue)
							.toNumber();
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

							approved: item.approved,
							maxDiscount: item.maxDiscount,
							pendingObservations: item.pendingObservations,

							courtesy: item.courtesy,
							courtesy_approved_user_id: item.courtesy_approved_user_id,
							courtesy_issued_user_id: item.courtesy_issued_user_id,
							courtesyApprovedAt: item.courtesyApprovedAt,

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

			// TODO FIX
			const itemsToUpdate = await model.related("items").query();
			const tasks = itemsToUpdate.map((elem) => {
				return elem
					.merge({
						status: data.notConfirmedItems.includes(elem.id)
							? BudgetStatus.N
							: BudgetStatus.C,
					})
					.useTransaction(trx)
					.save();
			});
			await Promise.all(tasks);

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
					observation: data.observation,
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

			// await this.depositService.updateDepositItems(
			// 	trx,
			// 	authCtx,
			// 	items.map((elem) => ({
			// 		productVariationId: elem.product_variation_id,
			// 		quantity: elem.quantity.toNumber(),
			// 	})),
			// );

			await this.depositService.updateDepositItems(trx, authCtx, bill.id);

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
						quantity: new Decimal(item.quantity),
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
				tefFlagId?: string;
				tefAcquirerId?: string;
				paymentMethodFlagId?: string;

				totalValue: number;
				installments: number;
				maxParcelas?: boolean;
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

			const paymentMethods = await PaymentMethod.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((d) => d.paymentMethodId),
				);

			const paymentMethodFlags = await PaymentMethodFlag.query()
				.useTransaction(trx)
				.whereIn(
					"id",
					data.items.map((d) => d.paymentMethodFlagId ?? 0).filter(Boolean),
				);

			const [{ count }] = await Database.from("budget_payments")
				.useTransaction(trx)
				.where("budget_id", data.budgetId)
				.count("*");

			const tasks = data.items.map(async (elem, index) => {
				if (elem.paymentMethodFlagId) {
					const paymentMethodFlag = paymentMethodFlags.find(
						(pm) => pm.id === elem.paymentMethodFlagId,
					);
					if (!paymentMethodFlag) {
						throw new InternalErrorException(
							"Bandeira não encontrada",
							500,
							"E_ERR",
						);
					}

					if (elem.installments > paymentMethodFlag.maxInstallments) {
						throw new BadRequestException(
							"Numero de parcelas é Superior ao permitido pela forma de pagamento",
							400,
							"E_ERR",
						);
					}

					if (
						elem.installments >
							(paymentMethodFlag.installmentsWithoutPassword ?? 0) &&
						!elem.maxParcelas
					) {
						throw new BadRequestException(
							"Este Orçamento ficará pendente de liberação pois o Numero de Parcelas lançado exige liberação. Deseja enviar para aprovação ?",
							400,
							"E_ERR",
						);
					}
				} else {
					const paymentMethod = paymentMethods.find(
						(pm) => pm.id === elem.paymentMethodId,
					);
					if (!paymentMethod) {
						throw new InternalErrorException(
							"Método não encontrado",
							500,
							"E_ERR",
						);
					}

					if (elem.installments > paymentMethod.maxInstallments) {
						throw new BadRequestException(
							"Numero de parcelas é Superior ao permitido pela forma de pagamento",
							400,
							"E_ERR",
						);
					}

					if (
						elem.installments >
							(paymentMethod.installmentsWithoutPassword ?? 0) &&
						!elem.maxParcelas
					) {
						throw new BadRequestException(
							"Este Orçamento ficará pendente de liberação pois o Numero de Parcelas lançado exige liberação. Deseja enviar para aprovação ?",
							400,
							"E_ERR",
						);
					}
				}

				return await BudgetPayment.create(
					{
						economic_group_id: authCtx.group.id,
						business_unit_id: authCtx.unit.id,
						user_id: authCtx.user.id,
						budget_id: budget.id,
						payment_method_id: elem.paymentMethodId,
						tef_flag_id: elem.tefFlagId,
						tef_acquirer_id: elem.tefAcquirerId,

						pending: elem.maxParcelas ?? false,
						block: Number.parseInt(count) + index + 1,
						totalValue: elem.totalValue,
						installments: elem.installments,
						status: "Aberto",
						issueDate: DateTime.now(),
					},
					{ client: trx },
				);
			});

			const result = await Promise.all(tasks);

			await budget
				.merge({
					paidValue: decimalPaid.plus(decimalSum).toNumber(),
					// continua pendente ou fica pendente se algo tá pendente
					pending: budget.pending || result.some((r) => r.pending),
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
				.where("budget_id", row.budget_id)
				.where("status", "Aberto" as TBudgetPaymentStatus);

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

	public async confirmBudgetPayment(
		authCtx: AuthContext,
		data: {
			budgetPaymentId: number;
			budgetId: string;
			blockRef: number;
		},
	) {
		return Database.transaction(async (trx) => {
			const row = await BudgetPayment.query()
				.useTransaction(trx)
				.where("id", data.budgetPaymentId)
				.andWhere("economic_group_id", authCtx.group.id)
				.andWhere("business_unit_id", authCtx.unit.id)
				.andWhere("budget_id", data.budgetId)
				.whereHas("budget", (query) => {
					query
						.andWhere("economic_group_id", authCtx.group.id)
						.andWhere("business_unit_id", authCtx.unit.id);
				})
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
					conclusion_user_id: authCtx.user.id,

					blockRef: data.blockRef,
					confirmationDate: DateTime.now(),
					status: "Baixado",
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async excludeBudgetPayment(
		authCtx: AuthContext,
		data: {
			budgetPaymentId: number;
			origin: TBudgetPaymentExclusionOrigin;
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

			if (data.origin === "Orçamento" && row.budget.status !== BudgetStatus.A) {
				throw new BadRequestException(
					"Orçamento precisa estar Aberto",
					400,
					"E_ERR",
				);
			}

			if (
				data.origin === "Venda" &&
				![BudgetStatus.C, BudgetStatus.P].includes(row.budget.status)
			) {
				throw new BadRequestException(
					"Orçamento precisa estar Confirmado totalmente ou parcialmente",
					400,
					"E_ERR",
				);
			}

			await row
				.merge({
					exclusion_user_id: authCtx.user.id,

					exclusionOrigin: data.origin,
					status: "Excluido",
					deletedAt: DateTime.now(),
				})
				.useTransaction(trx)
				.save();

			const budgetPayments = await BudgetPayment.query()
				.useTransaction(trx)
				.where("budget_id", row.budget_id)
				.where("status", "Aberto" as TBudgetPaymentStatus);

			await row.budget
				.merge({
					paidValue: this.sharedService.sum(
						budgetPayments.map((elem) => elem.totalValue),
					),
					pending: budgetPayments.some((p) => p.pending),
				})
				.useTransaction(trx)
				.save();
		});
	}

	public async listBudgetPayments(
		authCtx: AuthContext,
		id: string,
		_data: {
			type?: string;
		},
	) {
		const qb = Database.from("budget_payments")
			.debug(true)
			.select(
				Database.raw(`budget_payments.id                as id_Orcamento_Pgto,
       budget_payments.budget_id         as id_Orcamento,
       block                             as bloco,
       total_value                       as valor_total,
       installments                      as qtd_Parcelas_Bloco_pgto,
       pending                           as pgto_pendente,
       approved                          as pgto_aprovado,
       approved_at                       as pgto_aprovado_em,
       approval_user.id                  as pgto_usuario_aprovou_id,
       approval_user.name                as pgto_usuario_aprovou_nome,
       reason                            as pgto_aprovado_motivo,

       payment_methods.id                as id_Forma_Pagamento,
       payment_methods.description       as descricao_Forma_Pagamento,
       tef_flags.id                      as id_badeira_tef,
       tef_flags.description             as descricao_bandeira_tef,
       tef_acquirers.id                  as id_adquirente_tef,
       tef_acquirers.description         as descricao_adquirente_tef,
       status,

       budget_payments.issue_date        as data_Lancamento,
       users.id                          as id_Usuario_lancamento,
       users.name                        as nome_Usuario_lancamento,

       budget_payments.update_date       as data_alteracao,
       update_user.id                    as id_Usuario_alteracao,
       update_user.name                  as nome_Usuario_alteracao,

       budget_payments.confirmation_date as data_confirmacao,
       confirm_user.id                   as id_Usuario_confirmacao,
       confirm_user.name                 as nome_Usuario_confirmacao,

       budget_payments.deleted_at        as data_exclusao,
       exclusion_user.id                 as id_Usuario_exclusao,
       exclusion_user.name               as nome_Usuario_exclusao,
       budget_payments.exclusion_origin  as origem_exclusao,

       payment_methods.requires_document as exige_documento,
       payment_methods.type              as tipo_operacao,
       payment_method_flags.id                                                           as to_remove,
       coalesce(payment_method_flags.max_installments, payment_methods.max_installments) as max_marcelas
       `),
			)
			.join(
				"payment_methods",
				"payment_methods.id",
				"budget_payments.payment_method_id",
			)
			.leftJoin("tef_flags", "tef_flags.id", "budget_payments.tef_flag_id")
			.leftJoin(
				"tef_acquirers",
				"tef_acquirers.id",
				"budget_payments.tef_acquirer_id",
			)
			.joinRaw(
				`left join payment_method_flags on (payment_methods.id = payment_method_flags.payment_method_id and
                                            tef_flags.id = payment_method_flags.tef_flag_id and
                                            tef_acquirers.id = payment_method_flags.tef_acquirer_id)`,
			)
			.join("users", "users.id", "budget_payments.user_id")
			.joinRaw(
				"left join users update_user on update_user.id = budget_payments.change_user_id",
			)
			.joinRaw(
				"left join users confirm_user on confirm_user.id = budget_payments.conclusion_user_id",
			)
			.joinRaw(
				"left join users exclusion_user on exclusion_user.id = budget_payments.exclusion_user_id",
			)
			.joinRaw(
				"left join users approval_user on approval_user.id = budget_payments.approved_user_id",
			)
			.andWhere("budget_payments.economic_group_id", authCtx.group.id)
			.andWhere("budget_payments.business_unit_id", authCtx.unit.id)
			.where("budget_payments.budget_id", id);

		// if (!data.type) {
		// 	qb.whereNot(
		// 		"budget_payments.status",
		// 		"Excluido" as TBudgetPaymentStatus,
		// 	).whereNull("budget_payments.deleted_at");
		// }
		//
		// if (data.type === "Venda") {
		// 	qb.where(
		// 		"budget_payments.status",
		// 		"Aberto" as TBudgetPaymentStatus,
		// 	).whereNull("budget_payments.deleted_at");
		// }

		const payments = await qb.exec();

		const installments = await PaymentMethodFlagInstallment.query()
			.whereIn(
				"payment_method_flag_id",
				payments.map((r) => r.to_remove),
			)
			.orderBy("installment");

		return payments.map((p) => {
			const paymentInstallments = installments.filter(
				(i) => i.payment_method_flag_id === p.to_remove,
			);

			Object.assign(p, {
				to_remove: undefined,
				installments: paymentInstallments.map((pi) => ({
					installment: pi.installment,
					fee: pi.fee,
				})),
			});

			return p;
		});
	}

	async approveCourtesyOrMaxDiscount(
		authCtx: AuthContext,
		data: {
			budgetId: string;
			itemsIdList: string[];
			paymentsIdList: number[];
			email: string;
			password: string;
			reason: string;
			approved: boolean;
		},
	) {
		return Database.transaction(async (trx) => {
			const budget = await Budget.query()
				.where("business_unit_id", authCtx.unit.id)
				.where("id", data.budgetId)
				.preload("items")
				.preload("payments")
				.first();
			if (!budget) {
				throw new BadRequestException("Orçamento não encontrado", 400, "E_ERR");
			}

			const user = await User.query()
				.useTransaction(trx)
				.whereILike("email", data.email)
				.where("system_id", authCtx.system.id)
				.first();

			if (!user) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			if (!(await Hash.verify(user.password, data.password))) {
				throw new BadRequestException(
					"Credenciais inválidas",
					400,
					"E_BAD_CREDENTIALS",
				);
			}

			// const hasPermissions = await this.sharedService.userHasPermission(
			// 	{ ...authCtx, user },
			// 	"ORC11",
			// );
			// if (!hasPermissions) {
			// 	throw new BadRequestException(
			// 		"Usuário sem permissão de fazer a operação",
			// 		400,
			// 		"E_ERR",
			// 	);
			// }

			if (
				budget.items.some(
					(i) =>
						i.status === BudgetStatus.A &&
						(i.maxDiscount || i.courtesy) &&
						!i.approved,
				)
			) {
				if (data.itemsIdList.length === 0) {
					throw new BadRequestException(
						"É preciso informar os itens a serem processados quando se tem itens pendentes",
						400,
						"E_ERR",
					);
				}
			}

			if (
				budget.payments.some((p) => p.pending) &&
				data.paymentsIdList.length === 0
			) {
				throw new BadRequestException(
					"Orçamento tem pagamentos pendentes mas você não mandou lista de aprovados",
					400,
					"E_ERR",
				);
			}

			// if (budget.payments.some((i) => i.pending)) {
			// 	if (!data.paymentsIdList || data.paymentsIdList.length === 0) {
			// 		throw new BadRequestException(
			// 			"É preciso informar pagamentos a serem processados quando se tem pagamentos pendentes",
			// 			400,
			// 			"E_ERR",
			// 		);
			// 	}
			// }

			await budget.merge({ pending: false }).useTransaction(trx).save();

			if (data.approved) {
				await BudgetItem.query()
					.useTransaction(trx)
					.where("budget_id", budget.id)
					.whereIn("id", data.itemsIdList)
					.update({
						courtesy_approved_user_id: user.id,

						pendingObservations: data.reason,
						courtesyApprovedAt: DateTime.now(),
						approved: true,
					} as Partial<BudgetItem>);

				await BudgetPayment.query()
					.useTransaction(trx)
					.where("budget_id", budget.id)
					.whereIn("id", data.paymentsIdList)
					.update({
						approved_user_id: authCtx.user.id,
						pending: false,
						approved: true,
						approvedAt: DateTime.now(),
						reason: data.reason,
					} as Partial<BudgetPayment>);
			} else {
				await BudgetItem.query()
					.useTransaction(trx)
					.where("budget_id", budget.id)
					.whereIn("id", data.itemsIdList)
					.update({
						courtesy_approved_user_id: user.id,

						pendingObservations: data.reason,
						courtesyApprovedAt: DateTime.now(),
						approved: false,
					} as Partial<BudgetItem>);

				await BudgetPayment.query()
					.useTransaction(trx)
					.where("budget_id", budget.id)
					.whereIn("id", data.paymentsIdList)
					.update({
						approved_user_id: authCtx.user.id,
						pending: false,
						approved: false,
						approvedAt: DateTime.now(),
						reason: data.reason,
					} as Partial<BudgetPayment>);
			}

			return null;
		});
	}
}
