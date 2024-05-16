import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import { BillStatus } from "App/Models/Bill";
import { BudgetStatus } from "App/Models/Budget";
import { TBusinessUnitEnvironment } from "App/Models/BusinessUnit";
import { FinanceStatus, FinanceType } from "App/Models/Finance";
import { ProductType } from "App/Models/Product";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { DateTime } from "luxon";
import { v4 } from "uuid";

@inject()
export default class IndicatorService {
	constructor(private shared: SharedService) {}

	static COLORS = [
		"black",
		"silver",
		"gray",
		"white",
		"maroon",
		"red",
		"purple",
		"fuchsia",
		"green",
		"lime",
		"olive",
		"yellow",
		"navy",
		"blue",
		"teal",
		"aqua",
		"orange",
		"aliceblue",
		"cyan",
		"magenta",
	] as const;

	public async medianTicket(
		authCtx: AuthContext,
		data: {
			unit?: string;
			fromDate?: string;
			toDate?: string;
			status?: string;
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

		if (data.status) {
			qb.andWhereRaw("status ~* ?", [data.status]);
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

	public async medianTicketByOrigin_2(
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

		const sum = result.reduce((acc, curr) => acc + curr.total, 0);

		return {
			name: "median-ticket-by-origin",
			type: "pie",
			legend: result.map((elem, idx) => ({
				value: this.shared.formatter.format(elem.total.toFixed(2)),
				name: elem.description,
				percentage: `${((elem.total / sum) * 100).toFixed(2)}%`,
				itemStyle: {
					color: IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
				},
			})),
			configs: {
				title: {
					text: "Faturamento X Origem Clientes",
					subtext: "",
					left: "center",
				},
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ({d}%)",
				},
				legend: {
					bottom: 10,
					orient: "horizontal",
					left: "center",
					show: false,
				},
				series: [
					{
						name: "Origem Clientes",
						type: "pie",
						radius: "80%",
						label: {
							formatter: "{b} : {c} ({d}%)",
							show: false,
						},
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						data: result.map((elem, idx) => ({
							value: parseFloat(elem.total.toFixed(2)),
							name: elem.description,
							percentage: parseFloat(((elem.total / sum) * 100).toFixed(2)),
							itemStyle: {
								color:
									IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
							},
						})),
					},
				],
			},
		};
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

	public async invoicingByProductType_2(
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

		return {
			name: "invoicing-by-product-type",
			type: "pie",
			// legend: false,
			legend: result.map((elem, idx) => ({
				value: this.shared.formatter.format(elem.total_sales),
				percentage: `${((elem.total_sales / parsedTotal) * 100).toFixed(2)}%`,
				name: elem.description,
				itemStyle: {
					color: IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
				},
			})),
			configs: {
				title: {
					text: "Participação de Produtos x Serviços",
					subtext: "",
					left: "center",
				},
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ({d}%)",
				},
				legend: {
					bottom: 10,
					orient: "horizontal",
					left: "center",
				},
				series: [
					{
						name: "Participação",
						type: "pie",
						radius: "50%",
						label: {
							formatter: "{b} : {c} ({d}%)",
						},
						data: result.map((elem, idx) => ({
							value: parseFloat(elem.total_sales.toFixed(2)),
							percentage: parseFloat(
								((elem.total_sales / parsedTotal) * 100).toFixed(2),
							),
							name: elem.description,
							itemStyle: {
								color:
									IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
							},
						})),
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
					},
				],
			},
		};
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
			.orderByRaw("4 desc")
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
			.orderByRaw("totalPayments desc")
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

	public async invoicingByPaymentMethod_2(
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
          sum(bills.total_value)           as totalBills
          `,
				),
			)
			.join("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupBy("business_units.id", "business_units.identification")
			.orderByRaw("totalPayments desc")
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

		return {
			name: "invoicing-by-payment-method",
			type: "pie",
			legend: result.map((elem, idx) => ({
				value: this.shared.formatter.format(elem.totalpayments),
				name: elem.description,
				percentage: `${((elem.totalpayments / total) * 100).toFixed(2)}%`,
				itemStyle: {
					color: IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
				},
			})),
			configs: {
				title: {
					text: "Faturamento X Forma Pagamento",
					subtext: "",
					left: "center",
				},
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ({d}%)",
				},
				legend: {
					bottom: 10,
					orient: "horizontal",
					left: "center",
					show: false,
				},
				series: [
					{
						name: "Forma Pagamento",
						type: "pie",
						radius: "80%",
						label: {
							formatter: "{b} : {c} ({d}%)",
							show: false,
						},
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						data: result.map((elem, idx) => ({
							value: parseFloat(elem.totalpayments.toFixed(2)),
							name: elem.description,
							percentage: parseFloat(
								((elem.totalpayments / total) * 100).toFixed(2),
							),
							itemStyle: {
								color:
									IndicatorService.COLORS[idx % IndicatorService.COLORS.length],
							},
						})),
					},
				],
			},
		};
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

	public async clientGroupTreeIndicators(
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
					`business_units.id,
       business_units.identification,
       'Recorrentes'          as categoria,
       'Recorrentes'          as grupo,
       'Recorrentes'          as description,
       sum(bills.total_value) as total`,
				),
			)
			.joinRaw(`join patients on bills.client_id = patients.id`)
			.joinRaw(
				`inner join business_units on business_units.id = bills.business_unit_id`,
			)
			.groupByRaw(`business_units.id`)
			.whereNull("bills.deleted_at")
			.whereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
			)
			.whereRaw(`business_units.environment = 'P'`);

		const qb2 = Database.from("bills")
			.select(
				Database.raw(
					`business_units.id,
       business_units.identification,
       client_origin_categories.description as categoria,
       client_origin_groups.description     as grupo,
       client_origins.description,
       sum(bills.total_value)               as total`,
				),
			)
			.joinRaw(`join ((patients join patient_tutors on patients.id = patient_tutors.patient_id)
    join client_origins
        left join client_origin_groups
            left join client_origin_categories on client_origin_categories.id =
                                                  client_origin_groups.client_origin_category_id
        on client_origin_groups.id = client_origins.client_origin_group_id
               on patient_tutors.client_origin_id = client_origins.id
    )
              on bills.client_id = patient_tutors.patient_id`)
			.joinRaw(
				`inner join business_units on business_units.id = bills.business_unit_id`,
			)
			.groupByRaw(`business_units.id, client_origin_categories.description, client_origin_groups.description,
         client_origins.description`)
			.whereNull("bills.deleted_at")
			.whereRaw(
				`to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
			)
			.whereRaw(`business_units.environment = 'P'`);

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
		const result = result1.concat(result2) as {
			id: string;
			identification: string;
			categoria: string | null;
			grupo: string | null;
			description: string;
			total: string;
		}[];

		const total = result.reduce((acc, curr) => acc + parseFloat(curr.total), 0);

		const keys = result.reduce((acc, curr) => {
			const innerKey = curr.categoria ?? "-";

			if (!acc.includes(innerKey)) {
				acc.push(innerKey);
			}

			return acc;
		}, [] as string[]);

		const categories = keys.reduce((acc, curr) => {
			const categoryRows =
				curr === "-"
					? result.filter((r) => !r.categoria)
					: result.filter((r) => r.categoria === curr);

			const categorySum = categoryRows.reduce(
				(sumAcc, sumCurr) => sumAcc + parseFloat(sumCurr.total),
				0,
			);

			const categoryGroups = categoryRows.reduce((acc, curr) => {
				const key = curr.grupo ?? "-";

				if (!acc.includes(key)) {
					acc.push(key);
				}

				return acc;
			}, [] as string[]);

			// const groupSum = categoryRows.reduce(
			// 	(acc, curr) => acc + parseFloat(curr.total),
			// 	0,
			// );

			acc.push({
				categoria: curr,
				faturamento: categorySum,
				porcentagem: (categorySum / total) * 100,
				grupos: categoryGroups.map((elem) => {
					const groupTotal =
						elem === "-"
							? -1
							: result
									.filter((r) => r.categoria === curr && r.grupo === elem)
									.reduce((acc, curr) => acc + parseFloat(curr.total), 0);

					return {
						grupo: elem === "-" ? "Não identicado" : elem,
						total: groupTotal,
						porcentagem: (groupTotal / categorySum) * 100,
						origem_clientes: result
							.filter((r) => r.categoria === curr)
							.filter((r) => r.grupo === elem ?? "-")
							.map((ori) => ({
								origem: ori.description,
								total: parseFloat(ori.total),
								porcentagem: (parseFloat(ori.total) / groupTotal) * 100,
							})),
					};
				}),
			});

			return acc;
		}, [] as unknown[]);

		return {
			total,
			categories,
		};
	}

	public async chartsIndicators(
		authCtx: AuthContext,
		data: Record<string, any>,
	) {
		if (authCtx.system.name === "Sanclá") {
			const charts = await Promise.all([
				this.medianTicketByOrigin_2(authCtx, data),
				this.invoicingByPaymentMethod_2(authCtx, data),
				this.invoicingNewClientsPeriod_2(authCtx, data),
				this.billPaymentFormatIndicators_2(authCtx, data),
				this.productTypeIndicators_2(authCtx, data),
				this.schedulingIndicators_2(authCtx, data),
				this.opportunitiesIndicators_2(authCtx, data),
			]);

			const tables = await Promise.all([
				this.subgroupIndicators_2(authCtx, data, "Vendas por Subgrupo"),
				this.salesPerPeriodIndicators_2(authCtx, data, "Vendas por Periodo"),
				this.salesPerUserIndicators_2(authCtx, data),
				this.budgetsIndicators_2(authCtx, { ...data, type: "VENDEDOR" }),
			]);

			const cards = await Promise.all([
				this.billingIndicators(authCtx, data),
				this.medianTicket(authCtx, data),
				this.budgetsByStatusIndicators(authCtx, {
					...data,
					status: BudgetStatus.A,
				}),
				this.budgetsByStatusIndicators(authCtx, {
					...data,
					status: BudgetStatus.N,
				}),
				this.marketingIndicators(authCtx, data),
				this.costOfAcquisitionIndicators(authCtx, data),
			]);

			const medianTicket = cards.at(1) as Awaited<
				ReturnType<typeof this.medianTicket>
			>;
			const openBudgets = cards.at(2) as Awaited<
				ReturnType<typeof this.budgetsByStatusIndicators>
			>;
			const cancelledBudgets = cards.at(3) as Awaited<
				ReturnType<typeof this.budgetsByStatusIndicators>
			>;
			const marketing = cards.at(4) as Awaited<
				ReturnType<typeof this.marketingIndicators>
			>;
			const cac = cards.at(5) as Awaited<
				ReturnType<typeof this.costOfAcquisitionIndicators>
			>;

			return {
				charts,
				tables,
				cards: [
					{
						name: "Faturamento",
						items: [
							{
								description: "Faturamento Realizado",
								value: this.shared.formatter.format(
									cards.at(0)?.reduce((acc, curr) => acc + curr.total, 0),
								),
							},
						],
					},
					{
						name: "Meta",
						items: [
							{
								description: "Meta Faturamento",
								value: this.shared.formatter.format(
									cards
										.at(0)
										?.reduce((acc, curr) => acc + curr.meta.value, 0) ?? 0,
								),
							},
						],
					},
					{
						name: "MetaAtingimento",
						items: [
							{
								description: "Atingimento",
								value: this.shared.formatPercentage(
									cards
										.at(0)
										?.reduce((acc, curr) => acc + curr.percentage, 0) ?? 0,
								),
							},
						],
					},
					{
						name: "MetaTendencia",
						items: [
							{
								description: "Tendencia",
								percentage: this.shared.formatPercentage(
									cards.at(0)?.reduce((acc, curr) => acc + curr.projection, 0),
								),
								value: this.shared.formatter.format(
									cards
										.at(0)
										?.reduce((acc, curr) => acc + curr.metaProjection, 0) ?? 0,
								),
							},
						],
					},
					{
						name: "TicketMedio",
						items: [
							{
								description: "Ticket Medio Pacientes",
								value: this.shared.formatter.format(
									medianTicket
										? medianTicket.salesTotal / medianTicket.qtyClients
										: 0,
								),
							},
						],
					},
					{
						name: "OrçamentosAbertos",
						items: [
							{
								description: "Orçamentos em Aberto",
								value: this.shared.formatter.format(
									openBudgets.reduce((acc, curr) => acc + curr.total, 0),
								),
							},
						],
					},
					{
						name: "OrçamentosCancelados",
						items: [
							{
								description: "Orçamentos Cancelados",
								value: this.shared.formatter.format(
									cancelledBudgets.reduce((acc, curr) => acc + curr.total, 0),
								),
							},
						],
					},
					{
						name: "ROI",
						items: [
							{
								description: "Retorno MKT (ROI)",
								value: this.shared.formatPercentage(
									marketing.reduce((acc, curr) => acc + curr.roi, 0) ?? 0,
								),
							},
						],
					},
					{
						name: "CAC",
						items: [
							{
								description: "Custo Aquisição Cliente",
								value: this.shared.formatter.format(
									cac.length === 0
										? 0
										: cac.reduce((acc, curr) => acc + curr.totalFinances, 0) /
												cac.reduce((acc, curr) => acc + curr.uniqueClients, 0),
								),
							},
						],
					},
				],
			};
		}
		if (authCtx.system.name === "LiftOne") {
			const charts = await Promise.all([
				this.medianTicketByOrigin_2(authCtx, data),
				this.invoicingByPaymentMethod_2(authCtx, data),
				this.invoicingNewClients_2(authCtx, data),
				this.schedulingIndicators_2(authCtx, data),
			]);

			const tables = await Promise.all([
				this.budgetsIndicators_2(authCtx, { ...data, type: "AVALIADOR" }),
				this.budgetsIndicators_2(authCtx, { ...data, type: "VENDEDOR" }),
			]);

			const cards = await Promise.all([
				this.medianTicket(authCtx, data),
				this.billPaymentFormatIndicators(authCtx, data),
				this.installmentAvgIndicators(authCtx, data),
				this.subgroupIndicators(authCtx, data),
				this.subgroupTreeIndicators(authCtx, data),
				this.unconfirmedBudgetsIndicators(authCtx, data),
			]);

			const medianTicket = cards.at(0) as Awaited<
				ReturnType<typeof this.medianTicket>
			>;
			const billPaymentFormat = cards.at(1) as Awaited<
				ReturnType<typeof this.billPaymentFormatIndicators>
			>;
			const installmentAvg = cards.at(2) as Awaited<
				ReturnType<typeof this.installmentAvgIndicators>
			>;
			const subgroup = cards.at(3) as Awaited<
				ReturnType<typeof this.subgroupIndicators>
			>;
			const subgroupTree = cards.at(4) as Awaited<
				ReturnType<typeof this.subgroupTreeIndicators>
			>;
			const unconfirmedBudgets = cards.at(5) as Awaited<
				ReturnType<typeof this.unconfirmedBudgetsIndicators>
			>;

			const billPaymentCashSum = billPaymentFormat.reduce(
				(acc, curr) => acc + parseFloat(curr.cash),
				0,
			);
			const billPaymentInstallmentSum = billPaymentFormat.reduce(
				(acc, curr) => acc + parseFloat(curr.installment),
				0,
			);

			return {
				charts,
				tables,
				cards: [
					{
						name: "FaturamentoAgrupado",
						items: [
							{
								description: "Faturamento Realizado",
								value: this.shared.formatter.format(
									medianTicket?.salesTotal ?? 0,
								),
							},
							{
								description: "Vendas a vista",
								value: `${(
									billPaymentCashSum /
									(billPaymentCashSum + billPaymentInstallmentSum)
								).toFixed(2)}% de Vendas a Vista`,
							},
							{
								description: "Parcelamento Medio",
								value: `${
									installmentAvg.at(0)?.avgInstallment ?? 0
								}x de Parcelamento Médio`,
							},
							{
								description: "Ticket Médio",
								value: `${this.shared.formatter.format(
									(medianTicket?.salesTotal ?? 0) /
										(medianTicket?.qtyClients ?? 1),
								)} (${medianTicket?.qtyClients}) tkt médio clientes`,
							},
						],
					},
					{
						name: "SubgruposDetalhado",
						items: subgroupTree,
					},
					{
						name: "OrigemClientesporCategoria",
						items: subgroup,
					},
					{
						name: "OrçamentosNaoConfirmados",
						items: [
							{
								description: "Orçamentos não confirmados",
								value: `${this.shared.formatter.format(
									parseFloat(unconfirmedBudgets.at(0)?.total ?? "0"),
								)} (${unconfirmedBudgets.at(0)?.unique ?? 0})`,
							},
						],
					},
				],
			};
		}

		const charts = await Promise.all([
			this.medianTicketByOrigin_2(authCtx, data),
			// this.invoicingByProductType_2(authCtx, data),
			this.invoicingByPaymentMethod_2(authCtx, data),
			this.invoicingNewClientsPeriod_2(authCtx, data),
			this.billPaymentFormatIndicators_2(authCtx, data),
			this.productTypeIndicators_2(authCtx, data),
			this.schedulingIndicators_2(authCtx, data),
			this.opportunitiesIndicators_2(authCtx, data),
		]);

		const tables = await Promise.all([
			this.billForUserPeriod_2(authCtx, data),
			this.subgroupIndicators_2(authCtx, data),
			this.salesPerPeriodIndicators_2(authCtx, data),
			this.budgetsIndicators_2(authCtx, data),
		]);

		const cards = await Promise.all([
			this.billingIndicators(authCtx, data),
			this.medianTicket(authCtx, data),
			this.budgetsByStatusIndicators(authCtx, {
				...data,
				status: BudgetStatus.A,
			}),
			this.budgetsByStatusIndicators(authCtx, {
				...data,
				status: BudgetStatus.N,
			}),
			this.marketingIndicators(authCtx, data),
			this.costOfAcquisitionIndicators(authCtx, data),
		]);

		const medianTicket = cards.at(1) as Awaited<
			ReturnType<typeof this.medianTicket>
		>;
		const openBudgets = cards.at(2) as Awaited<
			ReturnType<typeof this.budgetsByStatusIndicators>
		>;
		const cancelledBudgets = cards.at(3) as Awaited<
			ReturnType<typeof this.budgetsByStatusIndicators>
		>;
		const marketing = cards.at(4) as Awaited<
			ReturnType<typeof this.marketingIndicators>
		>;
		const cac = cards.at(5) as Awaited<
			ReturnType<typeof this.costOfAcquisitionIndicators>
		>;

		return {
			charts,
			tables,
			cards: [
				{
					name: "Faturamento",
					items: [
						{
							description: "Faturamento Realizado",
							value: this.shared.formatter.format(
								cards.at(0)?.reduce((acc, curr) => acc + curr.total, 0),
							),
						},
					],
				},
				{
					name: "Meta",
					items: [
						{
							description: "Meta Faturamento",
							value: this.shared.formatter.format(
								cards.at(0)?.reduce((acc, curr) => acc + curr.meta.value, 0) ??
									0,
							),
						},
					],
				},
				{
					name: "MetaAtingimento",
					items: [
						{
							description: "Atingimento",
							value: `${(
								cards.at(0)?.reduce((acc, curr) => acc + curr.percentage, 0) ??
								0
							).toFixed(2)}%`,
						},
					],
				},
				{
					name: "MetaTendencia",
					items: [
						{
							description: "Tendencia",
							percentage: `${(
								cards.at(0)?.reduce((acc, curr) => acc + curr.projection, 0)
							).toFixed(2)}%`,
							value: this.shared.formatter.format(
								cards
									.at(0)
									?.reduce((acc, curr) => acc + curr.metaProjection, 0) ?? 0,
							),
						},
					],
				},
				{
					name: "TicketMedio",
					items: [
						{
							description: "Ticket Medio Pacientes",
							value: this.shared.formatter.format(
								medianTicket
									? medianTicket.salesTotal / medianTicket.qtyClients
									: 0,
							),
						},
					],
				},
				{
					name: "OrçamentosAbertos",
					items: [
						{
							description: "Orçamentos em Aberto",
							value: this.shared.formatter.format(
								openBudgets.reduce((acc, curr) => acc + curr.total, 0),
							),
						},
					],
				},
				{
					name: "OrçamentosCancelados",
					items: [
						{
							description: "Orçamentos Cancelados",
							value: this.shared.formatter.format(
								cancelledBudgets.reduce((acc, curr) => acc + curr.total, 0),
							),
						},
					],
				},
				{
					name: "ROI",
					items: [
						{
							description: "Retorno MKT (ROI)",
							value: `${(
								marketing.reduce((acc, curr) => acc + curr.roi, 0) ?? 0
							).toFixed(2)}%`,
						},
					],
				},
				{
					name: "CAC",
					items: [
						{
							description: "Custo Aquisição Cliente",
							value: this.shared.formatter.format(
								cac.length === 0
									? 0
									: cac.reduce((acc, curr) => acc + curr.totalFinances, 0) /
											cac.reduce((acc, curr) => acc + curr.uniqueClients, 0),
							),
						},
					],
				},
			],
		};
	}

	public async invoicingNewClientsPeriod_2(
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
          to_char(bills.bill_date, 'YYYY-MM') as mes_ano,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end)                 as total_novos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end)                 as total_recorrentes,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end)                 as qtd_novos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end)                 as qtd_recorrentes
          `,
				),
			)
			.leftJoin("patients", (query) => {
				query.on("patients.id", "=", "bills.client_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupByRaw("business_units.id, to_char(bills.bill_date, 'YYYY-MM')")
			.orderByRaw("business_units.id, to_char(bills.bill_date, 'YYYY-MM')")
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw(
				`bill_date::date between (?::date - interval '5 months')::date and ?`,
				[data.fromDate, data.toDate],
			);
		}

		const result = await qb;

		return {
			name: "invoicing-new-clients-period",
			type: "line",
			// legend: true,
			configs: {
				title: {
					text: "Clientes Novos x Recorrentes",
					left: "center",
				},
				tooltip: {
					trigger: "axis",
				},
				legend: {
					data: ["Novos", "Recorrentes"],
					show: true,
					bottom: -5,
				},
				grid: {
					left: "3%",
					right: "4%",
					bottom: "3%",
					containLabel: true,
				},
				toolbox: {
					feature: {
						saveAsImage: {},
					},
				},
				xAxis: {
					type: "category",
					boundaryGap: false,
					data: result.map((r) => r.mes_ano),
				},
				yAxis: {
					type: "value",
				},
				series: [
					{
						name: "Novos",
						type: "line",
						stack: "Total",
						data: result.map((r) => r.total_novos),
					},
					{
						name: "Recorrentes",
						type: "line",
						stack: "Total",
						data: result.map((r) => r.total_recorrentes),
					},
				],
			},
		};
	}

	public async billPaymentFormatIndicators_2(
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
			.orderByRaw(`to_char(bills.bill_date, 'YYYY/MM')`)
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

		const aVistaSum = result.reduce((acc, curr) => acc + curr.a_vista, 0);
		const aPrazoSum = result.reduce((acc, curr) => acc + curr.a_prazo, 0);

		return {
			name: "bill-payment-format",
			type: "bar",
			// legend: true,
			configs: {
				title: {
					text: "Faturamento x Condicao de Pagamento",
					left: "center",
				},
				tooltip: {
					trigger: "axis",
					axisPointer: {
						type: "shadow",
					},
				},
				legend: { show: false },
				grid: {
					left: "3%",
					right: "4%",
					bottom: "80%",
					containLabel: true,
				},
				xAxis: {
					type: "value",
				},
				yAxis: {
					type: "category",
					data: result.map((r) => r.periodo),
				},
				series: [
					{
						name: "A Vista",
						type: "bar",
						stack: "total",
						label: {
							show: true,
						},
						emphasis: {
							focus: "series",
						},
						data: result.map((r) => r.a_vista),
						valor: result.map((r) => (r.a_vista / aVistaSum) * 100),
					},
					{
						name: "A Prazo",
						type: "bar",
						stack: "total",
						label: {
							show: true,
						},
						emphasis: {
							focus: "series",
						},
						data: result.map((r) => r.a_prazo),
						valor: result.map((r) => (r.a_prazo / aPrazoSum) * 100),
					},
				],
			},
		};
	}

	public async billForUserPeriod_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
		description: string = "",
	) {
		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id                       as e_id,
       economic_groups.company_name,
       business_units.id                        as b_id,
       business_units.identification,
       users.id                                 as u_id,
       coalesce(users.name, 'Não identificado') as name,
       count(bills.id)                          as total_bills,
       sum(bills.total_value)                   as total_value,
       avg(bills.total_value)                   as avg_value,
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then 1
               else 0 end)                      as "madrugada_qtd",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 0 and 7 then bills.total_value
               else 0 end)                      as "madrugada_total",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then 1
               else 0 end)                      as "manha_qtd",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 8 and 11 then bills.total_value
               else 0 end)                      as "manha_total",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then 1
               else 0 end)                      as "tarde_qtd",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 12 and 17 then bills.total_value
               else 0 end)                      as "tarde_total",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then 1
               else 0 end)                      as "noite_qtd",
       sum(case
               when cast(to_char(bills.bill_date, 'HH24') as integer) between 18 and 23 then bills.total_value
               else 0 end)                      as "noite_total"
          `,
				),
			)
			.joinRaw(
				`left join business_units on bills.business_unit_id = business_units.id`,
			)
			.joinRaw(
				`left join economic_groups on business_units.economic_group_id = economic_groups.id`,
			)
			.joinRaw(`join users on bills.user_id = users.id`)
			.groupByRaw(`economic_groups.id, business_units.id, users.id`)
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P");

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

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result = await qb;

		const uniqueUnits = result.reduce((acc, curr) => {
			if (!acc.includes(curr.b_id)) {
				acc.push(curr.b_id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "bill-user-period",
			description: description ?? undefined,
			type: "table",
			data: uniqueUnits.map((elem) => {
				return result
					.filter((r) => r.b_id === elem)
					.map((row) => ({
						id: row.id,
						name: row.name,
						total: {
							qtd: row.total_bills,
							total: this.shared.formatter.format(row.total_value),
							avg: this.shared.formatter.format(row.avg_value),
						},
						dawn: {
							qtd: Number.parseInt(row.madrugada_qtd),
							total: this.shared.formatter.format(row.madrugada_total),
							avg:
								row.madrugada_total === 0
									? this.shared.formatter.format(0)
									: this.shared.formatter.format(
											row.madrugada_total / Number.parseInt(row.madrugada_qtd),
										),
						},
						morning: {
							qtd: Number.parseInt(row.manha_qtd),
							total: this.shared.formatter.format(row.manha_total),
							avg:
								row.manha_total === 0
									? this.shared.formatter.format(0)
									: this.shared.formatter.format(
											row.manha_total / Number.parseInt(row.manha_qtd),
										),
						},
						afternoon: {
							qtd: Number.parseInt(row.tarde_qtd),
							total: this.shared.formatter.format(row.tarde_total),
							avg:
								row.tarde_total === 0
									? this.shared.formatter.format(0)
									: this.shared.formatter.format(
											row.tarde_total / Number.parseInt(row.tarde_qtd),
										),
						},
						night: {
							qtd: Number.parseInt(row.noite_qtd),
							total: this.shared.formatter.format(row.noite_total),
							avg:
								row.noite_total === 0
									? this.shared.formatter.format(0)
									: this.shared.formatter.format(
											row.noite_total / Number.parseInt(row.noite_qtd),
										),
						},
					}));
			}),
		};
	}

	public async productTypeIndicators_2(
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

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const metasResult = await qb;
		const productSum = metasResult.reduce(
			(acc, curr) => acc + curr.product_total,
			0,
		);
		const serviceSum = metasResult.reduce(
			(acc, curr) => acc + curr.service_total,
			0,
		);

		return {
			name: "product-type",
			type: "pie",
			legend: [
				{
					value: this.shared.formatter.format(productSum),
					name: "Produtos",
					percentage: this.shared.formatPercentage(
						(productSum / (productSum + serviceSum)) * 100,
					),
					itemStyle: { color: "red" },
				},
				{
					value: this.shared.formatter.format(serviceSum),
					name: "Serviços",
					percentage: this.shared.formatPercentage(
						(serviceSum / (productSum + serviceSum)) * 100,
					),

					itemStyle: { color: "blue" },
				},
			],
			configs: {
				title: {
					text: "Participação de Produtos x Serviços",
					subtext: "",
					left: "center",
				},
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ({d}%)",
				},
				legend: {
					bottom: 10,
					orient: "horizontal",
					left: "center",
					show: false,
				},
				series: [
					{
						name: "Participação",
						type: "pie",
						radius: "80%",
						label: {
							formatter: "{b} : {c} ({d}%)",
							show: false,
						},
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						data: [
							{
								value: parseFloat(productSum.toFixed(2)),
								name: "Produtos",
								percentage: parseFloat(
									((productSum / (productSum + serviceSum)) * 100).toFixed(2),
								),
								itemStyle: { color: "red" },
							},
							{
								value: parseFloat(serviceSum.toFixed(2)),
								name: "Serviços",
								percentage: parseFloat(
									((serviceSum / (productSum + serviceSum)) * 100).toFixed(2),
								),
								itemStyle: { color: "blue" },
							},
						],
					},
				],
			},
		};
	}

	public async subgroupIndicators_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
		description = "",
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

		const uniqueUnits = result.reduce((acc, curr) => {
			if (!acc.includes(curr.id)) {
				acc.push(curr.id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "subgroups",
			description: description ?? undefined,
			type: "table",
			data: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.id === elem);

				return {
					id: unit.id,
					identification: unit.identification,
					subgroups: result
						.filter((r) => r.id === elem)
						.map((elem) => ({
							id: elem.sid,
							description: elem.description,
							count: parseInt(elem.count, 10),
							quantity: parseInt(elem.quantity, 10),
							total: this.shared.formatter.format(elem.total),
							uniqueClients: parseInt(elem.clients, 10),
							percentage: this.shared.formatPercentage(
								(elem.total / parsedTotal) * 100,
							),
						})),
				};
			}),
		};
	}

	public async salesPerPeriodIndicators_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
		description: string = "",
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

		const result = await qb;

		const uniqueUnits = result.reduce((acc, curr) => {
			if (!acc.includes(curr.b_id)) {
				acc.push(curr.b_id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "sales-per-period",
			description: description ?? undefined,
			type: "table",
			data: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.b_id === elem);

				return {
					id: unit.b_id,
					identification: unit.identification,
					period: {
						dawn: {
							total: this.shared.formatter.format(unit.madrugada_total),
							new: this.shared.formatter.format(unit.madrugada_novos),
							recurrent: this.shared.formatter.format(
								unit.madrugada_recorrentes,
							),
						},
						morning: {
							total: this.shared.formatter.format(unit.manha_total),
							new: this.shared.formatter.format(unit.manha_novos),
							recurrent: this.shared.formatter.format(unit.manha_recorrentes),
						},
						afternoon: {
							total: this.shared.formatter.format(unit.tarde_total),
							new: this.shared.formatter.format(unit.tarde_novos),
							recurrent: this.shared.formatter.format(unit.tarde_recorrentes),
						},
						night: {
							total: this.shared.formatter.format(unit.noite_total),
							new: this.shared.formatter.format(unit.noite_novos),
							recurrent: this.shared.formatter.format(unit.noite_recorrentes),
						},
					},
				};
			}),
		};
	}

	public async budgetsIndicators_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
			type?: string;
		},
	) {
		// if (!data.type) {
		// 	throw new BadRequestException(
		// 		"Informe o tipo de orçamento",
		// 		400,
		// 		"E_ERR",
		// 	);
		// }

		if (data.type && !["AVALIADOR", "VENDEDOR"].includes(data.type)) {
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

		if (!data.type || data.type === "VENDEDOR") {
			qb.joinRaw(`left join users on budgets.seller_id = users.id`);
		}

		if (data.type === "AVALIADOR") {
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

		const uniqueGroups = result.reduce((acc, curr) => {
			if (!acc.includes(curr.e_id)) {
				acc.push(curr.e_id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "budgets",
			description: data.type
				? data.type === "AVALIADOR"
					? "Orçamentos por Avaliador"
					: "Orçamentos por Vendedor"
				: "Orçamentos Gerais",
			type: "table",
			data: uniqueGroups.map((elem) => {
				const group = result.find((r) => r.e_id === elem);
				const units = result.filter((r) => r.e_id === elem);
				const uniqueUnits = units.reduce((acc, curr) => {
					if (!acc.includes(curr.b_id)) {
						acc.push(curr.b_id);
					}

					return acc;
				}, [] as string[]) as string[];

				return {
					id: group.e_id,
					name: group.name,
					units: uniqueUnits.map((elem) => {
						const unit = result.find((r) => r.b_id === elem);

						return {
							id: unit.b_id,
							identification: unit.identification,
							users: result
								.filter((r) => r.b_id === elem)
								.map((elem) => ({
									id: elem.u_id,
									name: elem.name,
									totalBudgets: parseInt(elem.total_budgets, 10),
									totalValue: this.shared.formatter.format(elem.total_value),
									avgValue: this.shared.formatter.format(elem.avg_value),
									confirmed: parseInt(elem.confirmed, 10),
									totalConfirmedValue: this.shared.formatter.format(
										elem.total_confirmed_value,
									),
									avgConfirmedValue:
										elem.confirmed === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_confirmed_value /
														parseInt(elem.confirmed, 10),
												),
									cancelled: parseInt(elem.cancelled, 10),
									totalCancelledValue: this.shared.formatter.format(
										elem.total_cancelled_value,
									),
									avgCancelledValue:
										elem.cancelled === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_cancelled_value /
														parseInt(elem.cancelled, 10),
												),
									open: parseInt(elem.open, 10),
									totalOpenValue: this.shared.formatter.format(
										elem.total_open_value,
									),
									avgOpenValue:
										elem.open === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_open_value / parseInt(elem.open, 10),
												),
								})),
						};
					}),
				};
			}),
		};
	}

	public async schedulingIndicators_2(
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

		return {
			name: "scheduling",
			type: "funnel",
			configs:
				generalResult.length === 0
					? []
					: [
							{
								name: "Agendados",
								value: Number.parseInt(generalResult.at(0).agendados, 10),
								normal: { fill: "blue" },
							},
							{
								name: "Atendidos",
								value: Number.parseInt(generalResult.at(0).atendidos, 10),
								normal: { fill: "red" },
							},
							{
								name: "Vendidos",
								value: Number.parseInt(
									salesResult.find((r) => r.id === generalResult.at(0)?.id)
										.sales ?? "0",
								),
								normal: { fill: "orange" },
							},
							{
								name: "Clientes",
								value: Number.parseInt(
									salesResult.find((r) => r.id === generalResult.at(0)?.id)
										.clients ?? "0",
								),
								normal: { fill: "orange" },
							},
						],
			// configs: generalResult.map((elem) => ({
			// 	id: elem.id,
			// 	identification: elem.identification,
			// 	scheduled: parseInt(elem.agendados, 10),
			// 	attended: parseInt(elem.atendidos, 10),
			// 	sales: parseInt(
			// 		salesResult.find((r) => r.id === elem.id)?.sales ?? "0",
			// 	),
			// 	clients: parseInt(
			// 		salesResult.find((r) => r.id === elem.id)?.clients ?? "0",
			// 	),
			// })),
		};
	}

	public async opportunitiesIndicators_2(
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
			.groupBy("business_units.id");
		// .where(".business_unit_id", data.unit);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("opportunity_logs.business_unit_id", data.units);
		} else {
			qb.where("opportunity_logs.business_unit_id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("opportunity_logs.economic_group_id", data.groups);
		} else {
			qb.where("opportunity_logs.economic_group_id", authCtx.group.id);
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

		return {
			name: "opportunities",
			type: "funnel",
			configs: [
				{
					name: "Novas Oportunidades",
					value:
						result.length === 0 ? 0 : Number.parseInt(result.at(0).novas, 10),
					normal: { fill: "blue" },
				},
				{
					name: "Agendadas",
					value:
						result.length === 0
							? 0
							: Number.parseInt(result.at(0).agendadas, 10),
					normal: { fill: "red" },
				},
				{
					name: "Comparecidos",
					value:
						result.length === 0
							? 0
							: Number.parseInt(result.at(0).comparecidas, 10),
					normal: { fill: "orange" },
				},
				{
					name: "Ganho",
					value:
						result.length === 0 ? 0 : Number.parseInt(result.at(0).ganhos, 10),
					normal: { fill: "orange" },
				},
			],
			// configs: result.map((elem) => ({
			// 	id: elem.id,
			// 	identification: elem.identification,
			// 	new: parseInt(elem.novas, 10),
			// 	scheduled: parseInt(elem.agendadas, 10),
			// 	attended: parseInt(elem.comparecidas, 10),
			// 	gained: parseInt(elem.ganhos, 10),
			// })),
		};
	}

	public async salesPerUserIndicators_2(
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
          economic_groups.id as e_id,
          economic_groups.company_name,
          business_units.id as b_id,
          business_units.identification,
          users.id as u_id,
          coalesce(users.name, 'Não identificado') as name,
          count(bills.id) as total_bills,
          sum(bills.total_value) as total_value,
          avg(bills.total_value) as avg_value
          `,
				),
			)
			.leftJoin("economic_groups", (query) => {
				query.on("economic_groups.id", "=", "bills.economic_group_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.join("users", (query) => {
				query.on("users.id", "=", "bills.user_id");
			})
			.groupByRaw("economic_groups.id, business_units.id, users.id")
			.whereNull("bills.deleted_at")
			.where("business_units.environment", "P");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			qb.whereIn("bills.economic_group_id", data.groups);
		} else {
			qb.where("bills.economic_group_id", authCtx.group.id);
		}

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result = await qb;

		const uniqueUnits = result.reduce((acc, curr) => {
			if (!acc.includes(curr.b_id)) {
				acc.push(curr.b_id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "sales-per-user",
			description: "Vendas por Usuário",
			type: "table",
			configs: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.b_id === elem);

				return {
					id: unit.id,
					identification: unit.identification,
					users: result
						.filter((f) => f.b_id === elem)
						.map((usr) => ({
							id: usr.u_id,
							name: usr.name,
							total: this.shared.formatter.format(
								Number.parseFloat(usr.total_value),
							),
							qty: usr.total_bills,
							avg: this.shared.formatter.format(
								Number.parseFloat(usr.avg_value),
							),
						})),
				};
			}),
		};
	}

	public async invoicingNewClients_2(
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
          to_char(bills.bill_date, 'YYYY-MM') as mes_ano,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end)                 as total_novos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then total_value
               else 0 end)                 as total_recorrentes,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end)                 as qtd_novos,
          sum(case
               when to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM') then 1
               else 0 end)                 as qtd_recorrentes
          `,
				),
			)
			.leftJoin("patients", (query) => {
				query.on("patients.id", "=", "bills.client_id");
			})
			.leftJoin("business_units", (query) => {
				query.on("business_units.id", "=", "bills.business_unit_id");
			})
			.groupByRaw("business_units.id, to_char(bills.bill_date, 'YYYY-MM')")
			.orderByRaw("business_units.id, to_char(bills.bill_date, 'YYYY-MM')")
			.whereNull("bills.deleted_at");

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw(
				`bill_date::date between (?::date - interval '5 months')::date and ?`,
				[data.fromDate, data.toDate],
			);
		}

		console.log(qb.toQuery());

		const result = await qb;

		const totalSum = result.reduce(
			(acc, curr) =>
				acc + parseFloat(curr.total_recorrentes) + parseFloat(curr.total_novos),
			0,
		);
		const recurringSum = result.reduce(
			(acc, curr) => acc + parseFloat(curr.total_recorrentes),
			0,
		);
		const newSum = result.reduce(
			(acc, curr) => acc + parseFloat(curr.total_novos),
			0,
		);

		return {
			name: "invoicing-new-clients",
			type: "pie",
			// legend: true,
			legend: [
				{
					name: "Recorrentes",
					value: this.shared.formatter.format(recurringSum),
					percentage: this.shared.formatPercentage(
						(recurringSum / totalSum) * 100,
					),
					itemStyle: {
						color: IndicatorService.COLORS[0 % IndicatorService.COLORS.length],
					},
				},
				{
					name: "Novos",
					value: this.shared.formatter.format(newSum),
					percentage: this.shared.formatPercentage((newSum / totalSum) * 100),
					itemStyle: {
						color: IndicatorService.COLORS[1 % IndicatorService.COLORS.length],
					},
				},
			],
			configs: {
				title: {
					text: "Clientes Novos X Recorrentes",
					subtext: "",
					left: "center",
				},
				tooltip: {
					trigger: "item",
					formatter: "{a} <br/>{b} : {c} ({d}%)",
				},
				legend: {
					bottom: 10,
					orient: "horizontal",
					left: "center",
					show: false,
				},
				series: [
					{
						name: "Clientes",
						type: "pie",
						radius: "80%",
						label: {
							formatter: "{b} : {c} ({d}%)",
							show: false,
						},
						emphasis: {
							itemStyle: {
								shadowBlur: 10,
								shadowOffsetX: 0,
								shadowColor: "rgba(0, 0, 0, 0.5)",
							},
						},
						data: [
							{
								value: recurringSum,
								name: "Recorrentes",
								percentage: parseFloat(
									((recurringSum / totalSum) * 100).toFixed(2),
								),
								itemStyle: {
									color: "black",
								},
							},
							{
								value: newSum,
								name: "Novos",
								percentage: parseFloat(((newSum / totalSum) * 100).toFixed(2)),
								itemStyle: {
									color: "silver",
								},
							},
						],
					},
				],
			},
		};
	}
}
