import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import { BillStatus } from "App/Models/Bill";
import { BudgetStatus } from "App/Models/Budget";
import { TBusinessUnitEnvironment } from "App/Models/BusinessUnit";
import { FinanceStatus, FinanceType } from "App/Models/Finance";
import { ProductType } from "App/Models/Product";
import SharedService, { AuthContext } from "App/Services/SharedService";
import {
	addDays,
	addHours,
	differenceInBusinessDays,
	endOfMonth,
	format,
	startOfMonth,
} from "date-fns";
import { DateTime } from "luxon";
import { v4 } from "uuid";

@inject()
export default class IndicatorService {
	constructor(private shared: SharedService) {}

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
			qtySales: Number.parseInt(result.qtd_vendas, 10),
			qtyClients: Number.parseInt(result.qtd_clientes, 10),
			qtyPatients: Number.parseInt(result.qtd_pacientes, 10),
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
            sum(bills.total_value) as total,
            count(distinct bills.client_id) as qty_clients
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
          sum(bills.total_value) as total,
          count( distinct bills.client_id ) as qty_clients
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
			hasData: result.length > 0,
			title: "Faturamento X Origem Clientes",
			legend: result.map((elem, idx) => [
				{
					title: "Descrição",
					value: elem.description,
					itemStyle: {
						color: authCtx.group.colors[idx % authCtx.group.colors.length],
					},
				},
				{
					title: "Partic %",
					value: this.shared.formatPercentage((elem.total / sum) * 100),
					itemStyle: { color: "" },
				},
				{
					title: "Total R$",
					value: this.shared.formatter.format(elem.total.toFixed(2)),
					itemStyle: { color: "" },
				},
				{
					title: "Qtd Cli",
					value: elem.qty_clients,
					itemStyle: { color: "" },
				},
				{
					title: "Tkt Medio R$",
					value: this.shared.formatter.format(
						elem.total / Number.parseInt(elem.qty_clients),
					),
					itemStyle: { color: "" },
				},
			]),

			configs: {
				title: {
					text: "Faturamento X Origem Clientes",
					subtext: "",
					left: "center",
					show: false,
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
							value: Number.parseFloat(elem.total.toFixed(2)),
							name: elem.description,
							percentage: Number.parseFloat(
								((elem.total / sum) * 100).toFixed(2),
							),
							itemStyle: {
								color: authCtx.group.colors[idx % authCtx.group.colors.length],
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
		const parsedTotal = Number.parseFloat(total_sales);

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
			qtySales: Number.parseInt(elem.qty_sales, 10),
			qtyClients: Number.parseInt(elem.qty_clients, 10),
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
		const parsedTotal = Number.parseFloat(total_sales);

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
			hasData: result.length > 0,
			// legend: false,
			legend: result.map((elem, idx) => ({
				value: this.shared.formatter.format(elem.total_sales),
				percentage: this.shared.formatPercentage(
					(elem.total_sales / parsedTotal) * 100,
				),
				name: elem.description,
				itemStyle: {
					color: authCtx.group.colors[idx % authCtx.group.colors.length],
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
							value: Number.parseFloat(elem.total_sales.toFixed(2)),
							percentage: Number.parseFloat(
								((elem.total_sales / parsedTotal) * 100).toFixed(2),
							),
							name: elem.description,
							itemStyle: {
								color: authCtx.group.colors[idx % authCtx.group.colors.length],
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
			(acc, curr) => acc + Number.parseFloat(curr.total_sales),
			0,
		);

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			productId: elem.pID,
			description: elem.description,
			subgroup: elem.subgroup,
			qtySales: Number.parseInt(elem.qty_sales, 10),
			qtyClients: Number.parseInt(elem.qty_clients, 10),
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
			hasData: result.length > 0,
			title: "Faturamento X Forma Pagamento",
			legend: result.map((elem, idx) => [
				{
					title: "Descrição",
					value: elem.description,
					itemStyle: {
						color: authCtx.group.colors[idx % authCtx.group.colors.length],
					},
				},
				{
					title: "Partic %",
					value: this.shared.formatPercentage(
						(elem.totalpayments / total) * 100,
					),
					itemStyle: { color: "" },
				},
				{
					title: "Total R$",
					value: this.shared.formatter.format(elem.totalpayments),
					itemStyle: { color: "" },
				},
				{
					title: "Qtd Cli",
					value: "",
					itemStyle: { color: "" },
				},
				{
					title: "Tkt Medio R$",
					value: "",
					itemStyle: { color: "" },
				},
			]),
			configs: {
				title: {
					text: "Faturamento X Forma Pagamento",
					subtext: "",
					left: "center",
					show: false,
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
							value: Number.parseFloat(elem.totalpayments.toFixed(2)),
							name: elem.description,
							percentage: Number.parseFloat(
								((elem.totalpayments / total) * 100).toFixed(2),
							),
							itemStyle: {
								color: authCtx.group.colors[idx % authCtx.group.colors.length],
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
				qty: Number.parseInt(elem.qtdnovos, 10),
			},
			recurrent: {
				total: elem.totalrecorrentes,
				qty: Number.parseInt(elem.qtdrecorrentes, 10),
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
			qtySales: Number.parseInt(result.qtd_vendas, 10),
			qtyClients: Number.parseInt(result.qtd_clientes, 10),
			qtyPatients: Number.parseInt(result.qtd_pacientes, 10),
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
		const parsedTotal = Number.parseFloat(total_sales);

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
			qtySales: Number.parseInt(elem.qty_sales, 10),
			qtyClients: Number.parseInt(elem.qty_clients, 10),
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
				qty: Number.parseInt(elem.qtdnovos, 10),
			},
			recurrent: {
				total: elem.totalrecorrentes,
				qty: Number.parseInt(elem.qtdrecorrentes, 10),
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

		const opportunityLogsQb = Database.from("opportunity_logs")
			.select(
				Database.raw(
					"business_units.id, business_units.identification, count(*) as novas_oportunidades",
				),
			)
			.joinRaw(
				"join opportunities on opportunity_logs.opportunity_id = opportunities.id and opportunities.deleted_at is null",
				[],
			)
			.joinRaw(
				"join business_units on opportunity_logs.business_unit_id = business_units.id",
				[],
			)
			.joinRaw(
				"join crm_statuses on opportunity_logs.status_id = crm_statuses.id",
				[],
			)
			.where("business_units.environment", "P")
			.where("crm_statuses.type", "OP")
			.where("crm_statuses.tag", "N")
			.groupBy("business_units.id");

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
			opportunityLogsQb.whereIn("business_units.id", data.units);
		} else {
			qb.where("schedules.business_unit_id", authCtx.unit.id);
			salesQb.where("bills.business_unit_id", authCtx.unit.id);
			opportunityLogsQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("schedules.start_hour::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			salesQb.andWhereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			opportunityLogsQb.andWhereRaw(
				"opportunity_logs.contact_date::date between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		const [salesResult, generalResult, opportunityResult] = await Promise.all([
			salesQb,
			qb,
			opportunityLogsQb,
		]);

		return generalResult.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			opportunities: Number.parseInt(
				opportunityResult.find((r) => elem.id === r.id)?.novas_oportunidades ??
					"0",
			),
			scheduled: Number.parseInt(elem.agendados, 10),
			attended: Number.parseInt(elem.atendidos, 10),
			sales: Number.parseInt(
				salesResult.find((r) => r.id === elem.id)?.sales ?? "0",
			),
			clients: Number.parseInt(
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
		const parsedTotal = Number.parseFloat(total_bill_payments);

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
			count: Number.parseInt(elem.count, 10),
			quantity: Number.parseInt(elem.quantity, 10),
			total: elem.total,
			uniqueClients: Number.parseInt(elem.clients, 10),
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
		const parsedTotal = Number.parseFloat(total_bill_payments);

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
			data.quantity += Number.parseFloat(row.quantity);
			data.total += Number.parseFloat(row.total);

			stats.set(key, data);
		}

		return Array.from(stats.keys()).map((key) => {
			const $total = stats.get(key)?.total ?? 0;

			return {
				id: key,
				description: result.find((r) => r.s_id === key).s_description,
				quantity: stats.get(key)?.quantity,
				total: this.shared.formatter.format($total),
				percentage: this.shared.formatPercentage(($total / parsedTotal) * 100),
				children: result
					.filter((r) => r.s_id === key)
					.map((elem) => ({
						id: elem.id,
						description: elem.description,
						quantity: Number.parseInt(elem.quantity, 10),
						total: this.shared.formatter.format(elem.total),
						percentage: this.shared.formatPercentage(
							(elem.total / $total) * 100,
						),
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
		const parsedTotal = Number.parseFloat(total_bill_payments);

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
			uniqueClients: Number.parseInt(elem.clients, 10),
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
			new: Number.parseInt(elem.novas, 10),
			scheduled: Number.parseInt(elem.agendadas, 10),
			attended: Number.parseInt(elem.comparecidas, 10),
			gained: Number.parseInt(elem.ganhos, 10),
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
			new: Number.parseInt(elem.novas, 10),
			scheduled: Number.parseInt(elem.agendadas, 10),
			attended: Number.parseInt(elem.comparecidas, 10),
			gained: Number.parseInt(elem.ganhos, 10),
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
			unique: Number.parseInt(elem.qtd_orcamentos, 10),
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
		const opportunityQb = Database.from("opportunity_logs")
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
			opportunityQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			opportunityQb.whereIn("business_units.id", data.units);
		} else {
			opportunityQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			opportunityQb.whereIn("opportunities.economic_group_id", data.groups);
		}

		if (data.fromDate && data.toDate) {
			opportunityQb.andWhereRaw(
				"opportunity_logs.contact_date::date between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		const result = await opportunityQb;

		return result.map((elem) => ({
			id: elem.id,
			identification: elem.identification,
			new: Number.parseInt(elem.novas_oportunidades, 10),
			scheduled: Number.parseInt(elem.agendados, 10),
			attended: Number.parseInt(elem.comparecidos, 10),
			gained: Number.parseInt(elem.ganhos, 10),
		}));
	}

	public async crmIndicators_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const opportunityQb = Database.from("opportunity_logs")
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
			opportunityQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			opportunityQb.whereIn("business_units.id", data.units);
		} else {
			opportunityQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			opportunityQb.whereIn("opportunities.economic_group_id", data.groups);
		}

		if (data.fromDate && data.toDate) {
			opportunityQb.andWhereRaw(
				"opportunity_logs.contact_date::date between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		const result = await opportunityQb;

		const _novos = Number.parseInt(
			result.at(0)?.novas_oportunidades ?? "0",
			10,
		);
		const _agendados = Number.parseInt(result.at(0)?.agendados ?? "0", 10);
		const _comparecidos = Number.parseInt(
			result.at(0)?.comparecidos ?? "0",
			10,
		);
		const _ganhos = Number.parseInt(result.at(0)?.ganhos ?? "0", 10);

		return {
			name: "opportunities",
			type: "funnel",
			hasData: result.length > 0,
			title: "Funil Crm",
			configs: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="330" viewBox="0 0 400 330" fill="none">
        <g clip-path="url(#clip0_2003_2250)">
        <path d="M306.709 96.4708L329.519 38.0934C331.043 34.1976 328.161 30 323.97 30H5.91384C1.80112 30 -1.08071 34.071 0.30648 37.9375L21.2217 96.315C22.0716 98.6816 24.3185 100.259 26.8291 100.259H301.16C303.612 100.259 305.82 98.7595 306.709 96.4805V96.4708Z" fill="${authCtx.group.colors.at(
					0,
				)}"/>
        <path d="M27.398 113.928L48.7858 173.591C49.6363 175.957 51.8845 177.535 54.3967 177.535H271.188C273.642 177.535 275.851 176.035 276.74 173.756L300.073 114.093C301.598 110.198 298.715 106 294.521 106H33.0089C28.8838 106 26.0099 110.071 27.398 113.938V113.928Z" fill="${authCtx.group.colors.at(
					1,
				)}"/>
        <path d="M54.8924 190.928L76.3011 250.591C77.1524 252.957 79.4029 254.535 81.9175 254.535H241.152C243.608 254.535 245.82 253.035 246.71 250.756L270.066 191.093C271.592 187.198 268.706 183 264.508 183H60.5087C56.3796 183 53.503 187.071 54.8924 190.938V190.928Z" fill="${authCtx.group.colors.at(
					2,
				)}"/>
        <path d="M82.3968 266.928L103.381 325.305C104.234 327.672 106.488 329.25 109.007 329.25H211.606C214.066 329.25 216.281 327.75 217.173 325.471L240.058 267.093C241.587 263.198 238.696 259 234.491 259H88.0226C83.8865 259 81.005 263.071 82.3968 266.938V266.928Z" fill="${authCtx.group.colors.at(
					3,
				)}"/>


        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="105" y="60.9">Novas Oportunidades</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="78.9">${_novos}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="135" y="137.9">Agendadas</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="155.9">${_agendados}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="125" y="214.9">Comparecidas</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="232.9">${_comparecidos}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="145" y="295">Ganho</text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="310">${_ganhos}</tspan></text>

        </g>
        <path d="M350.187 79.95C349.247 79.3 348.107 79 346.967 79H323.407C322.507 79 321.687 79.53 321.327 80.36L318.487 86.81C317.827 88.31 318.927 90 320.567 90H339.037L329.647 114.1H319.867L321.557 108.35C321.887 107.22 320.687 106.27 319.657 106.84L304.667 115.29C304.027 115.65 303.807 116.48 304.187 117.11L312.637 131C313.227 131.97 314.687 131.78 315.007 130.69L316.647 125.11H333.407C335.677 125.11 337.707 123.72 338.527 121.61L352.217 86.5C353.117 84.19 352.377 81.48 350.197 79.95H350.187Z" fill="#828282"/>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="353" y="109.6">${this.shared.formatPercentage(
					(_agendados / _novos) * 100,
				)}</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="323" y="189.6">${this.shared.formatPercentage(
					(_comparecidos / _agendados) * 100,
				)}</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="293" y="269.6">${this.shared.formatPercentage(
					(_ganhos / _comparecidos) * 100,
				)}</tspan></text>
        <path d="M320.187 158.95C319.247 158.3 318.107 158 316.967 158H293.407C292.507 158 291.687 158.53 291.327 159.36L288.487 165.81C287.827 167.31 288.927 169 290.567 169H309.037L299.647 193.1H289.867L291.557 187.35C291.887 186.22 290.687 185.27 289.657 185.84L274.667 194.29C274.027 194.65 273.807 195.48 274.187 196.11L282.637 210C283.227 210.97 284.687 210.78 285.007 209.69L286.647 204.11H303.407C305.677 204.11 307.707 202.72 308.527 200.61L322.217 165.5C323.117 163.19 322.377 160.48 320.197 158.95H320.187Z" fill="#828282"/>
        <path d="M289.19 237.95C288.25 237.3 287.11 237 285.97 237H262.41C261.51 237 260.69 237.53 260.33 238.36L257.49 244.81C256.83 246.31 257.93 248 259.57 248H278.04L268.65 272.1H258.87L260.56 266.35C260.89 265.22 259.69 264.27 258.66 264.84L243.67 273.29C243.03 273.65 242.81 274.48 243.19 275.11L251.64 289C252.23 289.97 253.69 289.78 254.01 288.69L255.65 283.11H272.41C274.68 283.11 276.71 281.72 277.53 279.61L291.22 244.5C292.12 242.19 291.38 239.48 289.2 237.95H289.19Z" fill="#828282"/>
        <defs>
        <clipPath id="clip0_2003_2250">
        <rect width="330" height="330" fill="white"/>
        </clipPath>
        </defs>
        </svg>`,
		};
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
		const dt = DateTime.fromISO(
			data.fromDate
				? new Date(data.fromDate).toISOString()
				: new Date().toISOString(),
		).plus({ days: 10 });

		const ym = dt.toFormat("yyyyMM");

		const usefulDays = authCtx.unit.unitConfig.crmUsefulDays
			? differenceInBusinessDays(
					endOfMonth(dt.toJSDate()),
					startOfMonth(dt.toJSDate()),
				)
			: dt.daysInMonth ?? 30;

		const usefulDaysUntilNow = differenceInBusinessDays(
			new Date(),
			startOfMonth(dt.toJSDate()),
		);

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          economic_groups.id                                       as e_id,
          economic_groups.company_name                             as e_name,
          business_units.id                                        as b_id,
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
              else sum(bills.total_value) / ? *
                ? end                                           as projection,
          case
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') < ?) then 0
              when (to_char(now(), 'YYYY') || to_char(now(), 'MM') > ?)
                then sum(bills.total_value) / business_unit_metas.value * 100
              else (sum(bills.total_value) / ? * ?) /
                business_unit_metas.value *
                100 end                                         as meta_projection
          `,
					[
						ym,
						ym,
						usefulDaysUntilNow,
						usefulDays,
						ym,
						ym,
						usefulDaysUntilNow,
						usefulDays,
					],
				),
			)
			.joinRaw(
				"join business_units on bills.business_unit_id = business_units.id",
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.joinRaw("join systems on economic_groups.system_id = systems.id")
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

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
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
				totalBudgets: Number.parseInt(elem.total_budgets, 10),
				totalValue: elem.total_value,
				avgValue: elem.avg_value,
				confirmed: Number.parseInt(elem.confirmed, 10),
				totalConfirmedValue: elem.total_confirmed_value,
				avgConfirmedValue:
					elem.confirmed === "0"
						? 0
						: elem.total_confirmed_value / Number.parseInt(elem.confirmed, 10),
				cancelled: Number.parseInt(elem.cancelled, 10),
				totalCancelledValue: elem.total_cancelled_value,
				avgCancelledValue:
					elem.cancelled === "0"
						? 0
						: elem.total_cancelled_value / Number.parseInt(elem.cancelled, 10),
				open: Number.parseInt(elem.open, 10),
				totalOpenValue: elem.total_open_value,
				avgOpenValue:
					elem.open === "0"
						? 0
						: elem.total_open_value / Number.parseInt(elem.open, 10),
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
					uniqueClients: Number.parseInt(bill?.unique_clients ?? 0, 10),
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
				avgInstallment: Number.parseFloat(elem.prazo_medio),
				totalSales: Number.parseInt(elem.qtd_vendas, 10),
				totalInstallments: Number.parseInt(elem.qtd_parcelas, 10),
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
				avgDelay: Number.parseFloat(elem.avg_delay),
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
       coalesce(client_origin_categories.description, 'Outros') as categoria,
       coalesce(client_origin_groups.description, 'Outros')     as grupo,
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

		const total = result.reduce(
			(acc, curr) => acc + Number.parseFloat(curr.total),
			0,
		);

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
				(sumAcc, sumCurr) => sumAcc + Number.parseFloat(sumCurr.total),
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
			// 	(acc, curr) => acc + Number.parseFloat(curr.total),
			// 	0,
			// );

			acc.push({
				categoria: curr,
				faturamento: this.shared.formatter.format(categorySum),
				porcentagem: this.shared.formatPercentage((categorySum / total) * 100),
				grupos: categoryGroups.map((elem) => {
					const groupTotal =
						elem === "-"
							? result
									.filter((r) => !r.categoria && !r.grupo)
									.reduce((acc, curr) => acc + Number.parseFloat(curr.total), 0)
							: result
									.filter((r) => r.categoria === curr && r.grupo === elem)
									.reduce(
										(acc, curr) => acc + Number.parseFloat(curr.total),
										0,
									);

					return {
						grupo: elem === "-" ? "Outros" : elem,
						total: this.shared.formatter.format(groupTotal),
						porcentagem: this.shared.formatPercentage(
							(groupTotal / categorySum) * 100,
						),
						origem_clientes: result
							.filter((r) => r.categoria === curr)
							.filter((r) => r.grupo === elem)
							.map((ori) => ({
								origem: ori.description,
								total: this.shared.formatter.format(
									Number.parseFloat(ori.total),
								),
								porcentagem: this.shared.formatPercentage(
									(Number.parseFloat(ori.total) / groupTotal) * 100,
								),
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

	public async clientOriginTreeIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("opportunities")
			.select(
				Database.raw(
					`
       business_units.id,
       business_units.identification,
       coalesce(client_origin_categories.description, 'Outros') as categoria,
       coalesce(client_origin_groups.description, 'Outros')     as grupo,
       coalesce(client_origins.description, 'Outros')           as origem,
       count(opportunities.id)::int                             as count
          `,
				),
			)
			.joinRaw(
				"left join client_origins on client_origins.id = opportunities.client_origin_id",
			)
			.joinRaw(
				"left join client_origin_groups on client_origins.client_origin_group_id = client_origin_groups.id",
			)
			.joinRaw(
				"left join client_origin_categories on client_origin_categories.id = client_origin_groups.client_origin_category_id",
			)
			.joinRaw(
				"join business_units on opportunities.business_unit_id = business_units.id",
			)
			.groupByRaw(
				"business_units.id, client_origin_categories.description, client_origin_groups.description, client_origins.description",
			)
			.whereNull("opportunities.deleted_at")
			.whereRaw(`business_units.environment = 'P'`);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("opportunities.business_unit_id", data.units);
		} else {
			qb.where("opportunities.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("opportunities.contact_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result: {
			id: string;
			identification: string;
			categoria: string;
			grupo: string;
			origem: string;
			count: number;
		}[] = await qb;

		const totalCount = result.reduce((acc, curr) => acc + curr.count, 0);

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
				(sumAcc, sumCurr) => sumAcc + sumCurr.count,
				0,
			);

			const categoryGroups = categoryRows.reduce((acc, curr) => {
				const key = curr.grupo ?? "-";

				if (!acc.includes(key)) {
					acc.push(key);
				}

				return acc;
			}, [] as string[]);

			acc.push({
				categoria: curr,
				total: categorySum,
				porcentagem: this.shared.formatPercentage(
					(categorySum / totalCount) * 100,
				),
				grupos: categoryGroups.map((elem) => {
					const groupTotal =
						elem === "-"
							? result
									.filter((r) => !r.categoria && !r.grupo)
									.reduce((acc, curr) => acc + curr.count, 0)
							: result
									.filter((r) => r.categoria === curr && r.grupo === elem)
									.reduce((acc, curr) => acc + curr.count, 0);

					return {
						grupo: elem === "-" ? "Outros" : elem,
						total: groupTotal,
						porcentagem: this.shared.formatPercentage(
							(groupTotal / categorySum) * 100,
						),
						origem_clientes: result
							.filter((r) => r.categoria === curr)
							.filter((r) => r.grupo === elem)
							.map((ori) => ({
								origem: ori.origem,
								total: ori.count,
								porcentagem: this.shared.formatPercentage(
									(ori.count / groupTotal) * 100,
								),
							})),
					};
				}),
			});

			return acc;
		}, [] as unknown[]);

		return {
			name: "OrigemClientesOportunidades",
			hasData: result.length > 0,
			items: categories,
		};
	}

	public async sanclaChartsIndicators(
		authCtx: AuthContext,
		data: Record<string, any>,
	) {
		const charts = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND01"),
				() => this.invoicingByPaymentMethod_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND02"),
				() => this.medianTicketByOrigin_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND03"),
				() => this.invoicingNewClientsPeriod_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND05"),
				() => this.productTypeIndicators_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND06"),
				() => this.schedulingIndicators_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND08"),
				() => this.crmIndicators_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND09"),
				() => this.billPaymentFormatIndicators_2(authCtx, data),
			),
		]);

		const tables = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND22"),
				() => this.subgroupIndicators_2(authCtx, data, "Vendas por Subgrupo"),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND23"),
				() =>
					this.salesPerPeriodIndicators_2(authCtx, data, "Vendas por Periodo"),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND24"),
				() => this.salesPerUserIndicators_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND25"),
				() => this.budgetsIndicators_2(authCtx, { ...data, type: "VENDEDOR" }),
			),
		]);

		const cards = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND14"),
				() => this.billingIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND16"),
				() => this.medianTicket(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND18"),
				() =>
					this.budgetsByStatusIndicators(authCtx, {
						...data,
						status: BudgetStatus.A,
					}),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND19"),
				() =>
					this.budgetsByStatusIndicators(authCtx, {
						...data,
						status: BudgetStatus.N,
					}),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND20"),
				() => this.marketingIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND21"),
				() => this.costOfAcquisitionIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND17"),
				() => this.installmentAvgIndicators(authCtx, data),
			),
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
		const installmentAvg = cards.at(6) as Awaited<
			ReturnType<typeof this.installmentAvgIndicators>
		>;

		return {
			charts: charts.filter(Boolean),
			tables: tables.filter(Boolean),
			cards: [
				authCtx.hasPermission("IND14")
					? {
							name: "Faturamento",
							items: [
								{
									description: "Faturamento Realizado",
									value: this.shared.formatter.format(
										cards.at(0)?.reduce((acc, curr) => acc + curr.total, 0),
									),
								},
							],
						}
					: null,
				authCtx.hasPermission("IND15")
					? {
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
						}
					: null,
				authCtx.hasPermission("IND15")
					? {
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
						}
					: null,
				authCtx.hasPermission("IND15")
					? {
							name: "MetaTendencia",
							items: [
								{
									description: "Tendencia",
									percentage: this.shared.formatPercentage(
										cards
											.at(0)
											?.reduce((acc, curr) => acc + curr.metaProjection, 0),
									),
									value: this.shared.formatter.format(
										cards
											.at(0)
											?.reduce((acc, curr) => acc + curr.projection, 0) ?? 0,
									),
								},
							],
						}
					: null,

				authCtx.hasPermission("IND16")
					? {
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
						}
					: null,
				authCtx.hasPermission("IND17")
					? {
							name: "ParcelamentoMedio",
							items: [
								{
									description: "Parcelamento Medio",
									value: `${
										installmentAvg.at(0)?.avgInstallment
											? Math.trunc(installmentAvg.at(0)?.avgInstallment ?? 0)
											: 0
									}x de Parcelamento Médio`,
								},
							],
						}
					: null,
				authCtx.hasPermission("IND18")
					? {
							name: "OrçamentosAbertos",
							items: [
								{
									description: "Orçamentos em Aberto",
									value: this.shared.formatter.format(
										openBudgets.reduce((acc, curr) => acc + curr.total, 0),
									),
								},
							],
						}
					: null,
				authCtx.hasPermission("IND19")
					? {
							name: "OrçamentosCancelados",
							items: [
								{
									description: "Orçamentos Cancelados",
									value: this.shared.formatter.format(
										cancelledBudgets.reduce((acc, curr) => acc + curr.total, 0),
									),
								},
							],
						}
					: null,
				authCtx.hasPermission("IND20")
					? {
							name: "ROI",
							items: [
								{
									description: "Retorno MKT (ROI)",
									value: (
										marketing.reduce((acc, curr) => acc + curr.roi, 0) ?? 0
									).toFixed(2),
								},
							],
						}
					: null,
				authCtx.hasPermission("IND21")
					? {
							name: "CAC",
							items: [
								{
									description: "Custo Aquisição Cliente",
									value: this.shared.formatter.format(
										cac.length === 0
											? 0
											: cac.reduce((acc, curr) => acc + curr.totalFinances, 0) /
													cac.reduce(
														(acc, curr) => acc + curr.uniqueClients,
														0,
													),
									),
								},
							],
						}
					: null,
			].filter(Boolean),
		};
	}

	public async liftOneChartsIndicators(
		authCtx: AuthContext,
		data: Record<string, any>,
	) {
		const charts = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND01"),
				() => this.invoicingByPaymentMethod_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND02"),
				() => this.medianTicketByOrigin_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND04"),
				() => this.invoicingNewClients_2(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND07"),
				() => this.schedulingOpportunitiesIndicators_2(authCtx, data),
			),
		]);

		const tables = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND26"),
				() => this.budgetsIndicators_2(authCtx, { ...data, type: "AVALIADOR" }),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND25"),
				() => this.budgetsIndicators_2(authCtx, { ...data, type: "VENDEDOR" }),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND27"),
				() => this.consolidatedReviewerBudgets(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND28"),
				() => this.salesPerReviewerIndicator_2(authCtx, data),
			),
		]);

		const cards = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND10"),
				() => this.medianTicket(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND10"),
				() => this.billPaymentFormatIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND10"),
				() => this.installmentAvgIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND10"),
				() => this.subgroupIndicators(authCtx, data),
			),

			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND11"),
				() => this.subgroupTreeIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND13"),
				() => this.unconfirmedBudgetsIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("IND12"),
				() => this.clientGroupTreeIndicators(authCtx, data),
			),
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
		const treeIndicators = cards.at(6) as Awaited<
			ReturnType<typeof this.clientGroupTreeIndicators>
		>;
		const subgroupTree = cards.at(4) as Awaited<
			ReturnType<typeof this.subgroupTreeIndicators>
		>;
		const unconfirmedBudgets = cards.at(5) as Awaited<
			ReturnType<typeof this.unconfirmedBudgetsIndicators>
		>;

		const billPaymentCashSum = billPaymentFormat?.reduce(
			(acc, curr) => acc + Number.parseFloat(curr.cash),
			0,
		);
		const billPaymentInstallmentSum = billPaymentFormat?.reduce(
			(acc, curr) => acc + Number.parseFloat(curr.installment),
			0,
		);

		return {
			charts: charts.filter(Boolean),
			tables: tables.filter(Boolean),
			cards: [
				authCtx.hasPermission("IND10")
					? {
							name: "FaturamentoAgrupado",
							faturamento_realizado: {
								description: "Faturamento Realizado",
								value: this.shared.formatter.format(
									medianTicket?.salesTotal ?? 0,
								),
							},
							items: [
								{
									description: "Vendas a vista",
									value: `${this.shared.formatPercentage(
										(billPaymentCashSum /
											(billPaymentCashSum + billPaymentInstallmentSum)) *
											100,
									)} de Vendas a Vista`,
								},
								{
									description: "Parcelamento Medio",
									value: `${
										installmentAvg.at(0)?.avgInstallment
											? Math.trunc(installmentAvg.at(0)?.avgInstallment ?? 0)
											: 0
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
						}
					: null,
				authCtx.hasPermission("IND11")
					? {
							name: "SubgruposDetalhado",
							items: subgroupTree,
						}
					: null,
				authCtx.hasPermission("IND12")
					? {
							name: "OrigemClientesporCategoria",
							items: treeIndicators,
						}
					: null,
				authCtx.hasPermission("IND13")
					? {
							name: "OrçamentosNaoConfirmados",
							items: [
								{
									description: "Orçamentos não confirmados",
									value: `${this.shared.formatter.format(
										Number.parseFloat(unconfirmedBudgets.at(0)?.total ?? "0"),
									)} (${unconfirmedBudgets.at(0)?.unique ?? 0})`,
								},
							],
						}
					: null,
			].filter(Boolean),
		};
	}

	public async chartsIndicators(
		authCtx: AuthContext,
		data: Record<string, any>,
	) {
		const hasPermission = authCtx.hasPermission("PRI05");
		if (!hasPermission) {
			throw new UnauthorizedException(
				"Usuário sem permissão para ver os gráficos",
				400,
				"E_ERR",
			);
		}

		if (authCtx.system.name === "Sanclá") {
			return this.sanclaChartsIndicators(authCtx, data);
		}

		if (authCtx.system.name === "LiftOne") {
			return this.liftOneChartsIndicators(authCtx, data);
		}

		throw new InternalErrorException(
			`Sistema '${authCtx.system.name}' não tem gráficos definidos`,
			400,
			"E_ERR",
		);
	}

	public async crmDashboard(authCtx: AuthContext, data: Record<string, any>) {
		if (!authCtx.hasPermission("CRD00")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para ver os gráficos",
				400,
				"E_ERR",
			);
		}

		const charts = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("CRD01"),
				() => this.monthlyIdealFunnelIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("CRD01"),
				() => this.monthlyPartialFunnelIndicators(authCtx, data),
			),
			SharedService.NoopPromise(
				() => authCtx.hasPermission("CRD01"),
				() => this.monthlyRealizedFunnelIndicators(authCtx, data),
			),
		]);

		const cards = await Promise.all([
			SharedService.NoopPromise(
				() => authCtx.hasPermission("CRD01"),
				// () => true,
				() => this.clientOriginTreeIndicators(authCtx, data),
			),
		]);

		return {
			cards: cards.filter(Boolean),
			charts: charts.filter(Boolean),
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
			hasData: result.length > 0,
			// legend: true,
			title: "Clientes Novos x Recorrentes",
			configs: {
				title: {
					text: "Clientes Novos x Recorrentes",
					left: "center",
					show: false,
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
			hasData: result.length > 0,
			title: "Faturamento x Cond. Pgto",
			legend: [
				[
					{
						title: "Descrição",
						value: "A vista",
						itemStyle: {
							color: authCtx.group.colors.at(0),
						},
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage(
							result
								.map((r) => (r.a_vista / (aVistaSum + aPrazoSum)) * 100)
								.at(0) ?? 0,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(
							result.map((r) => r.a_vista).at(0) ?? 0,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Qtd Cli",
						value: "",
						itemStyle: { color: "" },
					},
					{
						title: "Tkt Medio R$",
						value: "",
						itemStyle: { color: "" },
					},
				],
				[
					{
						title: "Descrição",
						value: "A prazo",
						itemStyle: {
							color: authCtx.group.colors.at(1),
						},
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage(
							result
								.map((r) => (r.a_prazo / (aVistaSum + aPrazoSum)) * 100)
								.at(0) ?? 0,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(
							result.map((r) => r.a_prazo).at(0) ?? 0,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Qtd Cli",
						value: "",
						itemStyle: { color: "" },
					},
					{
						title: "Tkt Medio R$",
						value: "",
						itemStyle: { color: "" },
					},
				],
			],
			configs: {
				title: {
					text: "Faturamento x Cond. Pgto",
					left: "center",
					show: false,
				},
				tooltip: {
					trigger: "axis",
					axisPointer: {
						type: "shadow",
					},
				},
				// legend: { show: false },
				grid: {
					left: "3%",
					right: "4%",
					bottom: "25%",
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
						itemStyle: {
							color: authCtx.group.colors.at(0),
						},
						emphasis: {
							focus: "series",
						},
						data: result.map((r) => r.a_vista),
						valor: result.map(
							(r) => (r.a_vista / (aVistaSum + aPrazoSum)) * 100,
						),
					},
					{
						name: "A Prazo",
						type: "bar",
						stack: "total",
						label: {
							show: true,
						},
						itemStyle: {
							color: authCtx.group.colors.at(1),
						},
						emphasis: {
							focus: "series",
						},
						data: result.map((r) => r.a_prazo),
						valor: result.map(
							(r) => (r.a_prazo / (aVistaSum + aPrazoSum)) * 100,
						),
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
			hasData: result.length > 0,
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
			hasData: metasResult.length > 0,
			title: "Partic. de Produtos x Serviços",
			legend: [
				[
					{
						title: "Descrição",
						value: "Produtos",
						itemStyle: { color: authCtx.group.colors.at(0) },
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage(
							(productSum / (productSum + serviceSum)) * 100,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(productSum),
						itemStyle: { color: "" },
					},
					{ title: "Qtd Cli", value: "", itemStyle: { color: "" } },
					{ title: "Tkt Medio R$", value: "", itemStyle: { color: "" } },
				],
				[
					{
						title: "Descrição",
						value: "Serviços",
						itemStyle: { color: authCtx.group.colors.at(1) },
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage(
							(serviceSum / (productSum + serviceSum)) * 100,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(serviceSum),
						itemStyle: { color: "" },
					},
					{ title: "Qtd Cli", value: "", itemStyle: { color: "" } },
					{ title: "Tkt Medio R$", value: "", itemStyle: { color: "" } },
				],
			],
			configs: {
				title: {
					text: "Partic. de Produtos x Serviços",
					subtext: "",
					left: "center",
					show: false,
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
								value: Number.parseFloat(productSum.toFixed(2)),
								name: "Produtos",
								percentage: Number.parseFloat(
									((productSum / (productSum + serviceSum)) * 100).toFixed(2),
								),
								itemStyle: { color: authCtx.group.colors.at(0) },
							},
							{
								value: Number.parseFloat(serviceSum.toFixed(2)),
								name: "Serviços",
								percentage: Number.parseFloat(
									((serviceSum / (productSum + serviceSum)) * 100).toFixed(2),
								),
								itemStyle: { color: authCtx.group.colors.at(1) },
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
		const parsedTotal = Number.parseFloat(total_bill_payments);

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
			.orderByRaw("total desc, description desc")
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
			hasData: result.length > 0,
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
							count: Number.parseInt(elem.count, 10),
							quantity: Number.parseInt(elem.quantity, 10),
							total: this.shared.formatter.format(elem.total),
							uniqueClients: Number.parseInt(elem.clients, 10),
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
			hasData: result.length > 0,
			data: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.b_id === elem);

				const sum =
					unit.madrugada_total +
					unit.manha_total +
					unit.tarde_total +
					unit.noite_total;

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
							percentage: this.shared.formatPercentage(
								(unit.madrugada_total * 100) / sum,
							),
						},
						morning: {
							total: this.shared.formatter.format(unit.manha_total),
							new: this.shared.formatter.format(unit.manha_novos),
							recurrent: this.shared.formatter.format(unit.manha_recorrentes),
							percentage: this.shared.formatPercentage(
								(unit.manha_total * 100) / sum,
							),
						},
						afternoon: {
							total: this.shared.formatter.format(unit.tarde_total),
							new: this.shared.formatter.format(unit.tarde_novos),
							recurrent: this.shared.formatter.format(unit.tarde_recorrentes),
							percentage: this.shared.formatPercentage(
								(unit.tarde_total * 100) / sum,
							),
						},
						night: {
							total: this.shared.formatter.format(unit.noite_total),
							new: this.shared.formatter.format(unit.noite_novos),
							recurrent: this.shared.formatter.format(unit.noite_recorrentes),
							percentage: this.shared.formatPercentage(
								(unit.noite_total * 100) / sum,
							),
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
			.whereNull("budgets.deleted_at")
			.orderByRaw("total_value desc, name");

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
			hasData: result.length > 0,
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
									totalBudgets: Number.parseInt(elem.total_budgets, 10),
									totalValue: this.shared.formatter.format(elem.total_value),
									avgValue: this.shared.formatter.format(elem.avg_value),
									confirmed: Number.parseInt(elem.confirmed, 10),
									totalConfirmedValue: this.shared.formatter.format(
										elem.total_confirmed_value,
									),
									avgConfirmedValue:
										elem.confirmed === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_confirmed_value /
														Number.parseInt(elem.confirmed, 10),
												),
									cancelled: Number.parseInt(elem.cancelled, 10),
									totalCancelledValue: this.shared.formatter.format(
										elem.total_cancelled_value,
									),
									avgCancelledValue:
										elem.cancelled === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_cancelled_value /
														Number.parseInt(elem.cancelled, 10),
												),
									open: Number.parseInt(elem.open, 10),
									totalOpenValue: this.shared.formatter.format(
										elem.total_open_value,
									),
									avgOpenValue:
										elem.open === "0"
											? this.shared.formatter.format(0)
											: this.shared.formatter.format(
													elem.total_open_value /
														Number.parseInt(elem.open, 10),
												),
								})),
						};
					}),
				};
			}),
		};
	}

	public async consolidatedReviewerBudgets(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb = Database.from("business_units")
			.select(
				Database.raw(
					`
        economic_groups.id                        as e_id,
        economic_groups.company_name,
        business_units.id                         as b_id,
        business_units.identification,
        users.id                                  as u_id,
        coalesce(users.name, 'Não identificado')  as name,
        count(total.id)                           as qtd_total,
        sum(coalesce(total.total_value, 0))       as total_orcamentos,
        count(confirmados.id)                     as qtd_confirmados,
        sum(coalesce(confirmados.total_value, 0)) as total_confirmados,
        sum(coalesce(confirmados.total_value, 0)) / sum(coalesce(total.total_value, 0)) * 100 as conv_venda
          `,
				),
			)
			.joinRaw(
				"join economic_groups on business_units.economic_group_id = economic_groups.id",
			)
			.joinRaw(
				"join budgets as total on total.business_unit_id = business_units.id and total.deleted_at is null",
			)
			.joinRaw(
				"left join bills as confirmados on confirmados.budget_id = total.id and confirmados.business_unit_id = business_units.id and confirmados.deleted_at is null",
			)
			.joinRaw("left join users on users.id = total.reviewer_id")
			.groupBy("economic_groups.id", "business_units.id", "users.id")
			.whereNull("total.deleted_at")
			.orderByRaw("total_confirmados desc, name");

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.whereRaw("total.budget_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result = await qb;

		const uniqueGroups = result.reduce((acc, curr) => {
			if (!acc.includes(curr.e_id)) {
				acc.push(curr.e_id);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "budgetsAvaliadorConsolidado",
			description: "Orçamentos por Período",
			type: "table",
			hasData: result.length > 0,
			data: uniqueGroups.map((elem) => {
				const group = result.find((r) => r.e_id === elem);

				const rows = result.filter((r) => r.e_id === elem);

				const confirmedSum = rows.reduce(
					(acc, curr) => acc + Number.parseFloat(curr.total_confirmados),
					0,
				);
				const budgetedSum = rows.reduce(
					(acc, curr) => acc + Number.parseFloat(curr.total_orcamentos),
					0,
				);

				const uniqueUsers = rows.reduce((acc, curr) => {
					if (!acc.includes(curr.u_id)) {
						acc.push(curr.u_id);
					}

					return acc;
				}, [] as string[]) as string[];

				return {
					id: group.e_id,
					identification: group.identification,
					totalConfirmados: this.shared.formatter.format(confirmedSum),
					totalOrcamentos: this.shared.formatter.format(budgetedSum),
					users: uniqueUsers.map((user) => {
						const userRow = result.find((r) => r.u_id === user);

						return {
							userId: user,
							userName: userRow.name,
							qtdClientes: userRow.qtd_confirmados,
							valorRealizado: this.shared.formatter.format(
								Number.parseFloat(userRow.total_confirmados),
							),
							ticketMedioRealizado: this.shared.formatter.format(
								Number.parseFloat(userRow.total_confirmados) /
									Number.parseFloat(userRow.qtd_confirmados),
							),
							participacaoRealizado: this.shared.formatPercentage(
								(Number.parseFloat(userRow.total_confirmados) / confirmedSum) *
									100,
							),
							conversaoAvaliacoes: this.shared.formatPercentage(
								Number.parseFloat(userRow.conv_venda),
							),
							qtdAvaliacoes: userRow.qtd_total,
							totalAvaliado: this.shared.formatter.format(
								userRow.total_orcamentos,
							),
							ticketMedioAvaliacoes: this.shared.formatter.format(
								userRow.total_orcamentos / userRow.qtd_total,
							),
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

		if (authCtx.system.name === "Sanclá") {
			const _agendados = Number.parseInt(
				generalResult.at(0)?.agendados ?? "0",
				10,
			);
			const _atendidos = Number.parseInt(
				generalResult.at(0)?.atendidos ?? "0",
				10,
			);
			const _vendidos = Number.parseInt(
				salesResult.find((r) => r.id === generalResult.at(0)?.id)?.sales ?? "0",
			);
			const _clientes = Number.parseInt(
				salesResult.find((r) => r.id === generalResult.at(0)?.id)?.clients ??
					"0",
			);

			return {
				name: "scheduling",
				type: "funnel",
				hasData: generalResult.length > 0,
				title: "Resumo Agendamentos",
				configs: `<svg width="400" height="330" viewBox="0 0 400 330" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_485_2392)">
        <path d="M296.878 121.754L329.565 38.0934C331.089 34.1976 328.207 30 324.016 30H5.95974C1.84702 30 -1.03481 34.071 0.352378 37.9375L30.3234 121.598C31.1733 123.965 33.4202 125.543 35.9308 125.543H291.329C293.781 125.543 295.989 124.043 296.878 121.764V121.754Z" fill="${authCtx.group.colors.at(
					0,
				)}" />
        <path d="M36.782 138.928L67.2396 223.874C68.0903 226.241 70.3392 227.819 72.852 227.819H251.794C254.248 227.819 256.458 226.319 257.348 224.04L290.573 139.093C292.098 135.198 289.213 131 285.019 131H42.3944C38.2682 131 35.3936 135.071 36.782 138.938V138.928Z" fill="${authCtx.group.colors.at(
					1,
				)}" />
        <path d="M73.2014 241.928L103.662 326.757C104.514 329.124 106.766 330.702 109.284 330.702H211.81C214.268 330.702 216.482 329.202 217.373 326.923L250.605 242.093C252.133 238.198 249.244 234 245.042 234H78.8331C74.6999 234 71.8204 238.071 73.2112 241.938L73.2014 241.928Z" fill="${authCtx.group.colors.at(
					2,
				)}" />
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="130.6582" y="73.9">Agendadas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="91.9">${_agendados}</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="130.1582" y="174.9">Atendidas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="192.9">${_atendidos}</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="130.9531" y="280.9">Vendidas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="298.9">${_clientes}</tspan>
        </text>

      </g>
      <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em">
        <tspan x="340" y="135.6">${this.shared.formatPercentage(
					(_atendidos / _agendados) * 100,
				)}</tspan>
      </text>
      <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em">
        <tspan x="300" y="240">${this.shared.formatPercentage(
					(_clientes / _atendidos) * 100,
				)}</tspan>
      </text>
      <path d="M339.6 106.95C338.66 106.3 337.52 106 336.38 106H312.82C311.92 106 311.1 106.53 310.74 107.36L307.9 113.81C307.24 115.31 308.34 117 309.98 117H328.45L319.06 141.1H309.28L310.97 135.35C311.3 134.22 310.1 133.27 309.07 133.84L294.08 142.29C293.44 142.65 293.22 143.48 293.6 144.11L302.05 158C302.64 158.97 304.1 158.78 304.42 157.69L306.06 152.11H322.82C325.09 152.11 327.12 150.72 327.94 148.61L341.63 113.5C342.53 111.19 341.79 108.48 339.61 106.95H339.6Z" fill="#828282" />
      <path d="M299.6 211.579C298.66 210.929 297.52 210.629 296.38 210.629H272.82C271.92 210.629 271.1 211.159 270.74 211.989L267.9 218.439C267.24 219.939 268.34 221.629 269.98 221.629H288.45L279.06 245.729H269.28L270.97 239.979C271.3 238.849 270.1 237.899 269.07 238.469L254.08 246.919C253.44 247.279 253.22 248.109 253.6 248.739L262.05 262.629C262.64 263.599 264.1 263.409 264.42 262.319L266.06 256.739H282.82C285.09 256.739 287.12 255.349 287.94 253.239L301.63 218.129C302.53 215.819 301.79 213.109 299.61 211.579H299.6Z" fill="#828282" />
      <defs>
        <clipPath id="clip0_485_2392">
          <rect width="330" height="330" fill="white" />
        </clipPath>
      </defs>
    </svg>`,
			};
		}

		return {
			name: "scheduling",
			type: "funnel",
			hasData: generalResult.length > 0,
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
										?.sales ?? "0",
								),
								normal: { fill: "orange" },
							},
							{
								name: "Clientes",
								value: Number.parseInt(
									salesResult.find((r) => r.id === generalResult.at(0)?.id)
										?.clients ?? "0",
								),
								normal: { fill: "orange" },
							},
						],
		};
	}

	public async schedulingOpportunitiesIndicators_2(
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

		const opportunityLogsQb = Database.from("opportunity_logs")
			.select(
				Database.raw(
					"business_units.id, business_units.identification, count(distinct opportunity_logs.opportunity_id) as novas_oportunidades",
				),
			)
			.joinRaw(
				"join opportunities on opportunity_logs.opportunity_id = opportunities.id and opportunities.deleted_at is null",
				[],
			)
			.joinRaw(
				"join business_units on opportunity_logs.business_unit_id = business_units.id",
				[],
			)
			.joinRaw(
				"join crm_statuses on opportunity_logs.status_id = crm_statuses.id",
				[],
			)
			.where("business_units.environment", "P")
			.where("crm_statuses.type", "OP")
			.where("crm_statuses.tag", "N")
			.groupBy("business_units.id");

		const qb = Database.from("schedules")
			.select(
				Database.raw(
					`
            business_units.id,
            business_units.identification,
            count(distinct schedules.id)          as agendados,
            count(distinct schedules.started_at)  as atendidos
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
			opportunityLogsQb.whereIn("business_units.id", data.units);
		} else {
			qb.where("schedules.business_unit_id", authCtx.unit.id);
			salesQb.where("bills.business_unit_id", authCtx.unit.id);
			opportunityLogsQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("schedules.start_hour::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			salesQb.andWhereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
			opportunityLogsQb.andWhereRaw(
				"opportunity_logs.contact_date::date between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		const [salesResult, generalResult, opportunityResult] = await Promise.all([
			salesQb,
			qb,
			opportunityLogsQb,
		]);

		const _oportunidades = Number.parseInt(
			opportunityResult.find((r) => r.id === generalResult.at(0)?.id)
				?.novas_oportunidades ?? "0",
			10,
		);

		const _agendados = Number.parseInt(
			generalResult.at(0)?.agendados ?? "0",
			10,
		);

		const _atendidos = Number.parseInt(
			generalResult.at(0)?.atendidos ?? "0",
			10,
		);

		const _vendidos = Number.parseInt(
			salesResult.find((r) => r.id === generalResult.at(0)?.id)?.sales ?? "0",
		);

		const _clientes = Number.parseInt(
			salesResult.find((r) => r.id === generalResult.at(0)?.id)?.clients ?? "0",
		);

		return {
			name: "scheduling",
			type: "funnel",
			hasData: generalResult.length > 0,
			title: "Resumo Agendamentos",
			configs: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="330" viewBox="0 0 400 330" fill="none"><g clip-path="url(#clip0_2003_2250)">
        <path d="M306.709 96.4708L329.519 38.0934C331.043 34.1976 328.161 30 323.97 30H5.91384C1.80112 30 -1.08071 34.071 0.30648 37.9375L21.2217 96.315C22.0716 98.6816 24.3185 100.259 26.8291 100.259H301.16C303.612 100.259 305.82 98.7595 306.709 96.4805V96.4708Z" fill="${authCtx.group.colors.at(
					0,
				)}" />
        <path d="M27.398 113.928L48.7858 173.591C49.6363 175.957 51.8845 177.535 54.3967 177.535H271.188C273.642 177.535 275.851 176.035 276.74 173.756L300.073 114.093C301.598 110.198 298.715 106 294.521 106H33.0089C28.8838 106 26.0099 110.071 27.398 113.938V113.928Z" fill="${authCtx.group.colors.at(
					1,
				)}" />
        <path d="M54.8924 190.928L76.3011 250.591C77.1524 252.957 79.4029 254.535 81.9175 254.535H241.152C243.608 254.535 245.82 253.035 246.71 250.756L270.066 191.093C271.592 187.198 268.706 183 264.508 183H60.5087C56.3796 183 53.503 187.071 54.8924 190.938V190.928Z" fill="${authCtx.group.colors.at(
					2,
				)}" />
        <path d="M82.3968 266.928L103.381 325.305C104.234 327.672 106.488 329.25 109.007 329.25H211.606C214.066 329.25 216.281 327.75 217.173 325.471L240.058 267.093C241.587 263.198 238.696 259 234.491 259H88.0226C83.8865 259 81.005 263.071 82.3968 266.938V266.928Z" fill="${authCtx.group.colors.at(
					3,
				)}" />
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="120" y="60.9">Oportunidades</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="78.9">${_oportunidades}</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="135" y="137.9">Agendadas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="155.9">${_agendados}</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="135" y="214.9">Atendidas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="232.9">${_atendidos}</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em">
          <tspan x="135" y="295">Vendidas</tspan>
        </text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em">
          <tspan x="152" y="310">${_clientes}</tspan>
        </text>
      </g>
      <path d="M350.187 79.95C349.247 79.3 348.107 79 346.967 79H323.407C322.507 79 321.687 79.53 321.327 80.36L318.487 86.81C317.827 88.31 318.927 90 320.567 90H339.037L329.647 114.1H319.867L321.557 108.35C321.887 107.22 320.687 106.27 319.657 106.84L304.667 115.29C304.027 115.65 303.807 116.48 304.187 117.11L312.637 131C313.227 131.97 314.687 131.78 315.007 130.69L316.647 125.11H333.407C335.677 125.11 337.707 123.72 338.527 121.61L352.217 86.5C353.117 84.19 352.377 81.48 350.197 79.95H350.187Z" fill="#828282" />
      <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em">
        <tspan x="353" y="109.6">${this.shared.formatPercentage(
					(_agendados / _oportunidades) * 100,
				)}</tspan>
      </text>
      <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em">
        <tspan x="323" y="189.6">${this.shared.formatPercentage(
					(_atendidos / _agendados) * 100,
				)}</tspan>
      </text>
      <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em">
        <tspan x="293" y="269.6">${this.shared.formatPercentage(
					(_clientes / _atendidos) * 100,
				)}</tspan>

      </text>
      <path d="M320.187 158.95C319.247 158.3 318.107 158 316.967 158H293.407C292.507 158 291.687 158.53 291.327 159.36L288.487 165.81C287.827 167.31 288.927 169 290.567 169H309.037L299.647 193.1H289.867L291.557 187.35C291.887 186.22 290.687 185.27 289.657 185.84L274.667 194.29C274.027 194.65 273.807 195.48 274.187 196.11L282.637 210C283.227 210.97 284.687 210.78 285.007 209.69L286.647 204.11H303.407C305.677 204.11 307.707 202.72 308.527 200.61L322.217 165.5C323.117 163.19 322.377 160.48 320.197 158.95H320.187Z" fill="#828282" />
      <path d="M289.19 237.95C288.25 237.3 287.11 237 285.97 237H262.41C261.51 237 260.69 237.53 260.33 238.36L257.49 244.81C256.83 246.31 257.93 248 259.57 248H278.04L268.65 272.1H258.87L260.56 266.35C260.89 265.22 259.69 264.27 258.66 264.84L243.67 273.29C243.03 273.65 242.81 274.48 243.19 275.11L251.64 289C252.23 289.97 253.69 289.78 254.01 288.69L255.65 283.11H272.41C274.68 283.11 276.71 281.72 277.53 279.61L291.22 244.5C292.12 242.19 291.38 239.48 289.2 237.95H289.19Z" fill="#828282" />
      <defs>
        <clipPath id="clip0_2003_2250">
          <rect width="330" height="330" fill="white" />
        </clipPath>
      </defs>
    </svg>`,
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
			hasData: result.length > 0,
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
			.where("business_units.environment", "P")
			.orderByRaw("total_value desc, name desc");

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
			hasData: result.length > 0,
			configs: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.b_id === elem);

				const sum = result
					.filter((f) => f.b_id === elem)
					.reduce((acc, curr) => acc + Number.parseFloat(curr.total_value), 0);

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
							percentage: this.shared.formatPercentage(
								(Number.parseFloat(usr.total_value) * 100) / sum,
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
			qb.whereRaw(`bill_date::date between ? and ?`, [
				data.fromDate,
				data.toDate,
			]);
		}

		const result = await qb;

		const totalSum = result.reduce(
			(acc, curr) =>
				acc +
				Number.parseFloat(curr.total_recorrentes) +
				Number.parseFloat(curr.total_novos),
			0,
		);
		const recurringSum = result.reduce(
			(acc, curr) => acc + Number.parseFloat(curr.total_recorrentes),
			0,
		);
		const newSum = result.reduce(
			(acc, curr) => acc + Number.parseFloat(curr.total_novos),
			0,
		);

		return {
			name: "invoicing-new-clients",
			type: "pie",
			hasData: result.length > 0,
			title: "Clientes Novos X Recorrentes",
			legend: [
				[
					{
						title: "Descrição",
						value: "Recorrentes",
						itemStyle: {
							color: authCtx.group.colors.at(0),
						},
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage(
							(recurringSum / totalSum) * 100,
						),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(recurringSum),
						itemStyle: { color: "" },
					},
					{
						title: "Qtd Cli",
						value: "",
						itemStyle: { color: "" },
					},
					{
						title: "Tkt Medio R$",
						value: "",
						itemStyle: { color: "" },
					},
				],
				[
					{
						title: "Descrição",
						value: "Novos",
						itemStyle: {
							color: authCtx.group.colors.at(1),
						},
					},
					{
						title: "Partic %",
						value: this.shared.formatPercentage((newSum / totalSum) * 100),
						itemStyle: { color: "" },
					},
					{
						title: "Total R$",
						value: this.shared.formatter.format(newSum),
						itemStyle: { color: "" },
					},
					{
						title: "Qtd Cli",
						value: "",
						itemStyle: { color: "" },
					},
					{
						title: "Tkt Medio R$",
						value: "",
						itemStyle: { color: "" },
					},
				],
			],

			configs: {
				title: {
					text: "Clientes Novos X Recorrentes",
					subtext: "",
					left: "center",
					show: false,
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
								percentage: Number.parseFloat(
									((recurringSum / totalSum) * 100).toFixed(2),
								),
								itemStyle: {
									color: authCtx.group.colors.at(0),
								},
							},
							{
								value: newSum,
								name: "Novos",
								percentage: Number.parseFloat(
									((newSum / totalSum) * 100).toFixed(2),
								),
								itemStyle: {
									color: authCtx.group.colors.at(1),
								},
							},
						],
					},
				],
			},
		};
	}

	public async monthlyIdealFunnelIndicators(
		authCtx: AuthContext,
		data: { fromDate?: string; toDate?: string },
	) {
		const {
			faturamento,
			tkt_medio,
			conv_vendas,
			conv_comparecimentos,
			conv_agendamentos,
		} = await this.generateComplexFunnelData(
			authCtx.system.id,
			authCtx.unit.id,
			format(
				data.fromDate ? addDays(new Date(data.fromDate), 10) : new Date(),
				"MM/yyyy",
			),
		);

		const level4 =
			Number.isNaN(faturamento) ||
			!Number.isFinite(faturamento) ||
			Number.isNaN(tkt_medio) ||
			!Number.isFinite(tkt_medio)
				? 0
				: faturamento / tkt_medio;
		const level3 = (level4 * 100) / conv_vendas;
		const level2 = (level3 * 100) / conv_comparecimentos;
		const level1 = (level2 * 100) / conv_agendamentos;

		const arrow_1_2 = conv_agendamentos;
		const arrow_2_3 = conv_comparecimentos;
		const arrow_3_4 = conv_vendas;

		return {
			name: "opportunities",
			type: "funnel",
			hasData: true,
			title: "Funil Ideal Mensal",
			message:
				level4 === 0
					? "Não existe meta definida para o período selecionado"
					: null,
			configs: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="330" viewBox="0 0 400 330" fill="none">
        <g clip-path="url(#clip0_2003_2250)">
        <path d="M306.709 96.4708L329.519 38.0934C331.043 34.1976 328.161 30 323.97 30H5.91384C1.80112 30 -1.08071 34.071 0.30648 37.9375L21.2217 96.315C22.0716 98.6816 24.3185 100.259 26.8291 100.259H301.16C303.612 100.259 305.82 98.7595 306.709 96.4805V96.4708Z" fill="${authCtx.group.colors.at(
					0,
				)}"/>
        <path d="M27.398 113.928L48.7858 173.591C49.6363 175.957 51.8845 177.535 54.3967 177.535H271.188C273.642 177.535 275.851 176.035 276.74 173.756L300.073 114.093C301.598 110.198 298.715 106 294.521 106H33.0089C28.8838 106 26.0099 110.071 27.398 113.938V113.928Z" fill="${authCtx.group.colors.at(
					1,
				)}"/>
        <path d="M54.8924 190.928L76.3011 250.591C77.1524 252.957 79.4029 254.535 81.9175 254.535H241.152C243.608 254.535 245.82 253.035 246.71 250.756L270.066 191.093C271.592 187.198 268.706 183 264.508 183H60.5087C56.3796 183 53.503 187.071 54.8924 190.938V190.928Z" fill="${authCtx.group.colors.at(
					2,
				)}"/>
        <path d="M82.3968 266.928L103.381 325.305C104.234 327.672 106.488 329.25 109.007 329.25H211.606C214.066 329.25 216.281 327.75 217.173 325.471L240.058 267.093C241.587 263.198 238.696 259 234.491 259H88.0226C83.8865 259 81.005 263.071 82.3968 266.938V266.928Z" fill="${authCtx.group.colors.at(
					3,
				)}"/>


        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="105" y="60.9">Novas Oportunidades</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="78.9">${Number.isNaN(level1) || !Number.isFinite(level1) ? 0 : level1.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="135" y="137.9">Agendamentos</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="155.9">${Number.isNaN(level2) || !Number.isFinite(level2) ? 0 : level2.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="125" y="214.9">Comparecimentos</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="232.9">${Number.isNaN(level3) || !Number.isFinite(level3) ? 0 : level3.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="145" y="295">Vendas</text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="310">${Number.isNaN(level4) || !Number.isFinite(level4) ? 0 : level4.toFixed(0)}</tspan></text>

        </g>
        <path d="M350.187 79.95C349.247 79.3 348.107 79 346.967 79H323.407C322.507 79 321.687 79.53 321.327 80.36L318.487 86.81C317.827 88.31 318.927 90 320.567 90H339.037L329.647 114.1H319.867L321.557 108.35C321.887 107.22 320.687 106.27 319.657 106.84L304.667 115.29C304.027 115.65 303.807 116.48 304.187 117.11L312.637 131C313.227 131.97 314.687 131.78 315.007 130.69L316.647 125.11H333.407C335.677 125.11 337.707 123.72 338.527 121.61L352.217 86.5C353.117 84.19 352.377 81.48 350.197 79.95H350.187Z" fill="#828282"/>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="353" y="109.6">${arrow_1_2}%</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="323" y="189.6">${arrow_2_3}%</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="293" y="269.6">${arrow_3_4}%</tspan></text>
        <path d="M320.187 158.95C319.247 158.3 318.107 158 316.967 158H293.407C292.507 158 291.687 158.53 291.327 159.36L288.487 165.81C287.827 167.31 288.927 169 290.567 169H309.037L299.647 193.1H289.867L291.557 187.35C291.887 186.22 290.687 185.27 289.657 185.84L274.667 194.29C274.027 194.65 273.807 195.48 274.187 196.11L282.637 210C283.227 210.97 284.687 210.78 285.007 209.69L286.647 204.11H303.407C305.677 204.11 307.707 202.72 308.527 200.61L322.217 165.5C323.117 163.19 322.377 160.48 320.197 158.95H320.187Z" fill="#828282"/>
        <path d="M289.19 237.95C288.25 237.3 287.11 237 285.97 237H262.41C261.51 237 260.69 237.53 260.33 238.36L257.49 244.81C256.83 246.31 257.93 248 259.57 248H278.04L268.65 272.1H258.87L260.56 266.35C260.89 265.22 259.69 264.27 258.66 264.84L243.67 273.29C243.03 273.65 242.81 274.48 243.19 275.11L251.64 289C252.23 289.97 253.69 289.78 254.01 288.69L255.65 283.11H272.41C274.68 283.11 276.71 281.72 277.53 279.61L291.22 244.5C292.12 242.19 291.38 239.48 289.2 237.95H289.19Z" fill="#828282"/>
        <defs>
        <clipPath id="clip0_2003_2250">
        <rect width="330" height="330" fill="white"/>
        </clipPath>
        </defs>
        </svg>`,
		};
	}

	public async monthlyPartialFunnelIndicators(
		authCtx: AuthContext,
		data: { fromDate?: string; toDate?: string },
	) {
		const today = new Date();
		const firstFromInput = data.fromDate
			? addHours(new Date(data.fromDate), 12)
			: new Date();

		const isSameMonth = today.getMonth() === firstFromInput.getMonth();

		const dt = DateTime.fromISO(
			data.fromDate
				? new Date(data.fromDate).toISOString()
				: new Date().toISOString(),
		).plus({ hours: 12 });

		const usefulDays = authCtx.unit.unitConfig.crmUsefulDays
			? differenceInBusinessDays(
					endOfMonth(dt.toJSDate()),
					startOfMonth(dt.toJSDate()),
				)
			: dt.daysInMonth ?? 30;

		const usefulDaysUntilNow = differenceInBusinessDays(
			new Date(),
			startOfMonth(dt.toJSDate()),
		);

		const {
			faturamento,
			tkt_medio,
			conv_vendas,
			conv_comparecimentos,
			conv_agendamentos,
		} = await this.generateComplexFunnelData(
			authCtx.system.id,
			authCtx.unit.id,
			format(
				data.fromDate ? addDays(new Date(data.fromDate), 10) : new Date(),
				"MM/yyyy",
			),
		);

		const level4 =
			Number.isNaN(faturamento) ||
			!Number.isFinite(faturamento) ||
			Number.isNaN(tkt_medio) ||
			!Number.isFinite(tkt_medio)
				? 0
				: isSameMonth
					? // ? (faturamento / tkt_medio / daysOnMonth) * day // ANTIGO
						(faturamento / tkt_medio) * (usefulDaysUntilNow / usefulDays) // NOVO
					: faturamento / tkt_medio;
		const level3 = (level4 * 100) / conv_vendas;
		const level2 = (level3 * 100) / conv_comparecimentos;
		const level1 = (level2 * 100) / conv_agendamentos;

		const arrow_1_2 = conv_agendamentos;
		const arrow_2_3 = conv_comparecimentos;
		const arrow_3_4 = conv_vendas;

		return {
			name: "opportunities",
			type: "funnel",
			hasData: true,
			title: "Funil Ideal Parcial",
			message:
				Number.isNaN(faturamento) ||
				!Number.isFinite(faturamento) ||
				Number.isNaN(tkt_medio) ||
				!Number.isFinite(tkt_medio)
					? "Não existe meta definida para o período selecionado"
					: null,
			configs: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="330" viewBox="0 0 400 330" fill="none">
        <g clip-path="url(#clip0_2003_2250)">
        <path d="M306.709 96.4708L329.519 38.0934C331.043 34.1976 328.161 30 323.97 30H5.91384C1.80112 30 -1.08071 34.071 0.30648 37.9375L21.2217 96.315C22.0716 98.6816 24.3185 100.259 26.8291 100.259H301.16C303.612 100.259 305.82 98.7595 306.709 96.4805V96.4708Z" fill="${authCtx.group.colors.at(
					0,
				)}"/>
        <path d="M27.398 113.928L48.7858 173.591C49.6363 175.957 51.8845 177.535 54.3967 177.535H271.188C273.642 177.535 275.851 176.035 276.74 173.756L300.073 114.093C301.598 110.198 298.715 106 294.521 106H33.0089C28.8838 106 26.0099 110.071 27.398 113.938V113.928Z" fill="${authCtx.group.colors.at(
					1,
				)}"/>
        <path d="M54.8924 190.928L76.3011 250.591C77.1524 252.957 79.4029 254.535 81.9175 254.535H241.152C243.608 254.535 245.82 253.035 246.71 250.756L270.066 191.093C271.592 187.198 268.706 183 264.508 183H60.5087C56.3796 183 53.503 187.071 54.8924 190.938V190.928Z" fill="${authCtx.group.colors.at(
					2,
				)}"/>
        <path d="M82.3968 266.928L103.381 325.305C104.234 327.672 106.488 329.25 109.007 329.25H211.606C214.066 329.25 216.281 327.75 217.173 325.471L240.058 267.093C241.587 263.198 238.696 259 234.491 259H88.0226C83.8865 259 81.005 263.071 82.3968 266.938V266.928Z" fill="${authCtx.group.colors.at(
					3,
				)}"/>


        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="105" y="60.9">Novas Oportunidades</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="78.9">${Number.isNaN(level1) || !Number.isFinite(level1) ? 0 : level1.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="135" y="137.9">Agendamentos</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="155.9">${Number.isNaN(level2) || !Number.isFinite(level2) ? 0 : level2.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="125" y="214.9">Comparecimentos</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="232.9">${Number.isNaN(level3) || !Number.isFinite(level3) ? 0 : level3.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="145" y="295">Vendas</text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="310">${Number.isNaN(level4) || !Number.isFinite(level4) ? 0 : level4.toFixed(0)}</tspan></text>

        </g>
        <path d="M350.187 79.95C349.247 79.3 348.107 79 346.967 79H323.407C322.507 79 321.687 79.53 321.327 80.36L318.487 86.81C317.827 88.31 318.927 90 320.567 90H339.037L329.647 114.1H319.867L321.557 108.35C321.887 107.22 320.687 106.27 319.657 106.84L304.667 115.29C304.027 115.65 303.807 116.48 304.187 117.11L312.637 131C313.227 131.97 314.687 131.78 315.007 130.69L316.647 125.11H333.407C335.677 125.11 337.707 123.72 338.527 121.61L352.217 86.5C353.117 84.19 352.377 81.48 350.197 79.95H350.187Z" fill="#828282"/>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="353" y="109.6">${arrow_1_2}%</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="323" y="189.6">${arrow_2_3}%</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="293" y="269.6">${arrow_3_4}%</tspan></text>
        <path d="M320.187 158.95C319.247 158.3 318.107 158 316.967 158H293.407C292.507 158 291.687 158.53 291.327 159.36L288.487 165.81C287.827 167.31 288.927 169 290.567 169H309.037L299.647 193.1H289.867L291.557 187.35C291.887 186.22 290.687 185.27 289.657 185.84L274.667 194.29C274.027 194.65 273.807 195.48 274.187 196.11L282.637 210C283.227 210.97 284.687 210.78 285.007 209.69L286.647 204.11H303.407C305.677 204.11 307.707 202.72 308.527 200.61L322.217 165.5C323.117 163.19 322.377 160.48 320.197 158.95H320.187Z" fill="#828282"/>
        <path d="M289.19 237.95C288.25 237.3 287.11 237 285.97 237H262.41C261.51 237 260.69 237.53 260.33 238.36L257.49 244.81C256.83 246.31 257.93 248 259.57 248H278.04L268.65 272.1H258.87L260.56 266.35C260.89 265.22 259.69 264.27 258.66 264.84L243.67 273.29C243.03 273.65 242.81 274.48 243.19 275.11L251.64 289C252.23 289.97 253.69 289.78 254.01 288.69L255.65 283.11H272.41C274.68 283.11 276.71 281.72 277.53 279.61L291.22 244.5C292.12 242.19 291.38 239.48 289.2 237.95H289.19Z" fill="#828282"/>
        <defs>
        <clipPath id="clip0_2003_2250">
        <rect width="330" height="330" fill="white"/>
        </clipPath>
        </defs>
        </svg>`,
		};
	}

	public async monthlyRealizedFunnelIndicators(
		authCtx: AuthContext,
		data: {
			units?: string[];
			groups?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const opportunityQb = Database.from("opportunity_logs")
			.select(
				Database.raw(
					`
          business_units.id,
          business_units.identification,
          count(distinct opportunity_logs.opportunity_id) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'N' )  as novas_oportunidades,
          count(distinct opportunity_logs.opportunity_id) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'A' )  as agendados,
          count(distinct opportunity_logs.opportunity_id) FILTER ( WHERE crm_statuses.type = 'OP' and crm_statuses.tag = 'C' )  as comparecidos,
          count(distinct opportunity_logs.opportunity_id) FILTER ( WHERE crm_statuses.type = 'OPR' and crm_statuses.tag = 'G' ) as ganhos
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
			opportunityQb.where(
				"business_units.environment",
				"P" as TBusinessUnitEnvironment,
			);
		}

		if (data.units && Array.isArray(data.units)) {
			opportunityQb.whereIn("business_units.id", data.units);
		} else {
			opportunityQb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups)) {
			opportunityQb.whereIn("opportunities.economic_group_id", data.groups);
		}

		if (data.fromDate && data.toDate) {
			opportunityQb.andWhereRaw(
				"opportunity_logs.contact_date::date between ? and ?",
				[data.fromDate, data.toDate],
			);
		}

		const result = await opportunityQb;

		const _novos = Number.parseInt(
			result.at(0)?.novas_oportunidades ?? "0",
			10,
		);
		const _agendados = Number.parseInt(result.at(0)?.agendados ?? "0", 10);
		const _comparecidos = Number.parseInt(
			result.at(0)?.comparecidos ?? "0",
			10,
		);
		const _ganhos = Number.parseInt(result.at(0)?.ganhos ?? "0", 10);

		return {
			name: "opportunities",
			type: "funnel",
			hasData: result.length > 0,
			title: "Funil Crm Realizado",
			configs: `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="330" viewBox="0 0 400 330" fill="none">
        <g clip-path="url(#clip0_2003_2250)">
        <path d="M306.709 96.4708L329.519 38.0934C331.043 34.1976 328.161 30 323.97 30H5.91384C1.80112 30 -1.08071 34.071 0.30648 37.9375L21.2217 96.315C22.0716 98.6816 24.3185 100.259 26.8291 100.259H301.16C303.612 100.259 305.82 98.7595 306.709 96.4805V96.4708Z" fill="${authCtx.group.colors.at(
					0,
				)}"/>
        <path d="M27.398 113.928L48.7858 173.591C49.6363 175.957 51.8845 177.535 54.3967 177.535H271.188C273.642 177.535 275.851 176.035 276.74 173.756L300.073 114.093C301.598 110.198 298.715 106 294.521 106H33.0089C28.8838 106 26.0099 110.071 27.398 113.938V113.928Z" fill="${authCtx.group.colors.at(
					1,
				)}"/>
        <path d="M54.8924 190.928L76.3011 250.591C77.1524 252.957 79.4029 254.535 81.9175 254.535H241.152C243.608 254.535 245.82 253.035 246.71 250.756L270.066 191.093C271.592 187.198 268.706 183 264.508 183H60.5087C56.3796 183 53.503 187.071 54.8924 190.938V190.928Z" fill="${authCtx.group.colors.at(
					2,
				)}"/>
        <path d="M82.3968 266.928L103.381 325.305C104.234 327.672 106.488 329.25 109.007 329.25H211.606C214.066 329.25 216.281 327.75 217.173 325.471L240.058 267.093C241.587 263.198 238.696 259 234.491 259H88.0226C83.8865 259 81.005 263.071 82.3968 266.938V266.928Z" fill="${authCtx.group.colors.at(
					3,
				)}"/>


        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="105" y="60.9">Novas Oportunidades</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="78.9">${_novos.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="135" y="137.9">Agendadas</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="155.9">${_agendados.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="125" y="214.9">Comparecidas</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="232.9">${_comparecidos.toFixed(0)}</tspan></text>

        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" font-weight="bold" letter-spacing="0em"><tspan x="145" y="295">Vendas</text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="14" letter-spacing="0em"><tspan x="152" y="310">${_ganhos.toFixed(0)}</tspan></text>

        </g>
        <path d="M350.187 79.95C349.247 79.3 348.107 79 346.967 79H323.407C322.507 79 321.687 79.53 321.327 80.36L318.487 86.81C317.827 88.31 318.927 90 320.567 90H339.037L329.647 114.1H319.867L321.557 108.35C321.887 107.22 320.687 106.27 319.657 106.84L304.667 115.29C304.027 115.65 303.807 116.48 304.187 117.11L312.637 131C313.227 131.97 314.687 131.78 315.007 130.69L316.647 125.11H333.407C335.677 125.11 337.707 123.72 338.527 121.61L352.217 86.5C353.117 84.19 352.377 81.48 350.197 79.95H350.187Z" fill="#828282"/>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="353" y="109.6">${this.shared.formatPercentage(
					(_agendados / _novos) * 100,
				)}</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="323" y="189.6">${this.shared.formatPercentage(
					(_comparecidos / _agendados) * 100,
				)}</tspan></text>
        <text fill="#2B2B2B" xml:space="preserve" style="white-space: pre" font-family="Poppins" font-size="16" font-weight="bold" letter-spacing="0em"><tspan x="293" y="269.6">${this.shared.formatPercentage(
					(_ganhos / _comparecidos) * 100,
				)}</tspan></text>
        <path d="M320.187 158.95C319.247 158.3 318.107 158 316.967 158H293.407C292.507 158 291.687 158.53 291.327 159.36L288.487 165.81C287.827 167.31 288.927 169 290.567 169H309.037L299.647 193.1H289.867L291.557 187.35C291.887 186.22 290.687 185.27 289.657 185.84L274.667 194.29C274.027 194.65 273.807 195.48 274.187 196.11L282.637 210C283.227 210.97 284.687 210.78 285.007 209.69L286.647 204.11H303.407C305.677 204.11 307.707 202.72 308.527 200.61L322.217 165.5C323.117 163.19 322.377 160.48 320.197 158.95H320.187Z" fill="#828282"/>
        <path d="M289.19 237.95C288.25 237.3 287.11 237 285.97 237H262.41C261.51 237 260.69 237.53 260.33 238.36L257.49 244.81C256.83 246.31 257.93 248 259.57 248H278.04L268.65 272.1H258.87L260.56 266.35C260.89 265.22 259.69 264.27 258.66 264.84L243.67 273.29C243.03 273.65 242.81 274.48 243.19 275.11L251.64 289C252.23 289.97 253.69 289.78 254.01 288.69L255.65 283.11H272.41C274.68 283.11 276.71 281.72 277.53 279.61L291.22 244.5C292.12 242.19 291.38 239.48 289.2 237.95H289.19Z" fill="#828282"/>
        <defs>
        <clipPath id="clip0_2003_2250">
        <rect width="330" height="330" fill="white"/>
        </clipPath>
        </defs>
        </svg>`,
		};
	}

	private async generateComplexFunnelData(
		systemID: number,
		unitID: string,
		period: string,
	) {
		const [[sql1], [sql2], [sql3], [sql4], [sql5]] = await Promise.all([
			// Faturamento
			Database.from("metas")
				.select(Database.raw("business_unit_metas.value::float as faturamento"))
				.joinRaw(
					"join business_unit_metas on metas.id = business_unit_metas.meta_id",
				)
				.where("metas.system_id", systemID)
				.where("metas.description", "Faturamento")
				.where("business_unit_metas.business_unit_id", unitID)
				.where("business_unit_metas.period", period),

			// Ticket Medio
			Database.from("metas")
				.select(Database.raw("business_unit_metas.value::float as tkt_medio"))
				.joinRaw(
					"join business_unit_metas on metas.id = business_unit_metas.meta_id",
				)
				.where("metas.system_id", systemID)
				.where("metas.description", "Ticket Medio")
				.where("business_unit_metas.business_unit_id", unitID)
				.where("business_unit_metas.period", period),

			// Conversao Vendas Crm
			Database.from("metas")
				.select(Database.raw("business_unit_metas.value::float as conv_vendas"))
				.joinRaw(
					"join business_unit_metas on metas.id = business_unit_metas.meta_id",
				)
				.where("metas.system_id", systemID)
				.whereRaw("metas.description ilike ?", ["% Vendas Crm"])
				.where("business_unit_metas.business_unit_id", unitID)
				.where("business_unit_metas.period", period),

			// Conversão Crm
			Database.from("metas")
				.select(
					Database.raw(
						"business_unit_metas.value::float as conv_comparecimentos",
					),
				)
				.joinRaw(
					"join business_unit_metas on metas.id = business_unit_metas.meta_id",
				)
				.where("metas.system_id", systemID)
				.whereRaw("metas.description ilike ?", ["% Comparecimentos Crm"])
				.where("business_unit_metas.business_unit_id", unitID)
				.where("business_unit_metas.period", period),

			// Conversao Agendamentos Crm
			Database.from("metas")
				.select(
					Database.raw("business_unit_metas.value::float as conv_agendamentos"),
				)
				.joinRaw(
					"join business_unit_metas on metas.id = business_unit_metas.meta_id",
				)
				.where("metas.system_id", systemID)
				.whereRaw("metas.description ilike ?", ["% Agendamentos Crm"])
				.where("business_unit_metas.business_unit_id", unitID)
				.where("business_unit_metas.period", period),
		]);

		const faturamento = sql1?.faturamento ?? 0;
		const tkt_medio = sql2?.tkt_medio ?? 0;
		const conv_vendas = sql3?.conv_vendas ?? 0;
		const conv_comparecimentos = sql4?.conv_comparecimentos ?? 0;
		const conv_agendamentos = sql5?.conv_agendamentos ?? 0;

		return {
			faturamento,
			tkt_medio,
			conv_vendas,
			conv_comparecimentos,
			conv_agendamentos,
		};
	}

	public async activityIndicators_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		const qb1 = Database.from("opportunities")
			.select(
				Database.raw(
					`
        count(opportunity_activities.id)                                                  as criadas_total,
        sum(case when opportunity_activities.executed_date is not null then 1 else 0 end) as executadas_total,
        sum(case
               when opportunity_activities.executed_date is null and opportunity_activities.execution_date > now()
                   then 1
               else 0 end)                                                               as agendadas_total,
        sum(case
               when opportunity_activities.executed_date is null and opportunity_activities.execution_date <= now()
                   then 1
               else 0 end)                                                               as vencidas_total
          `,
				),
			)
			.joinRaw(`join opportunity_activities
              on opportunities.id = opportunity_activities.opportunity_id and opportunities.deleted_at is null and
                 opportunity_activities.deleted_at is null`);

		const qb2 = Database.from("opportunities")
			.select(
				Database.raw(
					`
        activities.description,
        count(opportunity_activities.id)                                                  as criadas,
        sum(case when opportunity_activities.executed_date is not null then 1 else 0 end) as executadas,
        sum(case
               when opportunity_activities.executed_date is null and opportunity_activities.execution_date > now()
                   then 1
               else 0 end)                                                               as agendadas,
        sum(case
               when opportunity_activities.executed_date is null and opportunity_activities.execution_date <= now()
                   then 1
               else 0 end)                                                               as vencidas
          `,
				),
			)
			.joinRaw(`join opportunity_activities
              on opportunities.id = opportunity_activities.opportunity_id and opportunities.deleted_at is null and
                 opportunity_activities.deleted_at is null`)
			.joinRaw(
				"join activities on opportunity_activities.activity_id = activities.id",
			)
			.groupByRaw("activities.description")
			.orderByRaw("criadas desc");

		if (data.units && Array.isArray(data.units)) {
			qb1.whereIn("opportunities.business_unit_id", data.units);
			qb2.whereIn("opportunities.business_unit_id", data.units);
		} else {
			qb1.where("opportunities.business_unit_id", authCtx.unit.id);
			qb2.where("opportunities.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb1.whereRaw("opportunity_activities.issue_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);

			qb1.whereRaw("opportunity_activities.issue_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const [result1, result2] = await Promise.all([qb1, qb2]);

		return {
			name: "activities",
			description: "Atividades",
			type: "table",
			hasData: true,
			data: [
				{
					type: "total",
					items: {
						name: "total",
						atividadesTotal: result1.at(0).criadas_totais ?? "0",
						atividadesExecutadas: result1.at(0).executadas_totais ?? "0",
						atividadesAgendadas: result1.at(0).agendadas_totais ?? "0",
						atividadesVencidas: result1.at(0).vencidas_totais ?? "0",
					},
				},
				{
					type: "atividade",
					items: result2.map((e) => ({
						name: e.description,
						atividadesTotal: e.criadas,
						atividadesExecutadas: e.executadas,
						atividadesAgendadas: e.agendadas,
						atividadesVencidas: e.vencidas,
					})),
				},
			],
		};
	}

	public async salesPerReviewerIndicator_2(
		authCtx: AuthContext,
		data: {
			units?: string[];
			fromDate?: string;
			toDate?: string;
		},
	) {
		if (!authCtx.hasPermission("IND28")) {
			throw new UnauthorizedException(
				"Usuário sem permissão para ver o gráfico",
				400,
				"E_ERR",
			);
		}

		const qb = Database.from("bills")
			.select(
				Database.raw(
					`
          business_units.id                                         as id_unidade_negocios,
        coalesce(business_units.identification, 'Não informado')  as identificacao_unidade,
       avaliador.id                                              as id_avaliador,
       case
           when bills.budget_id is null then 'Venda Direta (' || vendedor.name || ')'
           else coalesce(avaliador.name, 'Não Identificado') end as nome_avaliador,
       count(distinct bills.client_id)::int                      as qtd_clientes,
       sum(bills.total_value)::float                             as total_realizado,
       (sum(bills.total_value) /
        coalesce(count(distinct bills.client_id), 1))::float     as tkt_medio_realizado,
       count(budgets.id)::int                                    as qtd_avaliacoes,
       coalesce(sum(budgets.total_value), 0)::float              as total_avaliacoes,
       (sum(coalesce(budgets.total_value, 0)) /
        case
            when coalesce(count(budgets.id), 1) = 0 then 1
            else coalesce(count(budgets.id), 1) end)::float      as tkt_medio_avaliacoes
          `,
				),
			)
			.joinRaw(`left join (budgets left join users avaliador on budgets.reviewer_id = avaliador.id)
                   on bills.budget_id = budgets.id and budgets.deleted_at is null`)
			.joinRaw("join users vendedor on bills.seller_id = vendedor.id")
			.joinRaw(
				"join business_units on bills.business_unit_id = business_units.id",
			)
			.groupByRaw(`business_units.id, business_units.identification, avaliador.id,
         case
             when bills.budget_id is null then 'Venda Direta (' || vendedor.name || ')'
             else coalesce(avaliador.name, 'Não Identificado') end`)
			.whereNull("bills.deleted_at")
			.where("bills.economic_group_id", authCtx.group.id);

		if (authCtx.user.type === "user" || authCtx.user.type === "controller") {
			qb.where("business_units.environment", "P" as TBusinessUnitEnvironment);
		}

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("bills.business_unit_id", data.units);
		} else {
			qb.where("bills.business_unit_id", authCtx.unit.id);
		}

		if (data.fromDate && data.toDate) {
			qb.andWhereRaw("bills.bill_date::date between ? and ?", [
				data.fromDate,
				data.toDate,
			]);
		}

		const result: {
			id_unidade_negocios: string;
			identificacao_unidade: string;
			id_avaliador: string;
			nome_avaliador: string;
			qtd_clientes: number;
			total_realizado: number;
			tkt_medio_realizado: number;
			qtd_avaliacoes: number;
			total_avaliacoes: number;
			tkt_medio_avaliacoes: number;
		}[] = await qb;

		const uniqueUnits = result.reduce((acc, curr) => {
			if (!acc.includes(curr.id_unidade_negocios)) {
				acc.push(curr.id_unidade_negocios);
			}

			return acc;
		}, [] as string[]) as string[];

		return {
			name: "billsReviewer",
			description: "Vendas por Período",
			type: "table",
			hasData: result.length > 0,
			data: uniqueUnits.map((elem) => {
				const unit = result.find((r) => r.id_unidade_negocios === elem);

				if (!unit) {
					return undefined;
				}

				const unitUsers = result.filter((r) => r.id_unidade_negocios === elem);

				const realizedSum = unitUsers.reduce(
					(sum, curr) => sum + curr.total_realizado,
					0,
				);
				const reviewedSum = unitUsers.reduce(
					(sum, curr) => sum + curr.total_avaliacoes,
					0,
				);

				return {
					id: unit.identificacao_unidade,
					identification: unit.identificacao_unidade,
					totalConfirmados: this.shared.formatter.format(realizedSum),
					totalOrcamentos: this.shared.formatter.format(reviewedSum),
					users: unitUsers.map((usr) => ({
						userId: usr.id_avaliador,
						userName: usr.nome_avaliador,
						qtdClientes: usr.qtd_clientes,
						valorRealizado: this.shared.formatter.format(usr.total_realizado),
						ticketMedioRealizado: this.shared.formatter.format(
							usr.tkt_medio_realizado,
						),
						participacaoRealizado: this.shared.formatPercentage(
							(usr.total_realizado / realizedSum) * 100,
						),
						qtdAvaliacoes: usr.qtd_avaliacoes,
						totalAvaliado: this.shared.formatter.format(usr.total_avaliacoes),
						ticketMedioAvaliacoes: this.shared.formatter.format(
							usr.tkt_medio_avaliacoes,
						),
					})),
				};
			}),
		};
	}
}
