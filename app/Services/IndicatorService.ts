import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
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
          `business_units.id,
          business_units.identification,
          sum(total_value) as total_vendas,
          count(bills.id) qtd_vendas,
          sum(total_value) / count(bills.id) ticket_medio`,
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
      medianTicket: result.ticket_medio,
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
    const qb = Database.from('bills')
      .select(
        Database.raw(
          `
            business_units.id,
            business_units.identification,
            client_origins.id as id,
            client_origins.description,
            count(bills.id) as qty_sales,
            sum(bills.total_value) total_payments`,
        ),
      )
      .leftJoin('patients', query => {
        query.on('patients.id', '=', 'bills.client_id');
      })
      .leftJoin('patient_tutors', query => {
        query.on('patient_tutors.patient_id', '=', 'patients.id');
      })
      .leftJoin('client_origins', query => {
        query.on('client_origins.id', '=', 'patient_tutors.client_origin_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('client_origins.id', 'business_units.id')
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

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      identification: elem.identification,
      originId: elem.id,
      description: elem.description,
      qtySales: parseInt(elem.qty_sales, 10),
      totalPayments: elem.total_payments,
    }));
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
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))
      .where('bills.business_unit_id', data.unit ?? authCtx.unit.id)
      .whereNull('bills.deleted_at');

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_bill_payments = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb = Database.from('bill_payments')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          payment_methods.id as pID,
          payment_methods.description,
          sum(bills.total_value) total_payments`,
        ),
      )
      .leftJoin('bills', query => {
        query.on('bills.id', '=', 'bill_payments.bill_id');
      })
      .leftJoin('payment_methods', query => {
        query.on('payment_methods.id', '=', 'bill_payments.payment_method_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy(
        'payment_methods.id',
        'payment_methods.description',
        'business_units.id',
      )
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

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      identification: elem.identification,
      paymentMethodId: elem.pID,
      description: elem.description,
      totalSales: elem.total_payments,
      percentage: (elem.total_payments / parsedTotal) * 100,
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
    const qb1 = Database.from('bills')
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))
      .where('bills.business_unit_id', data.unit ?? authCtx.unit.id)
      .whereNull('bills.deleted_at');

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    const [{ total_bill_payments = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb2 = Database.from('bills')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          count('bills.client_id'),
          sum(bills.total_value) total_payments`,
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

    const qb3 = Database.from('bills')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          count('bills.client_id'),
          sum(bills.total_value) total_payments`,
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
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);

      qb3.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb3.andWhereRaw('patients.first_sale::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);

      qb3.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb3.andWhereRaw('patients.first_sale::date <= ?', [data.toDate]);
    }

    const oldClients = await qb2;
    const newClients = await qb3;

    return {
      total: parsedTotal,
      oldClients: oldClients.map(elem => ({
        id: elem.id,
        identification: elem.identification,
        qtySales: parseInt(elem?.count ?? '0', 10),
        totalSales: elem?.total_payments ?? 0,
      })),
      newClients: newClients.map(elem => ({
        id: elem.id,
        identification: elem.identification,
        qtySales: parseInt(elem?.count ?? '0', 10),
        totalSales: elem?.total_payments ?? 0,
      })),
    };
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
          sum(total_value) as total_vendas,
          count(bills.id) qtd_vendas,
          sum(total_value) / count(bills.id) ticket_medio
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
      medianTicket: result.ticket_medio,
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
    const qb = Database.from('bill_payments')
      .select(
        Database.raw(
          `
            business_units.id,
            business_units.identification,
            client_origins.id as id,
            client_origins.description,
            count(bills.id) as qty_sales,
            sum(bill_payments.total_value) total_payments`,
        ),
      )
      .leftJoin('bills', query => {
        query.on('bills.id', '=', 'bill_payments.bill_id');
      })
      .leftJoin('patients', query => {
        query.on('patients.id', '=', 'bills.client_id');
      })
      .leftJoin('patient_tutors', query => {
        query.on('patient_tutors.patient_id', '=', 'patients.id');
      })
      .leftJoin('client_origins', query => {
        query.on('client_origins.id', '=', 'patient_tutors.client_origin_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy('client_origins.id', 'business_units.id')
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
      originId: elem.id,
      description: elem.description,
      qtySales: parseInt(elem.qty_sales, 10),
      totalPayments: elem.total_payments,
    }));
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
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))
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

    const [{ total_bill_payments = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb = Database.from('bill_payments')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          payment_methods.id as pID,
          payment_methods.description,
          sum(bill_payments.total_value) total_payments`,
        ),
      )
      .leftJoin('bills', query => {
        query.on('bills.id', '=', 'bill_payments.bill_id');
      })
      .leftJoin('payment_methods', query => {
        query.on('payment_methods.id', '=', 'bill_payments.payment_method_id');
      })
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'bills.business_unit_id');
      })
      .groupBy(
        'payment_methods.id',
        'payment_methods.description',
        'business_units.id',
      )
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
      paymentMethodId: elem.pID,
      description: elem.description,
      totalSales: elem.total_payments,
      percentage: (elem.total_payments / parsedTotal) * 100,
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
    const qb1 = Database.from('bills')
      .select(Database.raw('sum(bills.total_value) as total_bill_payments'))
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

    const [{ total_bill_payments = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_bill_payments);

    const qb2 = Database.from('bills')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          count('bills.client_id'),
          sum(bills.total_value) total_payments`,
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
      qb2.whereIn('bills.business_unit_id', data.units);
    } else {
      qb2.where('bills.business_unit_id', authCtx.unit.id);
    }

    const qb3 = Database.from('bills')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          count('bills.client_id'),
          sum(bills.total_value) total_payments`,
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
      qb3.whereIn('bills.business_unit_id', data.units);
    } else {
      qb3.where('bills.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb3.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb3.andWhereRaw('patients.first_sale::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb3.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb3.andWhereRaw('patients.first_sale::date <= ?', [data.toDate]);
    }

    const oldClients = await qb2;
    const newClients = await qb3;

    return {
      total: parsedTotal,
      oldClients: oldClients.map(elem => ({
        id: elem.id,
        identification: elem.identification,
        qtySales: parseInt(elem?.count ?? '0', 10),
        totalSales: elem?.total_payments ?? 0,
      })),
      newClients: newClients.map(elem => ({
        id: elem.id,
        identification: elem.identification,
        qtySales: parseInt(elem?.count ?? '0', 10),
        totalSales: elem?.total_payments ?? 0,
      })),
    };
  }

  public async schedulingIndicators(
    authCtx: AuthContext,
    data: {
      units?: string[];
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const qb = Database.from('schedules')
      .select(
        Database.raw(
          `
          business_units.id,
          business_units.identification,
          count(schedules.id)               as agendados,
          count(schedule_status_changes.id) as confirmados,
          count(schedules.finished_at)      as atendidos,
          count(cancellation_user_id)       as cancelados
        `,
        ),
      )
      .joinRaw(
        `join (schedule_status_changes join schedule_statuses on schedule_status_changes.schedule_status_id = schedule_statuses.id
                  and schedule_statuses.type = 'AC')
                  on schedules.id = schedule_status_changes.schedule_id`,
        [],
      )
      .leftJoin('business_units', query => {
        query.on('business_units.id', '=', 'schedules.business_unit_id');
      })
      .groupBy('business_units.id');

    if (data.units && Array.isArray(data.units)) {
      qb.whereIn('schedules.business_unit_id', data.units);
    } else {
      qb.where('schedules.business_unit_id', authCtx.unit.id);
    }

    if (data.fromDate) {
      qb.andWhereRaw('schedules.start_hour::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb.andWhereRaw('schedules.start_hour::date <= ?', [data.toDate]);
    }

    return (await qb).map(elem => ({
      id: elem.id,
      identification: elem.identification,
      scheduled: parseInt(elem.agendados, 10),
      confirmed: parseInt(elem.confirmados, 10),
      attended: parseInt(elem.atendidos, 10),
      canceled: parseInt(elem.cancelados, 10),
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
}
