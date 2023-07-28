import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Finance, { FinanceType } from 'App/Models/Finance';
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
