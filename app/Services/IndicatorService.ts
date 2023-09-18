import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import { BillStatus } from 'App/Models/Bill';
import { ProductType } from 'App/Models/Product';
import { AuthContext } from 'App/Services/SharedService';

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
      .select(Database.raw('count(distinct id) as sales'))
      .groupBy('bills.business_unit_id')
      .whereNot('status', BillStatus.EX);

    const qb = Database.from('schedules')
      .select(
        Database.raw(
          `
            business_units.id,
            business_units.identification,
            count(schedules.id)          as agendados,
            count(schedules.finished_at) as atendidos
          `,
        ),
      )
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'schedules.business_unit_id');
      })
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
      sales: salesResult.find(r => r.id === elem.id)?.sales ?? 0,
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
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
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

  public async crmIndicators(
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
}
