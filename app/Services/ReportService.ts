import { inject } from '@adonisjs/fold';
import Finance from 'App/Models/Finance';
import { AuthContext } from 'App/Services/SharedService';

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
}
