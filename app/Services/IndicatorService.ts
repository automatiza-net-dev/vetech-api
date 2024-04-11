import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import { BillStatus } from "App/Models/Bill";
import { BudgetStatus } from "App/Models/Budget";
import { TBusinessUnitEnvironment } from "App/Models/BusinessUnit";
import { FinanceStatus, FinanceType } from "App/Models/Finance";
import { ProductType } from "App/Models/Product";
import { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import { v4 } from "uuid";

@inject()
export default class IndicatorService {
	public async medianTicket(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(total_value) as                total_vendas,
          count(bills.id)                    qtd_vendas,
          count(distinct client_id) as qtd_clientes,
          count(distinct patient_id) as qtd_pacientes
          `,
				),
			)
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.unit) {
			qb.where("business_unit_id", data.unit);
		} else {
			qb.where("business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = (await qb).at(0);

		// TODO check this
		if (!result) {
			return null;
		}

		return {
			id: result?.id,
			identification: result.identification ?? null,
			salesTotal: result.total_vendas,
			qtySales: parseInt(result.qtd_vendas, 10),
			qtyClients: parseInt(result.qtd_clientes, 10),
			qtyPatients: parseInt(result.qtd_pacientes, 10),
		};
	}

	public async medianTicketByOrigin(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(
				Database.raw(
					`
            business_units.id,
            business_units.identification,
            'Recorrentes'          as description,
            sum(bills.total_value) as total
          `,
				),
			)
			.joinRaw(
				`
              join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
                on patient_tutors.client_origin_id = client_origins.id)
                on bills.client_id = patient_tutors.patient_id
               `,
				[],
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at")
			.andWhereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
				[],
			);

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          client_origins.description,
          sum(bills.total_value) as total
          `,
				),
			)
			.joinRaw(
				`
              join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
                on patient_tutors.client_origin_id = client_origins.id)
                on bills.client_id = patient_tutors.patient_id
               `,
				[],
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "client_origins.description")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at")
			.andWhereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
				[],
			);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
			qb2.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.unit) {
			qb1.where("bills.business_unit_id", data.unit);
			qb2.where("bills.business_unit_id", data.unit);
		} else {
			qb1.where("bills.business_unit_id", authCtx.unit.id);
			qb2.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
			qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const [r1, r2] = await Promise.all([qb1, qb2]);
		const result = r1.concat(r2);

		return result
			.map((elem) => ({
				id: elem.id,
				identification: elem.identification,
				description: elem.description,
				total: elem.total,
			}))
			.sort((a, b) => b.total - a.total);
	}

	public async invoicingByProductType(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(Database.raw("sum(total_value) as total_sales"))
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.where("bills.business_unit_id", data.unit ?? authCtx.unit.id)
			.whereNull("bills.deleted_at");

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		const [{ total_sales = "0" }] = await qb1;
		const parsedTotal = parseFloat(total_sales);

		const qb = Database.from("bill_items")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          products.id as pID,
          products.description,
          sum(bill_items.quantity) as qty_sales,
          sum(bill_items.total_value) as total_sales,
          count(distinct bills.client_id) as qty_clients
          `,
				),
			)
			.leftJoin("bills", (query) => {
				query.on("bills.id", "=", "bill_items.bill_id");
			})
			.leftJoin("product_variations", (query) => {
				query.on(
					"product_variations.id",
					"=",
					"bill_items.product_variation_id",
				);
			})
			.leftJoin("products", (query) => {
				query.on("products.id", "=", "product_variations.product_id");
			})
			.leftJoin("business_unit_products", (query) => {
				query
					.on(
						"business_unit_products.product_variation_id",
						"=",
						"bill_items.product_variation_id",
					)
					.andOn(
						"business_unit_products.businness_unit_id",
						"=",
						"bill_items.business_unit_id",
					);
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("products.id", "products.description", "business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.unit) {
			qb.where("bills.business_unit_id", data.unit);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}
		qb.andWhereIn(
			"products.type",
			data.type ? [data.type] : [ProductType.PRODUCT, ProductType.SERVICE],
		);

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			productId: elem.pID,
			description: elem.description,
			qtySales: parseInt(elem.qty_sales, 10),
			qtyClients: parseInt(elem.qty_clients, 10),
			totalSales: elem.total_sales,
			percentage: (elem.total_sales / parsedTotal) * 100,
		}));
	}

	public async invoicingByProductTypeWithSubgroup(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
			subgroup?: string;
		},
	) {
		if (!data.subgroup) {
			throw new BadRequestException(
				"Subgrupo não informado",
				400,
				"BAD_REQUEST",
			);
		}

		const listOfUnits =
			data.units && Array.isArray(data.units) ? data.units : [authCtx.unit.id];

		const qb = Database.from("bill_items")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          products.id as pID,
          products.description,
          subgroups.description as subgroup,
          sum(bill_items.quantity) as qty_sales,
          sum(bill_items.total_value) as total_sales,
          count(distinct bills.client_id) as qty_clients
          `,
				),
			)
			.leftJoin("bills", (query) => {
				query.on("bills.id", "=", "bill_items.bill_id");
			})
			.leftJoin("product_variations", (query) => {
				query.on(
					"product_variations.id",
					"=",
					"bill_items.product_variation_id",
				);
			})
			.leftJoin("products", (query) => {
				query.on("products.id", "=", "product_variations.product_id");
			})
			.leftJoin("business_unit_products", (query) => {
				query
					.on(
						"business_unit_products.product_variation_id",
						"=",
						"bill_items.product_variation_id",
					)
					.andOn(
						"business_unit_products.businness_unit_id",
						"=",
						"bill_items.business_unit_id",
					);
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.leftJoin("subgroups", (query) => {
				query.on("subgroups.id", "=", "products.subgroup_id");
			})
			.groupBy(
				"products.id",
				"products.description",
				"business_units.id",
				"subgroups.description",
			)
			.whereNull("bills.deleted_at")
			.whereNull("bill_items.deleted_at")
			.whereIn("bills.business_unit_id", listOfUnits)
			.where("products.subgroup_id", data.subgroup ?? v4());

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}
		qb.andWhereIn(
			"products.type",
			data.type ? [data.type] : [ProductType.PRODUCT, ProductType.SERVICE],
		);

		const result = await qb;

		const sum = result.reduce(
			(acc, curr) => acc + parseFloat(curr.total_sales),
			0,
		);

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			productId: elem.pID,
			description: elem.description,
			subgroup: elem.subgroup,
			qtySales: parseInt(elem.qty_sales, 10),
			qtyClients: parseInt(elem.qty_clients, 10),
			totalSales: elem.total_sales,
			percentage: (elem.total_sales / sum) * 100,
		}));
	}

	public async invoicingByPaymentMethod(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          'Em Aberto'                               as description,
          sum(bills.total_value - bills.paid_value) as totalPayments,
          sum(bills.total_value)           as totalBills
          `,
				),
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "business_units.identification")
			.orderBy("totalpayments", "desc")
			.whereNull("bills.deleted_at");

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          payment_methods.description,
          sum(bill_payments.total_value) as totalPayments
        `,
				),
			)
			.joinRaw(
				`
          join bill_payments left join tef_flags on bill_payments.tef_flag_id = tef_flags.id
            on bills.id = bill_payments.bill_id and bills.business_unit_id = bill_payments.business_unit_id
               `,
				[],
			)
			.join("payment_methods", (query) => {
				query.on("payment_methods.id", "=", "bill_payments.payment_method_id");
			})
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "payment_methods.description")
			.orderBy("totalpayments", "desc")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
			qb2.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.unit) {
			qb1.where("bills.business_unit_id", data.unit);
			qb2.where("bills.business_unit_id", data.unit);
		} else {
			qb1.where("bills.business_unit_id", authCtx.unit.id);
			qb2.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
			qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const [result1, result2] = await Promise.all([qb1, qb2]);
		const result = result1.concat(result2);

		const total = result1.at(0)?.totalbills ?? 0;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			description: elem.description,
			totalSales: elem.totalpayments,
			percentage: (elem.totalpayments / total) * 100,
		}));
	}

	public async invoicingByNewClients(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end) as totalNovos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end) as totalRecorrentes,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end) as qtdNovos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end) as qtdRecorrentes
          `,
				),
			)
			.leftJoin("patients", (query) => {
				query.on("patients.id", "=", "bills.client_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.where("bills.business_unit_id", data.unit ?? authCtx.unit.id)
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: {
				total: elem.totalnovos,
				qty: parseInt(elem.qtdnovos, 10),
			},
			recurrent: {
				total: elem.totalrecorrentes,
				qty: parseInt(elem.qtdrecorrentes, 10),
			},
		}));
	}

	public async medianTicketConsolidated(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(total_value) as                total_vendas,
          count(bills.id)                    qtd_vendas,
          count(distinct client_id) as qtd_clientes,
          count(distinct patient_id) as qtd_pacientes
          `,
				),
			)
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_unit_id", data.units);
		} else {
			qb.where("business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = (await qb).at(0);

		// TODO check this
		if (!result) {
			return null;
		}

		return {
			id: result?.id,
			identification: result.identification ?? null,
			salesTotal: result.total_vendas,
			qtySales: parseInt(result.qtd_vendas, 10),
			qtyClients: parseInt(result.qtd_clientes, 10),
			qtyPatients: parseInt(result.qtd_pacientes, 10),
		};
	}

	public async medianTicketByOriginConsolidated(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          'Recorrentes'          as description,
          sum(bills.total_value) as total
          `,
				),
			)
			.joinRaw(
				`
              join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
                on patient_tutors.client_origin_id = client_origins.id)
                on bills.client_id = patient_tutors.patient_id
               `,
				[],
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at")
			.andWhereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
				[],
			);

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          client_origins.description,
          sum(bills.total_value) as total
          `,
				),
			)
			.joinRaw(
				`
              join ((patients join patient_tutors on patients.id = patient_tutors.patient_id) join client_origins
                on patient_tutors.client_origin_id = client_origins.id)
                on bills.client_id = patient_tutors.patient_id
               `,
				[],
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "client_origins.description")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at")
			.andWhereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
				[],
			);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
			qb2.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb1.whereIn("bills.business_unit_id", data.units);
			qb2.whereIn("bills.business_unit_id", data.units);
		} else {
			qb1.where("bills.business_unit_id", authCtx.unit.id);
			qb2.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
			qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const [r1, r2] = await Promise.all([qb1, qb2]);
		const result = r1.concat(r2);

		return result
			.map((elem) => ({
				id: elem.id,
				identification: elem.identification,
				description: elem.description,
				total: elem.total,
			}))
			.sort((a, b) => b.total - a.total);
	}

	public async invoicingByProductTypeConsolidated(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(Database.raw("sum(total_value) as total_sales"))
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb1.whereIn("bills.business_unit_id", data.units);
		} else {
			qb1.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		const [{ total_sales = "0" }] = await qb1;
		const parsedTotal = parseFloat(total_sales);

		const qb = Database.from("bill_items")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          products.id as pID,
          products.description,
          sum(bill_items.quantity) as qty_sales,
          sum(bill_items.total_value) as total_sales,
          count(distinct bills.client_id) as qty_clients
          `,
				),
			)
			.leftJoin("bills", (query) => {
				query.on("bills.id", "=", "bill_items.bill_id");
			})
			.leftJoin("product_variations", (query) => {
				query.on(
					"product_variations.id",
					"=",
					"bill_items.product_variation_id",
				);
			})
			.leftJoin("products", (query) => {
				query.on("products.id", "=", "product_variations.product_id");
			})
			.leftJoin("business_unit_products", (query) => {
				query
					.on(
						"business_unit_products.product_variation_id",
						"=",
						"bill_items.product_variation_id",
					)
					.andOn(
						"business_unit_products.businness_unit_id",
						"=",
						"bill_items.business_unit_id",
					);
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("products.id", "products.description", "business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}
		qb.andWhereIn(
			"products.type",
			data.type ? [data.type] : [ProductType.PRODUCT, ProductType.SERVICE],
		);

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			productId: elem.pID,
			description: elem.description,
			qtySales: parseInt(elem.qty_sales, 10),
			qtyClients: parseInt(elem.qty_clients, 10),
			totalSales: elem.total_sales,
			percentage: (elem.total_sales / parsedTotal) * 100,
		}));
	}

	public async invoicingByPaymentMethodConsolidated(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb1 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          'Em Aberto'                               as description,
          sum(bills.total_value - bills.paid_value) as totalPayments,
          sum(distinct bills.total_value)           as totalBills
          `,
				),
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "business_units.identification")
			.orderBy("totalpayments", "desc")
			.whereNull("bills.deleted_at");

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          payment_methods.description,
          sum(bill_payments.total_value) as totalPayments
        `,
				),
			)
			.joinRaw(
				`
          join bill_payments left join tef_flags on bill_payments.tef_flag_id = tef_flags.id
            on bills.id = bill_payments.bill_id and bills.business_unit_id = bill_payments.business_unit_id
               `,
				[],
			)
			.join("payment_methods", (query) => {
				query.on("payment_methods.id", "=", "bill_payments.payment_method_id");
			})
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "payment_methods.description")
			.orderBy("totalpayments", "desc")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb1.where("business_units.environment", "P" as TBusinessUnitEnvironment);
			qb2.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb1.whereIn("bills.business_unit_id", data.units);
			qb2.whereIn("bills.business_unit_id", data.units);
		} else {
			qb1.where("bills.business_unit_id", authCtx.unit.id);
			qb2.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb1.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			qb2.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb1.andWhereRaw("bill_date::date <= ?", [data.toDate]);
			qb2.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const [result1, result2] = await Promise.all([qb1, qb2]);
		const result = result1.concat(result2);

		const total = result1.at(0)?.totalbills ?? 0;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			description: elem.description,
			totalSales: elem.totalpayments,
			percentage: (elem.totalpayments / total) * 100,
		}));
	}

	public async invoicingByNewClientsConsolidated(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end) as totalNovos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end) as totalRecorrentes,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end) as qtdNovos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end) as qtdRecorrentes
          `,
				),
			)
			.leftJoin("patients", (query) => {
				query.on("patients.id", "=", "bills.client_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: {
				total: elem.totalnovos,
				qty: parseInt(elem.qtdnovos, 10),
			},
			recurrent: {
				total: elem.totalrecorrentes,
				qty: parseInt(elem.qtdrecorrentes, 10),
			},
		}));
	}

	public async schedulingIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const salesQb = Database.from("bills")
			.select(
				Database.raw(
					"bills.business_unit_id as id, count(distinct bills.id) as sales, count(distinct bills.client_id) as clients",
				),
			)
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("bills.business_unit_id")
			.whereNot("status", BillStatus.EX);

		const qb = Database.from("schedules")
			.select(
				Database.raw(
					`
            business_units.id,
            business_units.identification,
            count(schedules.id)          as agendados,
            count(schedules.started_at)  as atendidos
          `,
				),
			)
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "schedules.business_unit_id");
			})
			.joinRaw(
				`join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id and schedule_service_types.type = 'A'`,
			)
			.groupBy("business_units.id");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
			salesQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("schedules.business_unit_id", data.units);
			salesQb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("schedules.business_unit_id", authCtx.unit.id);
			salesQb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("schedules.start_hour::date >= ?", [data.fromDate]);
			salesQb.andWhereRaw("bills.bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("schedules.start_hour::date <= ?", [data.toDate]);
			salesQb.andWhereRaw("bills.bill_date::date <= ?", [data.toDate]);
		}

		const salesResult = await salesQb;
		const generalResult = await qb;

		return generalResult.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			scheduled: parseInt(elem.agendados, 10),
			attended: parseInt(elem.atendidos, 10),
			sales: parseInt(salesResult.find((r) => r.id === elem.id)?.sales ?? "0"),
			clients: parseInt(
				salesResult.find((r) => r.id === elem.id)?.clients ?? "0",
			),
		}));
	}

	public async subgroupIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		const totalQb = Database.from("bills")
			.select(Database.raw("sum(bills.total_value) as total_bill_payments"))
			.join("business_units", "business_units.id", "bills.business_unit_id")
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			totalQb.whereIn("bills.business_unit_id", data.units);
		} else {
			totalQb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			totalQb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			totalQb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			totalQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		const [{ total_bill_payments = "0" }] = await totalQb;
		const parsedTotal = parseFloat(total_bill_payments);

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
        business_units.id,
       business_units.identification,
       subgroups.id                    as sID,
       subgroups.description,
       count(bill_items.id)            as count,
       sum(bill_items.quantity)        as quantity,
       sum(bill_items.total_value)     as total,
       count(distinct bills.client_id) as clients
          `,
				),
			)
			.joinRaw(
				`join bill_items on bill_items.bill_id = bills.id and bill_items.status = 'ATIVA' and bill_items.deleted_at is null`,
			)
			.join(
				"product_variations",
				"product_variations.id",
				"bill_items.product_variation_id",
			)
			.join("products", "products.id", "product_variations.product_id")
			.join("subgroups", "subgroups.id", "products.subgroup_id")
			.join("business_units", "business_units.id", "bills.business_unit_id")
			.groupBy("subgroups.id", "subgroups.description", "business_units.id")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bills.bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bills.bill_date::date <= ?", [data.toDate]);
		}

		if (data.type) {
			qb.andWhere("products.type", data.type);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			subgroupID: elem.sid,
			description: elem.description,
			count: parseInt(elem.count, 10),
			quantity: parseInt(elem.quantity, 10),
			total: elem.total,
			uniqueClients: parseInt(elem.clients, 10),
			percentage: (elem.total / parsedTotal) * 100,
		}));
	}

	public async subgroupTreeIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		const totalQb = Database.from("bills")
			.select(Database.raw("sum(bills.total_value) as total_bill_payments"))
			.join("business_units", "business_units.id", "bills.business_unit_id")
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			totalQb.whereIn("bills.business_unit_id", data.units);
		} else {
			totalQb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			totalQb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			totalQb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			totalQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		const [{ total_bill_payments = "0" }] = await totalQb;
		const parsedTotal = parseFloat(total_bill_payments);

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          subgroups.id                as s_id,
          subgroups.description       as s_description,
          products.id,
          products.description,
          sum(bill_items.quantity)    as quantity,
          sum(bill_items.total_value) as total
          `,
				),
			)
			.joinRaw(
				`join bill_items on bill_items.bill_id = bills.id and bill_items.status = 'ATIVA' and bill_items.deleted_at is null`,
			)
			.join(
				"product_variations",
				"product_variations.id",
				"bill_items.product_variation_id",
			)
			.join("products", "products.id", "product_variations.product_id")
			.join("subgroups", "subgroups.id", "products.subgroup_id")
			.join("business_units", "business_units.id", "bills.business_unit_id")
			.groupBy("products.id", "subgroups.id")
			.havingRaw(
				"sum(bill_items.quantity) > 0 and sum(bill_items.total_value) > 0",
				[],
			)
			.orderByRaw("2, 6")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bills.bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bills.bill_date::date <= ?", [data.toDate]);
		}

		if (data.type) {
			qb.andWhere("products.type", data.type);
		}

		const result = await qb;

		const stats: Map<string, { quantity: number; total: number }> = new Map();
		for (const row of result) {
			const key = row.s_id;
			if (!stats.has(key)) {
				stats.set(key, { quantity: 0, total: 0 });
			}

			const data = stats.get(key)!;
			data.quantity += parseFloat(row.quantity);
			data.total += parseFloat(row.total);

			stats.set(key, data);
		}

		return Array.from(stats.keys()).map((key) => {
			const $total = stats.get(key)?.total ?? 0;

			return {
				id: key,
				description: result.find((r) => r.s_id === key).s_description,
				quantity: stats.get(key)?.quantity,
				total: $total,
				percentage: ($total / parsedTotal) * 100,
				children: result
					.filter((r) => r.s_id === key)
					.map((elem) => ({
						id: elem.id,
						description: elem.description,
						quantity: parseInt(elem.quantity, 10),
						total: elem.total,
						percentage: (elem.total / $total) * 100,
					})),
			};
		});
	}

	public async consolidatedSubgroupIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		const totalQb = Database.from("bills")
			.select(Database.raw("sum(bills.total_value) as total_bill_payments"))
			.join("business_units", "business_units.id", "bills.business_unit_id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			totalQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			totalQb.whereIn("bills.business_unit_id", data.units);
		} else {
			totalQb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			totalQb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			totalQb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const [{ total_bill_payments = "0" }] = await totalQb;
		const parsedTotal = parseFloat(total_bill_payments);

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          subgroups.id,
          subgroups.description,
          sum(bill_items.total_value)     as total,
          count(distinct bills.client_id) as clients
          `,
				),
			)
			.leftJoin("bill_items", (query) => {
				query.on("bill_items.bill_id", "=", "bills.id");
			})
			.leftJoin("product_variations", (query) => {
				query.on(
					"product_variations.id",
					"=",
					"bill_items.product_variation_id",
				);
			})
			.leftJoin("products", (query) => {
				query.on("products.id", "=", "product_variations.product_id");
			})
			.leftJoin("subgroups", (query) => {
				query.on("subgroups.id", "=", "products.subgroup_id");
			})
			.groupBy("subgroups.id", "subgroups.description")
			.orderBy("total", "desc")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			totalQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bills.bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bills.bill_date::date <= ?", [data.toDate]);
		}

		if (data.type) {
			qb.andWhere("products.type", data.type);
		}

		const result = await qb;

		return result.map((elem) => ({
			subgroupID: elem.id,
			description: elem.description,
			total: elem.total,
			uniqueClients: parseInt(elem.clients, 10),
			percentage: (elem.total / parsedTotal) * 100,
		}));
	}

	public async opportunitiesIndicators(
		authCtx: AuthContext,
		data: {
			unit?: string;
			group?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		if (!data.unit) {
			throw new BadRequestException("Informe a unidade", 400, "E_ERR");
		}

		const qb = Database.from("opportunity_logs")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(case when crm_statuses.tag = 'N' then 1 else 0 end) as novas,
          sum(case when crm_statuses.tag = 'A' then 1 else 0 end) as agendadas,
          sum(case when crm_statuses.tag = 'C' then 1 else 0 end) as comparecidas,
          sum(case when crm_statuses.tag = 'G' then 1 else 0 end) as ganhos
          `,
				),
			)
			.leftJoin("crm_statuses", (query) => {
				query.on("crm_statuses.id", "=", "opportunity_logs.status_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "opportunity_logs.business_unit_id");
			})
			.groupBy("business_units.id")
			.where("opportunity_logs.business_unit_id", data.unit);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.group) {
			qb.andWhere("opportunity_logs.economic_group_id", data.group);
		}

		if (data.fromDate) {
			qb.andWhereRaw("opportunity_logs.contact_date::date >= ?", [
				data.fromDate,
			]);
		}

		if (data.toDate) {
			qb.andWhereRaw("opportunity_logs.contact_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: parseInt(elem.novas, 10),
			scheduled: parseInt(elem.agendadas, 10),
			attended: parseInt(elem.comparecidas, 10),
			gained: parseInt(elem.ganhos, 10),
		}));
	}

	public async generalOpportunitiesIndicators(
		authCtx: AuthContext,
		data: {
			unit?: string;
			group?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		if (!data.unit) {
			throw new BadRequestException("Informe a unidade", 400, "E_ERR");
		}

		const qb = Database.from("opportunities")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(case when crm_statuses.tag = 'N' then 1 else 0 end) as novas,
          sum(case when crm_statuses.tag = 'A' then 1 else 0 end) as agendadas,
          sum(case when crm_statuses.tag = 'C' then 1 else 0 end) as comparecidas,
          sum(case when crm_statuses.tag = 'G' then 1 else 0 end) as ganhos
          `,
				),
			)
			.joinRaw(
				`
        join
     (opportunity_logs join crm_statuses on opportunity_logs.status_id = crm_statuses.id)
     on opportunities.id = opportunity_logs.opportunity_id and
        opportunities.economic_group_id = opportunity_logs.economic_group_id
               `,
				[],
			)
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "opportunity_logs.business_unit_id");
			})
			.groupBy("business_units.id")
			.where("opportunities.business_unit_id", data.unit);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.group) {
			qb.andWhere("opportunities.economic_group_id", data.group);
		}

		if (data.fromDate) {
			qb.andWhereRaw("opportunities.contact_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("opportunities.contact_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: parseInt(elem.novas, 10),
			scheduled: parseInt(elem.agendadas, 10),
			attended: parseInt(elem.comparecidas, 10),
			gained: parseInt(elem.ganhos, 10),
		}));
	}

	public async unconfirmedBudgetsIndicators(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("budgets")
			.select(
				Database.raw(
					`
            business_units.id,
            business_units.identification,
            sum(budgets.total_value) as total,
            count(distinct budgets.id) as qtd_Orcamentos
          `,
				),
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "budgets.business_unit_id");
			})
			.joinRaw(
				"left join reasons on reasons.id = budgets.cancelation_reason_id and reasons.counts_for_report is true",
				[],
			)
			.groupBy("business_units.id")
			.where("budgets.business_unit_id", data.unit ?? authCtx.unit.id)
			.whereNotIn("budgets.status", [BudgetStatus.C, BudgetStatus.P])
			.whereNull("budgets.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.fromDate) {
			qb.andWhereRaw("budgets.budget_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("budgets.budget_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			total: elem.total,
			unique: parseInt(elem.qtd_orcamentos, 10),
		}));
	}

	public async crmIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("opportunity_logs")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          count(*) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'N' )  as novas_oportunidades,
          count(*) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'A' )  as agendados,
          count(*) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'C' )  as comparecidos,
          count(*) FILTER ( WHERE crm_statuses.type = 'OPR' and crm_statuses.tag = 'G' ) as ganhos
          `,
				),
			)
			.joinRaw(
				`join opportunities on opportunity_logs.opportunity_id = opportunities.id and opportunities.deleted_at is null`,
				[],
			)
			.joinRaw(
				`join business_units on opportunity_logs.business_unit_id = business_units.id`,
				[],
			)
			.joinRaw(
				`join crm_statuses on opportunity_logs.status_id = crm_statuses.id`,
				[],
			)
			.groupBy("business_units.id");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("opportunities.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("opportunity_logs.contact_date::date >= ?", [
				data.fromDate,
			]);
		}

		if (data.toDate) {
			qb.andWhereRaw("opportunity_logs.contact_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: parseInt(elem.novas_oportunidades, 10),
			scheduled: parseInt(elem.agendados, 10),
			attended: parseInt(elem.comparecidos, 10),
			gained: parseInt(elem.ganhos, 10),
		}));
	}

	public async projectionIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id                                                  as e_id,
          economic_groups.company_name                                        as e_name,
          business_units.id                                                   as b_id,
          business_units.identification,
          sum(bills.total_value) / cast(to_char(now(), 'DD') as integer)      as daily_value,
          sum(bills.total_value) / cast(to_char(now(), 'DD') as integer) * 30 as projecao
          `,
				),
			)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
				[],
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
				[],
			)
			.groupBy(
				"economic_groups.id",
				"economic_groups.company_name",
				"business_units.id",
				"business_units.identification",
			)
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.e_name,
				},
				unit: {
					id: elem.b_id,
					identification: elem.identification,
				},
				daily: elem.daily_value,
				projection: elem.projecao,
			};
		});
	}

	public async billingIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const dt = DateTime.fromISO(data.fromDate ?? new Date().toISOString()).plus(
			{ days: 10 },
		);
		const ym = dt.toFormat("yyyyMM");
		const daysOfMonth = dt.daysInMonth ?? 30;

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
            economic_groups.id as e_id,
            economic_groups.company_name as e_name,
            business_units.id as b_id,
            business_units.identification,
            case
              when business_unit_metas.value is not null then metas.description
              else 'SemMetaDefinida' end                           as meta_description,
            case
              when business_unit_metas.value is not null then metas.type
              else 'SemMetaDefinida' end                           as meta_type,
            coalesce(business_unit_metas.value, 0)                   as meta_value,
            sum(bills.total_value)                                   as total,
            sum(bills.total_value) / business_unit_metas.value * 100 as percentage,
            case
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') < ?) then 0
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') > ?)
                then sum(bills.total_value)
              else sum(bills.total_value) / cast(to_char(now(), 'DD') as integer) *
                ? end                                           as projection,
            case
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') < ?) then 0
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') > ?)
                then sum(bills.total_value) / business_unit_metas.value * 100
              else (sum(bills.total_value) / cast(to_char(now(), 'DD') as integer) * ?) /
                business_unit_metas.value *
                100 end                                         as meta_projection

          `,
					[ym, ym, daysOfMonth, ym, ym, daysOfMonth],
				),
			)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(`join systems on economic_groups.system_id = systems.id`)
			.joinRaw(
				`left join metas on (metas.system_id = systems.id or metas.economic_group_id = economic_groups.id) and metas.description = 'Faturamento'`,
			)
			.joinRaw(
				`
        left join business_unit_metas
                   on metas.id = business_unit_metas.meta_id and
                      bills.business_unit_id = business_unit_metas.business_unit_id and
                      to_char(bills.bill_date, 'MM/YYYY') = business_unit_metas.period and
                      business_unit_metas.active = 'true'
        `,
			)
			.groupBy(
				"economic_groups.id",
				"economic_groups.company_name",
				"business_units.id",
				"business_units.identification",
				"metas.description",
				"metas.type",
				"business_unit_metas.value",
			)
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const metasResult = await qb;

		return metasResult.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.e_name,
				},
				unit: {
					id: elem.b_id,
					identification: elem.identification,
				},
				meta: {
					description: elem.meta_description,
					type: elem.meta_type,
					value: elem.meta_value,
				},
				total: elem.total,
				percentage: elem.percentage ?? -1,
				projection: elem.projection,
				metaProjection: elem.meta_projection,
			};
		});
	}

	public async productTypeIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
        economic_groups.id                                                      as e_id,
        economic_groups.company_name                                            as e_name,
        business_units.id                                                       as b_id,
        business_units.identification,
        sum(case when products.type = 'product' then bill_items.total_value else 0 end) as product_total,
        sum(case when products.type = 'service' then bill_items.total_value else 0 end) as service_total
          `,
				),
			)
			.joinRaw(
				`join bill_items on bills.id = bill_items.bill_id and bill_items.status <> 'INATIVA'`,
			)
			.joinRaw(
				`join product_variations on bill_items.product_variation_id = product_variations.id`,
			)
			.joinRaw(`join products on product_variations.product_id = products.id`)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.groupBy("economic_groups.id", "business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const metasResult = await qb;

		return metasResult.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.e_name,
				},
				unit: {
					id: elem.b_id,
					identification: elem.identification,
				},
				productsTotal: elem.product_total,
				servicesTotal: elem.service_total,
			};
		});
	}

	public async salesPerPeriodIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id  as e_id,
          economic_groups.company_name,
          business_units.id   as b_id,
          business_units.identification,
          sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_total",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_novos",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end) as "madrugada_recorrentes",
          sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_total",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_novos",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end) as "manha_recorrentes",
          sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_total",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_novos",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end) as "tarde_recorrentes",
          sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_total",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') = to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_novos",
          sum(case
               when to_char(bills.bill_date, 'MM-AAAA') <> to_char(patients.created_at, 'MM-AAAA') and
                    cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end) as "noite_recorrentes"
          `,
				),
			)
			.joinRaw(`join patients on patients.id = bills.client_id`)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.groupBy("economic_groups.id", "business_units.id")
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const metasResult = await qb;

		return metasResult.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.companyname,
				},
				unit: {
					id: elem.b_id,
					identification: elem.identification,
				},
				dawn: {
					total: elem.madrugada_total,
					new: elem.madrugada_novos,
					recurrent: elem.madrugada_recorrentes,
				},
				morning: {
					total: elem.manha_total,
					new: elem.manha_novos,
					recurrent: elem.manha_recorrentes,
				},
				afternoon: {
					total: elem.tarde_total,
					new: elem.tarde_novos,
					recurrent: elem.tarde_recorrentes,
				},
				night: {
					total: elem.noite_total,
					new: elem.noite_novos,
					recurrent: elem.noite_recorrentes,
				},
			};
		});
	}

	public async budgetsIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		if (!data.type) {
			throw new BadRequestException(
				"Informe o tipo de orçamento",
				400,
				"E_ERR",
			);
		}

		if (!["AVALIADOR", "VENDEDOR"].includes(data.type)) {
			throw new BadRequestException(
				"Tipo de orçamento inválido. Valores permitidos: AVALIADOR, VENDEDOR",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("budgets")
			.select(
				Database.raw(
					`
          economic_groups.id       as e_id,
          economic_groups.company_name,
          business_units.id        as b_id,
          business_units.identification,
          users.id                 as u_id,
          coalesce(users.name, 'Não identificado') as name,
          count(budgets.id)        as total_budgets,
          sum(budgets.total_value) as total_value,
          avg(budgets.total_value) as avg_value,
          sum(case
               when budgets.status in ('CONFIRMADO', 'CONFIRMADO_PARCIAL') then 1
               else 0
              end)                 as confirmed,
          sum(case
               when budgets.status in ('CONFIRMADO', 'CONFIRMADO_PARCIAL') then budgets.total_value
               else 0
              end)                 as total_confirmed_value,
          sum(case
               when budgets.status in ('NAO_CONFIRMADO__CANCELADO') then 1
               else 0
              end)                 as cancelled,
          sum(case
               when budgets.status in ('NAO_CONFIRMADO__CANCELADO') then budgets.total_value
               else 0
              end)                 as total_cancelled_value,
          sum(case
               when budgets.status in ('ABERTO') then 1
               else 0
              end)                 as open,
          sum(case
               when budgets.status in ('ABERTO') then budgets.total_value
               else 0
              end)                 as total_open_value
          `,
				),
			)
			.joinRaw(
				`join business_units on budgets.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.groupBy("economic_groups.id", "business_units.id", "users.id")
			.whereNull("budgets.deleted_at");

		if (data.type === "VENDEDOR") {
			qb.joinRaw(`left join users on budgets.seller_id = users.id`);
		} else {
			qb.joinRaw(`left join users on budgets.reviewer_id  = users.id`);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		}

		if (data.fromDate) {
			qb.andWhereRaw("budget_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("budget_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.company_name,
				},
				unit: {
					id: elem.b_id,
					identification: elem.identification,
				},
				user: {
					id: elem.u_id,
					name: elem.name,
				},
				totalBudgets: parseInt(elem.total_budgets, 10),
				totalValue: elem.total_value,
				avgValue: elem.avg_value,
				confirmed: parseInt(elem.confirmed, 10),
				totalConfirmedValue: elem.total_confirmed_value,
				avgConfirmedValue:
					elem.confirmed === "0"
						? 0
						: elem.total_confirmed_value / parseInt(elem.confirmed, 10),
				cancelled: parseInt(elem.cancelled, 10),
				totalCancelledValue: elem.total_cancelled_value,
				avgCancelledValue:
					elem.cancelled === "0"
						? 0
						: elem.total_cancelled_value / parseInt(elem.cancelled, 10),
				open: parseInt(elem.open, 10),
				totalOpenValue: elem.total_open_value,
				avgOpenValue:
					elem.open === "0"
						? 0
						: elem.total_open_value / parseInt(elem.open, 10),
			};
		});
	}

	public async budgetsByStatusIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			status?: string;
		},
	) {
		if (!data.status) {
			throw new BadRequestException(
				"Informe o status de orçamento",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("budgets")
			.debug(true)
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          sum(budgets.total_value)   as total,
          count(distinct budgets.id) as qtd_Orcamentos
          `,
				),
			)
			.joinRaw(
				`join business_units on budgets.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join reasons on reasons.id = budgets.cancelation_reason_id and reasons.counts_for_report is true`,
				[],
			)
			.groupBy("business_units.id")
			.where("status", data.status)
			.whereNull("budgets.deleted_at")
			.where("business_units.environment", "P");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("budget_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("budget_date::date <= ?", [data.toDate]);
		}

		return qb;
	}

	public async marketingIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const billsQb = Database.from("bills")
			.select(
				Database.raw(
					`
            economic_groups.id            as e_id,
            economic_groups.company_name,
            business_units.id             as b_id,
            business_units.identification,
            to_char(bill_date, 'MM/yyyy') as competence_date,
            sum(total_value)              as total
          `,
				),
			)
			.joinRaw(
				`join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join patients on bills.client_id = patients.id and to_char(bill_date, 'MM/yyyy') = to_char(patients.created_at, 'MM/yyyy')`,
			)
			.joinRaw(`join patient_tutors on patients.id = patient_tutors.patient_id`)
			.joinRaw(
				`join client_origins on patient_tutors.client_origin_id = client_origins.id and client_origins.group = 'Marketing'`,
			)
			.groupByRaw(
				`economic_groups.id, business_units.id, to_char(bill_date, 'MM/yyyy'), business_units.id, economic_groups.id`,
			)
			.whereNull("bills.deleted_at");

		const financesQb = Database.from("finances")
			.select(
				Database.raw(`
        economic_groups.id as e_id,
        economic_groups.company_name,
        business_units.id  as b_id,
        business_units.identification,
        competence_date,
        sum(total_value)   as total
        `),
			)
			.joinRaw(
				`join business_units on finances.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join business_unit_configs on business_unit_configs.business_unit_id = business_units.id
         		and business_unit_configs.marketing_account_plan_id = finances.account_plan_id`,
			)
			.whereNull("finances.deleted_at")
			.where("finances.type", FinanceType.D)
			.whereNot("finances.status", FinanceStatus.E)
			.groupByRaw(`business_units.id, economic_groups.id, competence_date`)
			.orderBy("competence_date", "asc");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			billsQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
			financesQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			billsQb.whereIn("business_units.id", data.units);
			financesQb.whereIn("business_units.id", data.units);
		} else {
			billsQb.where("business_units.id", authCtx.unit.id);
			financesQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			billsQb.whereIn("business_units.economic_group_id", data.groups);
			financesQb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			billsQb.where("business_units.economic_group_id", authCtx.group.id);
			financesQb.where("business_units.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate) {
			billsQb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			financesQb.andWhereRaw(`competence_date = ?`, [
				DateTime.fromFormat(data.fromDate, "yyyy-MM-dd").toFormat("MM/yyyy"),
			]);
		}

		if (data.toDate) {
			billsQb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		// const competences: string[] = [];
		//
		// if (data.fromDate && data.toDate) {
		//   const start = DateTime.fromISO(data.fromDate);
		//   const end = DateTime.fromISO(data.toDate);
		//
		//   const diff = end.diff(start, 'months').toObject().months ?? 0;
		//
		//   for (let i = 0; i <= diff; i++) {
		//     const dt = start.plus({ months: i });
		//     competences.push(dt.toFormat('MM/yyyy'));
		//   }
		// }
		// financesQb.whereIn('competence_date', competences);

		const [billsResult, financesResult] = await Promise.all([
			billsQb,
			financesQb,
		]);

		const keys = new Set<string>();
		for (const bill of billsResult) {
			const key = [bill.e_id, bill.b_id, bill.competence_date].join("__");
			keys.add(key);
		}
		for (const finance of financesResult) {
			const key = [finance.e_id, finance.b_id, finance.competence_date].join(
				"__",
			);
			keys.add(key);
		}

		return Array.from(keys.keys())
			.map((key) => {
				const [e_id, b_id, competence_date] = key.split("__");

				const bill = billsResult.find(
					(bill) =>
						bill.e_id === e_id &&
						bill.b_id === b_id &&
						bill.competence_date === competence_date,
				);
				const finance = financesResult.find(
					(finance) =>
						finance.e_id === e_id &&
						finance.b_id === b_id &&
						finance.competence_date === competence_date,
				);

				const financeTotal = finance?.total ?? 0;
				const billTotal = bill?.total ?? 0;

				return {
					group: {
						id: e_id,
						name:
							[bill, finance].filter(Boolean).at(0)?.company_name ??
							"Não encontrado?",
					},
					unit: {
						id: b_id,
						name:
							[bill, finance].filter(Boolean).at(0)?.identification ??
							"Não encontrado?",
					},
					competenceDate: competence_date,
					totalFinance: financeTotal,
					totalBills: billTotal,
					roi:
						financeTotal === 0 ? 0 : (billTotal - financeTotal) / financeTotal,
				};
			})
			.sort((a, b) => {
				const [aMonth, aYear] = a.competenceDate.split("/");
				const [bMonth, bYear] = b.competenceDate.split("/");

				if (aYear.localeCompare(bYear) === 0) {
					return aMonth.localeCompare(bMonth);
				}

				return aYear.localeCompare(bYear);
			});
	}

	public async costOfAcquisitionIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const billsQb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id              as e_id,
          economic_groups.company_name,
          business_units.id               as b_id,
          business_units.identification,
          to_char(bill_date, 'MM/yyyy')   as competence_date,
          sum(total_value)                as total,
          count(distinct bills.client_id) as unique_clients
          `,
				),
			)
			.joinRaw(
				`left join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join patients on patients.id = bills.client_id and
                               to_char(patients.created_at, 'MM/yyyy') = to_char(bills.bill_date, 'MM/yyyy')`,
			)
			.joinRaw(`join patient_tutors pt on patients.id = pt.patient_id`)
			.joinRaw(
				`join client_origins co on pt.client_origin_id = co.id and co.group = 'Marketing'`,
			)
			.whereNull("bills.deleted_at")
			.groupByRaw(
				`economic_groups.id, business_units.id, to_char(bill_date, 'MM/yyyy'), business_units.id, economic_groups.id`,
			);

		const financesQb = Database.from("finances")
			.select(
				Database.raw(`
      economic_groups.id as e_id,
      economic_groups.company_name,
      business_units.id  as b_id,
      business_units.identification,
      competence_date,
      sum(total_value)   as total
      `),
			)
			.joinRaw(
				`join business_units on finances.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join business_unit_configs on business_unit_configs.business_unit_id = business_units.id and business_unit_configs.marketing_account_plan_id = finances.account_plan_id`,
			)
			.whereNull("finances.deleted_at")
			.where("finances.type", FinanceType.D)
			.whereNot("finances.status", FinanceStatus.E)
			.groupByRaw(`business_units.id, economic_groups.id, competence_date`)
			.orderBy("competence_date");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			billsQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
			financesQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			billsQb.whereIn("business_units.id", data.units);
			financesQb.whereIn("business_units.id", data.units);
		} else {
			billsQb.where("business_units.id", authCtx.unit.id);
			financesQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			billsQb.whereIn("business_units.economic_group_id", data.groups);
			financesQb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			billsQb.where("business_units.economic_group_id", authCtx.group.id);
			financesQb.where("business_units.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate) {
			billsQb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
			financesQb.andWhereRaw(`competence_date = ?`, [
				DateTime.fromFormat(data.fromDate, "yyyy-MM-dd").toFormat("MM/yyyy"),
			]);
		}

		if (data.toDate) {
			billsQb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		// if (data.fromDate && data.toDate) {
		//   const competences: string[] = [];
		//   const start = DateTime.fromISO(data.fromDate);
		//   const end = DateTime.fromISO(data.toDate);
		//
		//   const diff = end.diff(start, 'months').toObject().months ?? 0;
		//
		//   for (let i = 0; i <= diff; i++) {
		//     const dt = start.plus({ months: i });
		//     competences.push(dt.toFormat('MM/yyyy'));
		//   }
		//   financesQb.whereIn('competence_date', competences);
		// }

		const [billsResult, financesResult] = await Promise.all([
			billsQb,
			financesQb,
		]);

		const keys = new Set<string>();
		for (const bill of billsResult) {
			const key = [bill.e_id, bill.b_id, bill.competence_date].join("__");
			keys.add(key);
		}
		for (const finance of financesResult) {
			const key = [finance.e_id, finance.b_id, finance.competence_date].join(
				"__",
			);
			keys.add(key);
		}

		return Array.from(keys.keys())
			.map((key) => {
				const [e_id, b_id, competence_date] = key.split("__");

				const bill = billsResult.find(
					(bill) =>
						bill.e_id === e_id &&
						bill.b_id === b_id &&
						bill.competence_date === competence_date,
				);

				const finance = financesResult.find(
					(finance) =>
						finance.e_id === e_id &&
						finance.b_id === b_id &&
						finance.competence_date === competence_date,
				);

				return {
					group: {
						id: e_id,
						name:
							[bill, finance].filter(Boolean).at(0)?.company_name ??
							"Não encontrado?",
					},
					unit: {
						id: b_id,
						name:
							[bill, finance].filter(Boolean).at(0)?.identification ??
							"Não encontrado?",
					},
					competenceDate: competence_date,
					uniqueClients: parseInt(bill?.unique_clients ?? 0, 10),
					totalBills: bill?.total ?? 0,
					totalFinances: finance?.total ?? 0,
				};
			})
			.sort((a, b) => {
				const [aMonth, aYear] = a.competenceDate.split("/");
				const [bMonth, bYear] = b.competenceDate.split("/");

				if (aYear.localeCompare(bYear) === 0) {
					return aMonth.localeCompare(bMonth);
				}

				return aYear.localeCompare(bYear);
			});
	}

	public async billPaymentFormatIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id              as e_id,
          economic_groups.company_name,
          business_units.id               as b_id,
          business_units.identification,
          to_char(bills.bill_date, 'YYYY/MM') as campo_order,
          to_char(bills.bill_date, 'MM/YYYY') as periodo,
          sum(case
               when ((payment_methods.tef = 'NAO' or
                      (payment_methods.tef <> 'NAO' and payment_methods.type = 'DEBITO')) and
                     (to_char(bills.bill_date, 'YYYY/MM') = to_char(bill_payments.expiration_date, 'YYYY/MM')))
                   then bill_payments.total_value
               else 0 end)                 as a_vista,
          sum(case
               when ((to_char(bills.bill_date, 'YYYY/MM') <> to_char(bill_payments.expiration_date, 'YYYY/MM')) or
                     (payment_methods.tef <> 'NAO' and payment_methods.type = 'CREDITO')) then bill_payments.total_value
               else 0 end)                 as a_prazo
          `,
				),
			)
			.joinRaw(
				`left join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join bill_payments on bills.id = bill_payments.bill_id and bill_payments.deleted_at is null`,
			)
			.joinRaw(
				`join payment_methods on bill_payments.payment_method_id = payment_methods.id`,
			)
			.groupByRaw(
				`economic_groups.id, business_units.id, to_char(bills.bill_date, 'YYYY/MM'), to_char(bills.bill_date, 'MM/YYYY')`,
			)
			.whereNull("bills.deleted_at");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			qb.where("business_units.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.company_name,
				},
				unit: {
					id: elem.b_id,
					name: elem.identification,
				},
				period: elem.periodo,
				cash: elem.a_vista,
				installment: elem.a_prazo,
			};
		});
	}

	public async installmentAvgIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id                                                    as e_id,
          economic_groups.company_name,
          business_units.id                                                     as b_id,
          business_units.identification,
          to_char(bills.bill_date, 'YYYY/MM')                                   as campo_order,
          to_char(bills.bill_date, 'MM/YYYY')                                   as periodo,

          count(bill_payments.installments)                                     as qtd_parcelas,
          count(distinct bills.id)                                              as qtd_vendas,

          count(bill_payments.installments)::decimal / count(distinct bills.id) as prazo_medio
          `,
				),
			)
			.joinRaw(
				`left join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(
				`join bill_payments on bills.id = bill_payments.bill_id and bill_payments.deleted_at is null`,
			)
			.joinRaw(
				`join payment_methods on bill_payments.payment_method_id = payment_methods.id`,
			)
			.groupByRaw(
				`economic_groups.id, business_units.id, to_char(bills.bill_date, 'YYYY/MM'), to_char(bills.bill_date, 'MM/YYYY')`,
			)
			.whereNull("bills.deleted_at")
			.whereRaw(`
                                              (
                                                (to_char(bills.bill_date, 'YYYY/MM') <> to_char(bill_payments.expiration_date, 'YYYY/MM'))
                                                or (payment_methods.tef <> 'NAO' and payment_methods.type = 'CREDITO')
                                              )`);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			qb.where("business_units.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.company_name,
				},
				unit: {
					id: elem.b_id,
					name: elem.identification,
				},
				period: elem.periodo,
				avgInstallment: parseFloat(elem.prazo_medio),
				totalSales: parseInt(elem.qtd_vendas, 10),
				totalInstallments: parseInt(elem.qtd_parcelas, 10),
			};
		});
	}

	public async avgReceiptDeadlineIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
        economic_groups.id                                                         as e_id,
        economic_groups.company_name,
        business_units.id                                                          as b_id,
        business_units.identification,
        to_char(bills.bill_date, 'YYYY/MM')                                        as period,
        sum(finances.original_value) /
        (sum(bill_payments.total_value) /
          avg(extract('DAY' from bill_payments.expiration_date - bills.bill_date))) as avg_delay
        `,
				),
			)
			.joinRaw(
				`left join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join economic_groups on business_units.economic_group_id = economic_groups.id and economic_groups.system_id = ?`,
				[authCtx.system.id],
			)
			.joinRaw(
				`join bill_payments on bills.id = bill_payments.bill_id and bill_payments.deleted_at is null`,
			)
			.joinRaw(
				`left join finances
                   on bill_payments.id = finances.origin_id and finances.deleted_at is null and
                      finances.status = 'ABERTO' and
                      finances.payment_date is null`,
			)
			.joinRaw(
				`join payment_methods on bill_payments.payment_method_id = payment_methods.id`,
			)
			.groupByRaw(
				`economic_groups.id, business_units.id, to_char(bills.bill_date, 'YYYY/MM')`,
			)
			.whereNull("bills.deleted_at")
			.whereRaw(
				`((to_char(bills.bill_date, 'YYYY/MM') <> to_char(bill_payments.expiration_date, 'YYYY/MM'))
    or (payment_methods.tef <> 'NAO' and payment_methods.type = 'CREDITO'))`,
			)
			.orderBy("period");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			qb.where("business_units.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate) {
			qb.andWhereRaw("bill_date::date >= ?", [data.fromDate]);
		}

		if (data.toDate) {
			qb.andWhereRaw("bill_date::date <= ?", [data.toDate]);
		}

		const result = await qb;

		return result.map((elem) => {
			return {
				group: {
					id: elem.e_id,
					name: elem.company_name,
				},
				unit: {
					id: elem.b_id,
					name: elem.identification,
				},
				period: elem.period,
				avgDelay: parseFloat(elem.avg_delay),
			};
		});
	}
}
