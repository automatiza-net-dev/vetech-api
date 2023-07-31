import { inject } from '@adonisjs/fold';
import BusinessUnit from 'App/Models/BusinessUnit';
import CheckingAccount from 'App/Models/CheckingAccount';
import Finance, { FinanceStatus, FinanceType } from 'App/Models/Finance';
import { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class ReportService {
  async financeReport(
    authCtx: AuthContext,
    data: {
      type?: string;
      fromIssueDate?: Date;
      toIssueDate?: Date;
      fromExpirationDate?: Date;
      toExpirationDate?: Date;
      fromPaymentDate?: Date;
      toPaymentDate?: Date;
      fromCompetenceDate?: Date;
      toCompetenceDate?: Date;
      paymentMethod?: string;
      accountPlan?: string;
      status?: string;
      businessUnit?: string;
    },
  ) {
    const qb = Finance.query()
      .preload('client')
      .preload('checkingAccount')
      .preload('paymentMethod')
      .preload('accountPlan')
      .where('economic_group_id', authCtx.group.id);

    if (data.type) {
      qb.where('type', data.type);
    }

    if (data.paymentMethod) {
      qb.where('payment_method_id', data.paymentMethod);
    }

    if (data.accountPlan) {
      qb.where('account_plan_id', data.accountPlan);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    if (data.fromIssueDate) {
      qb.where('issueDate', '>=', data.fromIssueDate);
    }

    if (data.toIssueDate) {
      qb.where('issueDate', '<=', data.toIssueDate);
    }

    if (data.fromExpirationDate) {
      qb.where('expirationDate', '>=', data.fromExpirationDate);
    }

    if (data.toExpirationDate) {
      qb.where('expirationDate', '<=', data.toExpirationDate);
    }

    if (data.fromCompetenceDate) {
      qb.where('competenceDate', '>=', data.fromCompetenceDate);
    }

    if (data.toCompetenceDate) {
      qb.where('competenceDate', '<=', data.toCompetenceDate);
    }

    if (data.fromPaymentDate) {
      qb.where('paymentDate', '>=', data.fromPaymentDate);
    }

    if (data.toPaymentDate) {
      qb.where('paymentDate', '<=', data.toPaymentDate);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      document: elem.document,
      type: elem.type,
      issueDate: elem.issueDate,
      expirationDate: elem.expirationDate,
      paymentDate: elem.paymentDate,
      competenceDate: elem.competenceDate,
      fiscalNote: elem.fiscalNote,
      value: elem.value,
      totalValue: elem.totalValue,
      paymentValue: elem.paymentValue,
      nsuDocument: elem.nsuDocument,
      status: elem.status,

      client: elem.client
        ? {
            id: elem.client.id,
            name: elem.client.name,
          }
        : null,
      checkingAccount: elem.checkingAccount
        ? {
            id: elem.checkingAccount.id,
            description: elem.checkingAccount.description,
          }
        : null,
      paymentMethod: elem.client
        ? {
            id: elem.paymentMethod.id,
            description: elem.paymentMethod.description,
          }
        : null,
      accountPlan: elem.client
        ? {
            id: elem.accountPlan.id,
            description: elem.accountPlan.description,
          }
        : null,
    }));
  }

  async cashierFlowReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      businessUnit?: string;
    },
  ) {
    const financeQbs = Finance.query()
      .preload('unit')
      .where('economic_group_id', authCtx.group.id);

    if (data.businessUnit) {
      financeQbs.where('business_unit_id', data.businessUnit);
    }

    if (data.fromDate) {
      financeQbs.whereRaw('expiration_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      financeQbs.whereRaw('expiration_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    const result = await financeQbs;

    const unitsSet = new Set<string>(result.map(r => r.unit.id));
    const uniqueUnitIds = Array.from(unitsSet);
    const units = uniqueUnitIds
      .map(elem => result.find(r => r.unit.id === elem)?.unit)
      .filter(Boolean) as BusinessUnit[];

    return units.map(elem => ({
      id: elem.id,
      identification: elem.identification ?? '-',
      flow: this.calculateDailyFlow(
        result.filter(r => r.business_unit_id === elem.id),
      ),
    }));
  }

  async checkingAccountReport(
    authCtx: AuthContext,
    data: {
      businessUnit?: string;
    },
  ) {
    const qb = CheckingAccount.query()
      .preload('unit')
      .where('economic_group_id', authCtx.group.id);

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    const result = await qb;

    const unitsSet = new Set<string>(result.map(r => r.unit.id));
    const uniqueUnitIds = Array.from(unitsSet);
    const units = uniqueUnitIds
      .map(elem => result.find(r => r.unit.id === elem)?.unit)
      .filter(Boolean) as BusinessUnit[];

    const dataSet = new Map<string, number>();
    result.forEach(r => {
      const key = r.business_unit_id;
      if (!dataSet.has(key)) {
        dataSet.set(key, 0);
      }

      const entry = dataSet.get(key)!;
      dataSet.set(key, entry + r.balance);
    });

    return units.map(elem => ({
      id: elem.id,
      identification: elem.identification ?? '-',
      total: dataSet.get(elem.id) ?? 0,
    }));
  }

  async expiredFinancesReport(
    authCtx: AuthContext,
    data: {
      businessUnit?: string;
    },
  ) {
    const qb = Finance.query()
      .preload('unit')
      .where('economic_group_id', authCtx.group.id)
      .whereRaw('expiration_date::date < now()::date', [])
      .where('status', FinanceStatus.A)
      .whereNull('deleted_at');

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    const result = await qb;

    const unitsSet = new Set<string>(result.map(r => r.unit.id));
    const uniqueUnitIds = Array.from(unitsSet);
    const units = uniqueUnitIds
      .map(elem => result.find(r => r.unit.id === elem)?.unit)
      .filter(Boolean) as BusinessUnit[];

    const dataSet = new Map<string, { credit: number; debit: number }>();
    result.forEach(r => {
      const key = r.business_unit_id;
      if (!dataSet.has(key)) {
        dataSet.set(key, { credit: 0, debit: 0 });
      }

      const entry = dataSet.get(key)!;
      if (r.type === FinanceType.C) {
        entry.credit += r.totalValue;
      } else {
        entry.debit += r.totalValue;
      }

      dataSet.set(key, entry);
    });

    return units.map(elem => ({
      id: elem.id,
      identification: elem.identification ?? '-',
      total: dataSet.get(elem.id) ?? null,
    }));
  }

  private calculateDailyFlow(finances: Finance[]) {
    const dataSet = new Map<string, { credit: number; debit: number }>();

    finances.forEach(f => {
      const date = f.expirationDate.toFormat('yyyy-MM-dd');
      if (!dataSet.has(date)) {
        dataSet.set(date, { credit: 0, debit: 0 });
      }

      const entry = dataSet.get(date)!;
      if (f.type === FinanceType.C) {
        entry.credit += f.totalValue;
      } else {
        entry.debit += f.totalValue;
      }

      dataSet.set(date, entry);
    });

    return Object.fromEntries(dataSet.entries());
  }
}
