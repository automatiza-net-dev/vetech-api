import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import { DateTime } from "luxon";
import { AuthContext } from "./SharedService";
import BadRequestException from "App/Exceptions/BadRequestException";
import { v4, validate } from "uuid";

@inject()
export default class OpportunityMovementsService {
	public async index(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			type?: string;
		},
	) {
		if (!data.type) {
			throw new BadRequestException(
				"É preciso informar um `type`",
				400,
				"E_ERR",
			);
		}

		if (data.type !== "bill" && data.type !== "budget") {
			throw new BadRequestException(
				"Valores inválidos para `type`, é preciso informar entre `bill` e `budget`",
				400,
				"E_ERR",
			);
		}

		if (data.type === "bill") {
			return this.searchBillOpportunityMovements(authCtx, data);
		}

		if (data.type === "budget") {
			return this.searchBudgetOpportunityMovements(authCtx, data);
		}

		throw new BadRequestException(
			"Valores inválidos para `type`, é preciso informar entre `bill` e `budget`",
			400,
			"E_ERR",
		);
	}

	public async searchFromClients(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			type?: string;
			client?: string;
			patient?: string;
		},
	) {
		if (!data.client) {
			throw new BadRequestException(
				"É preciso informar um `client`",
				400,
				"E_ERR",
			);
		}
		if (!validate(data.client)) {
			throw new BadRequestException("ID de cliente inválido", 400, "E_ERR");
		}

		if (data.patient && !validate(data.patient)) {
			throw new BadRequestException("ID de paciente inválido", 400, "E_ERR");
		}

		// if (data.type !== "bill" && data.type !== "budget") {
		// 	throw new BadRequestException(
		// 		"Valores inválidos para `type`, é preciso informar entre `bill` e `budget`",
		// 		400,
		// 		"E_ERR",
		// 	);
		// }

		if (data.type === "bill") {
			return this.searchBillOpportunityMovements(authCtx, data);
		}

		if (!data.type || data.type === "budget") {
			return this.searchBudgetOpportunityMovements(authCtx, data);
		}

		// throw new BadRequestException(
		// 	"Valores inválidos para `type`, é preciso informar entre `bill` e `budget`",
		// 	400,
		// 	"E_ERR",
		// );
	}

	public async searchOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			type?: string;
		},
	): Promise<
		{
			opportunity_id: number;
			movement_id: string;
			type: "bill" | "budget";
		}[]
	> {
		const qb = Database.from("opportunities_movements")
			.select("opportunity_id", "movement_id", "type")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereNull("deleted_at");

		if (data.opportunity) {
			qb.where("opportunity_id", data.opportunity);
		}

		if (data.movement) {
			qb.where("movement_id", data.movement);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		return qb;
	}

	public async createOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.table("opportunities_movements")
			.returning("id")
			.multiInsert(
				data.map((elem) => ({
					economic_group_id: authCtx.group.id,
					business_unit_id: authCtx.unit.id,
					creation_user_id: authCtx.user.id,
					opportunity_id: elem.opportunityId,
					movement_id: elem.movementId,
					type: elem.type,
					created_at: DateTime.now(),
					updated_at: DateTime.now(),
				})),
			);
	}

	public async cancelOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunityId: number;
			movementId: string;
			type: string;
		}[],
	) {
		await Database.from("opportunities_movements")
			.whereNull("deleted_at")
			.where("economic_group_id", authCtx.group.id)
			.where("business_unit_id", authCtx.unit.id)
			.whereIn(
				"opportunity_id",
				data.map((d) => d.opportunityId),
			)
			.whereIn(
				"movement_id",
				data.map((d) => d.movementId),
			)
			.whereIn(
				"type",
				data.map((d) => d.type),
			)
			.update({
				deletion_user_id: authCtx.user.id,
				deleted_at: DateTime.now(),
			});
	}

	private async searchBillOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			client?: string;
			patient?: string;
		},
	): Promise<
		{
			id: string;
			type: "bill";
			tag: string;
			total_value: string;
			bill_date: DateTime;
			itens: {
				id: string;
				description: string;
				total_value: number;
			}[];
		}[]
	> {
		const qb = Database.from("bills")
			.select(
				Database.raw(`bills.id,
       'bill'                                                                    as type,
       tag,
       bills.total_value,
       bill_date,
       coalesce(json_agg(json_build_object('id', bill_items.id, 'description', products.description, 'total_value',
                                           bill_items.total_value)), '[]'::json) as itens`),
			)
			.joinRaw(
				"join bill_items on bills.id = bill_items.bill_id and bill_items.status = 'ATIVA'",
			)
			.joinRaw(
				"join product_variations on bill_items.product_variation_id = product_variations.id",
			)
			.joinRaw("join products on product_variations.product_id = products.id")
			.whereRaw("bills.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("bills.business_unit_id = ?", [authCtx.unit.id])
			.whereRaw("bills.deleted_at is null", [])
			.whereRaw("bill_items.deleted_at is null", [])
			.whereRaw("bills.client_id = ?", [data.client ?? v4()])
			.whereRaw("bills.bill_date::date >= now()::date - interval '30 days'", [])
			.whereRaw(`bills.id not in (select movement_id
                       from opportunities_movements om
                       where om.economic_group_id = bills.economic_group_id
                         and om.business_unit_id = bills.business_unit_id)`)
			.groupByRaw("bills.id");

		return qb;
	}

	private async searchBudgetOpportunityMovements(
		authCtx: AuthContext,
		data: {
			opportunity?: number;
			movement?: string;
			client?: string;
			patient?: string;
		},
	): Promise<
		{
			id: string;
			type: "budget";
			tag: string;
			total_value: number;
			budget_date: DateTime;
			itens: {
				id: string;
				description: string;
				total_value: number;
			}[];
		}[]
	> {
		const qb = Database.from("budgets")
			.select(
				Database.raw(`budgets.id,
       'budget'                                                                    as type,
       tag,
       budgets.total_value,
       budget_date,
       coalesce(json_agg(json_build_object('id', budget_items.id, 'description', products.description, 'total_value',
                                           budget_items.total_value)), '[]'::json) as itens`),
			)
			.joinRaw(
				"join budget_items on budgets.id = budget_items.budget_id and budget_items.status = 'ATIVA'",
			)
			.joinRaw(
				"join product_variations on budget_items.product_variation_id = product_variations.id",
			)
			.joinRaw("join products on product_variations.product_id = products.id")
			.whereRaw("budgets.economic_group_id = ?", [authCtx.group.id])
			.whereRaw("budgets.business_unit_id = ?", [authCtx.unit.id])
			.whereRaw("budgets.deleted_at is null", [])
			.whereRaw("budget_items.deleted_at is null", [])
			.whereRaw("budgets.client_id = ?", [data.client ?? v4()])
			.whereRaw(
				"budgets.budget_date::date >= now()::date - interval '30 days'",
				[],
			)
			.whereRaw(`budgets.id not in (select movement_id
                       from opportunities_movements om
                       where om.economic_group_id = budgets.economic_group_id
                         and om.business_unit_id = budgets.business_unit_id)`)
			.groupByRaw("budgets.id");

		return qb;
	}
}
