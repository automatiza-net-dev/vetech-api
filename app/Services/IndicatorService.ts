import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import { BillStatus } from 'App/Models/Bill';
import { BudgetStatus } from 'App/Models/Budget';
import { ProductType } from 'App/Models/Product';
import { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

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
    const qb = Database.from('bills')
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
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .whereNull('bills.deleted_at');

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
    } else {
      qb.where('business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
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
    const qb1 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at')
      .andWhereRaw(
        `to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
        [],
      );

    const qb2 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'client_origins.description')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at')
      .andWhereRaw(
        `to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
        [],
      );

    if (data.unit) {
      qb1.where('bills.business_unit_id', data.unit);
      qb2.where('bills.business_unit_id', data.unit);
    } else {
      qb1.where('bills.business_unit_id', authCtx.unit.id);
      qb2.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [r1, r2] = await Promise.all([qb1, qb2]);
    const result = r1.concat(r2);

    return result
      .map(elem => ({
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
    const qb1 = Database.from('bills')
      .select(Database.raw('sum(total_value) as total_sales'))
      .where('bills.business_unit_id', data.unit ?? authCtx.unit.id)
      .whereNull('bills.deleted_at');

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_sales = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_sales);

    const qb = Database.from('bill_items')
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
      .leftJoin('bills', query => {
        query.on('bills.id', '=', 'bill_items.bill_id');
      })
      .leftJoin('product_variations', query => {
        query.on(
          'product_variations.id',
          '=',
          'bill_items.product_variation_id',
        );
      })
      .leftJoin('products', query => {
        query.on('products.id', '=', 'product_variations.product_id');
      })
      .leftJoin('business_unit_products', query => {
        query
          .on(
            'business_unit_products.product_variation_id',
            '=',
            'bill_items.product_variation_id',
          )
          .andOn(
            'business_unit_products.businness_unit_id',
            '=',
            'bill_items.business_unit_id',
          );
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('products.id', 'products.description', 'business_units.id')
      .whereNull('bills.deleted_at');

    if (data.unit) {
      qb.where('bills.business_unit_id', data.unit);
    } else {
      qb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }
    qb.andWhereIn(
      'products.type',
      data.type ? [data.type] : [ProductType.PRODUCT, ProductType.SERVICE],
    );

    const result = await qb;

    return result.map(elem => ({
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

  public async invoicingByPaymentMethod(
    authCtx: AuthContext,
    data: {
      unit?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const qb1 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'business_units.identification')
      .orderBy('totalpayments', 'desc')
      .whereNull('bills.deleted_at');

    const qb2 = Database.from('bills')
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
      .join('payment_methods', query => {
        query.on('payment_methods.id', '=', 'bill_payments.payment_method_id');
      })
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'payment_methods.description')
      .orderBy('totalpayments', 'desc')
      .whereNull('bills.deleted_at');

    if (data.unit) {
      qb1.where('bills.business_unit_id', data.unit);
      qb2.where('bills.business_unit_id', data.unit);
    } else {
      qb1.where('bills.business_unit_id', authCtx.unit.id);
      qb2.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [result1, result2] = await Promise.all([qb1, qb2]);
    const result = result1.concat(result2);

    const total = result1.at(0)?.totalbills ?? 0;

    return result.map(elem => ({
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
    const qb = Database.from('bills')
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
      .leftJoin('patients', query => {
        query.on('patients.id', '=', 'bills.client_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .where('bills.business_unit_id', data.unit ?? authCtx.unit.id)
      .whereNull('bills.deleted_at');

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
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
    const qb = Database.from('bills')
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
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_unit_id', data.units);
    } else {
      qb.where('business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
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
    const qb1 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at')
      .andWhereRaw(
        `to_char(bills.bill_date, 'YYYY-MM') <> to_char(patients.first_sale, 'YYYY-MM')`,
        [],
      );

    const qb2 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'client_origins.description')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at')
      .andWhereRaw(
        `to_char(bills.bill_date, 'YYYY-MM') = to_char(patients.first_sale, 'YYYY-MM')`,
        [],
      );

    if (data.units && Array.isArray(data.units)) {
      qb1.whereIn('bills.business_unit_id', data.units);
      qb2.whereIn('bills.business_unit_id', data.units);
    } else {
      qb1.where('bills.business_unit_id', authCtx.unit.id);
      qb2.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [r1, r2] = await Promise.all([qb1, qb2]);
    const result = r1.concat(r2);

    return result
      .map(elem => ({
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
    const qb1 = Database.from('bills')
      .select(Database.raw('sum(total_value) as total_sales'))
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb1.whereIn('bills.business_unit_id', data.units);
    } else {
      qb1.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_sales = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_sales);

    const qb = Database.from('bill_items')
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
      .leftJoin('bills', query => {
        query.on('bills.id', '=', 'bill_items.bill_id');
      })
      .leftJoin('product_variations', query => {
        query.on(
          'product_variations.id',
          '=',
          'bill_items.product_variation_id',
        );
      })
      .leftJoin('products', query => {
        query.on('products.id', '=', 'product_variations.product_id');
      })
      .leftJoin('business_unit_products', query => {
        query
          .on(
            'business_unit_products.product_variation_id',
            '=',
            'bill_items.product_variation_id',
          )
          .andOn(
            'business_unit_products.businness_unit_id',
            '=',
            'bill_items.business_unit_id',
          );
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('products.id', 'products.description', 'business_units.id')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('bills.business_unit_id', data.units);
    } else {
      qb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }
    qb.andWhereIn(
      'products.type',
      data.type ? [data.type] : [ProductType.PRODUCT, ProductType.SERVICE],
    );

    const result = await qb;

    return result.map(elem => ({
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
    const qb1 = Database.from('bills')
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
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'business_units.identification')
      .orderBy('totalpayments', 'desc')
      .whereNull('bills.deleted_at');

    const qb2 = Database.from('bills')
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
      .join('payment_methods', query => {
        query.on('payment_methods.id', '=', 'bill_payments.payment_method_id');
      })
      .join('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id', 'payment_methods.description')
      .orderBy('totalpayments', 'desc')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb1.whereIn('bills.business_unit_id', data.units);
      qb2.whereIn('bills.business_unit_id', data.units);
    } else {
      qb1.where('bills.business_unit_id', authCtx.unit.id);
      qb2.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [result1, result2] = await Promise.all([qb1, qb2]);
    const result = result1.concat(result2);

    const total = result1.at(0)?.totalbills ?? 0;

    return result.map(elem => ({
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
    const qb = Database.from('bills')
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
      .leftJoin('patients', query => {
        query.on('patients.id', '=', 'bills.client_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('business_units.id')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('bills.business_unit_id', data.units);
    } else {
      qb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
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
    const salesQb = Database.from('bills')
      .select(
        Database.raw(
          'bills.business_unit_id as id, count(distinct id) as sales',
        ),
      )
      .groupBy('bills.business_unit_id')
      .whereNot('status', BillStatus.EX);

    const qb = Database.from('schedules')
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
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'schedules.business_unit_id');
      })
      .joinRaw(
        `join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id and schedule_service_types.type = 'A'`,
      )
      .groupBy('business_units.id');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('schedules.business_unit_id', data.units);
      salesQb.whereIn('bills.business_unit_id', data.units);
    } else {
      qb.where('schedules.business_unit_id', authCtx.unit.id);
      salesQb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('schedules.start_hour::date >= ?', [data.fromDate]);
      salesQb.andWhereRaw('bills.bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('schedules.start_hour::date <= ?', [data.toDate]);
      salesQb.andWhereRaw('bills.bill_date::date <= ?', [data.toDate]);
    }

    const salesResult = await salesQb;
    const generalResult = await qb;

    return generalResult.map(elem => ({
      id: elem.id,
      identification: elem.identification,
      scheduled: parseInt(elem.agendados, 10),
      attended: parseInt(elem.atendidos, 10),
      sales: parseInt(salesResult.find(r => r.id === elem.id)?.sales ?? '0'),
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
    const totalQb = Database.from('bills')
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      totalQb.whereIn('bills.business_unit_id', data.units);
    } else {
      totalQb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      totalQb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      totalQb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_bill_payments = '0' }] = await totalQb;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb = Database.from('bills')
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
        `join bill_items on bill_items.bill_id = bills.id and bill_items.status = 'ATIVA'`,
      )
      .join(
        'product_variations',
        'product_variations.id',
        'bill_items.product_variation_id',
      )
      .join('products', 'products.id', 'product_variations.product_id')
      .join('subgroups', 'subgroups.id', 'products.subgroup_id')
      .join('business_units', 'business_units.id', 'bills.business_unit_id')
      .groupBy('subgroups.id', 'subgroups.description', 'business_units.id')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('bills.business_unit_id', data.units);
    } else {
      qb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bills.bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bills.bill_date::date <= ?', [data.toDate]);
    }

    if (data.type) {
      qb.andWhere('products.type', data.type);
    }

    const result = await qb;

    return result.map(elem => ({
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

  public async consolidatedSubgroupIndicators(
    authCtx: AuthContext,
    data: {
      units?: string[];
      fromDate?: string;
      toDate?: string;
      type?: string;
    },
  ) {
    const totalQb = Database.from('bills')
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))

      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      totalQb.whereIn('bills.business_unit_id', data.units);
    } else {
      totalQb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      totalQb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      totalQb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_bill_payments = '0' }] = await totalQb;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb = Database.from('bills')
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
      .leftJoin('bill_items', query => {
        query.on('bill_items.bill_id', '=', 'bills.id');
      })
      .leftJoin('product_variations', query => {
        query.on(
          'product_variations.id',
          '=',
          'bill_items.product_variation_id',
        );
      })
      .leftJoin('products', query => {
        query.on('products.id', '=', 'product_variations.product_id');
      })
      .leftJoin('subgroups', query => {
        query.on('subgroups.id', '=', 'products.subgroup_id');
      })
      .groupBy('subgroups.id', 'subgroups.description')
      .orderBy('total', 'desc')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('bills.business_unit_id', data.units);
    } else {
      qb.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bills.bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bills.bill_date::date <= ?', [data.toDate]);
    }

    if (data.type) {
      qb.andWhere('products.type', data.type);
    }

    const result = await qb;

    return result.map(elem => ({
      subgroupID: elem.id,
      description: elem.description,
      total: elem.total,
      uniqueClients: parseInt(elem.clients, 10),
      percentage: (elem.total / parsedTotal) * 100,
    }));
  }

  public async opportunitiesIndicators(
    _: AuthContext,
    data: {
      unit?: string;
      group?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    if (!data.unit) {
      throw new BadRequestException('Informe a unidade', 400, 'E_ERR');
    }

    const qb = Database.from('opportunity_logs')
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
      .leftJoin('crm_statuses', query => {
        query.on('crm_statuses.id', '=', 'opportunity_logs.status_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'opportunity_logs.business_unit_id');
      })
      .groupBy('business_units.id')
      .where('opportunity_logs.business_unit_id', data.unit);

    if (data.group) {
      qb.andWhere('opportunity_logs.economic_group_id', data.group);
    }

    if (data.fromDate) {
      qb.andWhereRaw('opportunity_logs.contact_date::date >= ?', [
        data.fromDate,
      ]);
    }

    if (data.toDate) {
      qb.andWhereRaw('opportunity_logs.contact_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      identification: elem.identification,
      new: parseInt(elem.novas, 10),
      scheduled: parseInt(elem.agendadas, 10),
      attended: parseInt(elem.comparecidas, 10),
      gained: parseInt(elem.ganhos, 10),
    }));
  }

  public async generalOpportunitiesIndicators(
    _: AuthContext,
    data: {
      unit?: string;
      group?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    if (!data.unit) {
      throw new BadRequestException('Informe a unidade', 400, 'E_ERR');
    }

    const qb = Database.from('opportunities')
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
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'opportunity_logs.business_unit_id');
      })
      .groupBy('business_units.id')
      .where('opportunities.business_unit_id', data.unit);

    if (data.group) {
      qb.andWhere('opportunities.economic_group_id', data.group);
    }

    if (data.fromDate) {
      qb.andWhereRaw('opportunities.contact_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('opportunities.contact_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
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
    const qb = Database.from('budgets')
      .select(
        Database.raw(
          `
            business_units.id,
            business_units.identification,
            sum(budget_items.total_value) as total
          `,
        ),
      )
      .leftJoin('budget_items', query => {
        query.on('budget_items.budget_id', '=', 'budgets.id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'budgets.business_unit_id');
      })
      .groupBy('business_units.id')
      .where('budgets.business_unit_id', data.unit ?? authCtx.unit.id)
      .where('budget_items.status', '<>', BudgetStatus.C);

    if (data.fromDate) {
      qb.andWhereRaw('budgets.budget_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('budgets.budget_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      identification: elem.identification,
      total: elem.total,
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
    const qb = Database.from('opportunity_logs')
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
      .groupBy('business_units.id');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereIn('opportunities.economic_group_id', data.groups);
    }

    if (data.fromDate) {
      qb.andWhereRaw('opportunity_logs.contact_date::date >= ?', [
        data.fromDate,
      ]);
    }

    if (data.toDate) {
      qb.andWhereRaw('opportunity_logs.contact_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => ({
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
    const qb = Database.from('bills')
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
        'economic_groups.id',
        'economic_groups.company_name',
        'business_units.id',
        'business_units.identification',
      )
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereIn('business_units.economic_group_id', data.groups);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const result = await qb;

    return result.map(elem => {
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
    const ym = dt.toFormat('yyyyMM');
    const daysOfMonth = dt.daysInMonth ?? 30;

    const qb = Database.from('bills')
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
      .joinRaw(
        `left join metas on metas.economic_group_id = economic_groups.id and metas.description = 'Faturamento'`,
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
        'economic_groups.id',
        'economic_groups.company_name',
        'business_units.id',
        'business_units.identification',
        'metas.description',
        'metas.type',
        'business_unit_metas.value',
      )
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereIn('business_units.economic_group_id', data.groups);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const metasResult = await qb;

    return metasResult.map(elem => {
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
    const qb = Database.from('bills')
      .select(
        Database.raw(
          `
        economic_groups.id                                                      as e_id,
        economic_groups.company_name                                            as e_name,
        business_units.id                                                       as b_id,
        business_units.identification,
        case when products.type = 'product' then 'Produtos' else 'Serviços' end as tipo,
        sum(bill_items.total_value)
          `,
        ),
      )
      .joinRaw(
        `join bill_items on bills.id = bill_items.bill_id and bill_items.status <> 'INATIVA'`,
      )
      .joinRaw(
        `join product_variations product_variations on bill_items.product_variation_id = product_variations.id`,
      )
      .joinRaw(`join products on product_variations.product_id = products.id`)
      .joinRaw(
        `join business_units on bills.business_unit_id = business_units.id`,
      )
      .joinRaw(
        `join economic_groups on business_units.economic_group_id = economic_groups.id`,
      )
      .groupBy('economic_groups.id', 'business_units.id', 'products.type')
      .orderBy('products.type')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereIn('business_units.economic_group_id', data.groups);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const metasResult = await qb;

    return metasResult.map(elem => {
      return {
        group: {
          id: elem.e_id,
          name: elem.e_name,
        },
        unit: {
          id: elem.b_id,
          identification: elem.identification,
        },
        type: elem.tipo,
        total: elem.sum,
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
    const qb = Database.from('bills')
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
      .groupBy('economic_groups.id', 'business_units.id')
      .whereNull('bills.deleted_at');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('business_units.id', data.units);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    if (data.groups && Array.isArray(data.groups)) {
      qb.whereIn('business_units.economic_group_id', data.groups);
    }

    if (data.fromDate) {
      qb.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const metasResult = await qb;

    return metasResult.map(elem => {
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
}
