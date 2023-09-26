import { inject } from '@adonisjs/fold';
import Bill from 'App/Models/Bill';
import Budget from 'App/Models/Budget';
import BusinessUnit from 'App/Models/BusinessUnit';
import CheckingAccount from 'App/Models/CheckingAccount';
import Finance, { FinanceStatus, FinanceType } from 'App/Models/Finance';
import Schedule from 'App/Models/Schedule';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import { DateTime } from 'luxon';

@inject()
export default class ReportService {
  constructor(private sharedService: SharedService) {}

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
      qtyInstallments: elem.qtyInstallments,
      installment: elem.installment,

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
      paymentMethod: elem.paymentMethod
        ? {
            id: elem.paymentMethod.id,
            description: elem.paymentMethod.description,
          }
        : null,
      accountPlan: elem.accountPlan
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
      .where('economic_group_id', authCtx.group.id)
      .whereNot('status', FinanceStatus.E);

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

  async salesReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      client?: string;
      patient?: string;
      businessUnits?: string[];
      economicGroups?: string[];
      businessStates?: string[];
      businessCities?: string[];
    },
  ) {
    const qb = Bill.query()
      .preload('economicGroup')
      .preload('businessUnit')
      .preload('seller')
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('clientOrigin');
        });
      })
      .preload('patient')
      .whereNull('deleted_at');

    if (
      data.economicGroups &&
      Array.isArray(data.economicGroups) &&
      data.economicGroups.length > 0
    ) {
      qb.whereIn('economic_group_id', data.economicGroups);
    } else {
      qb.where('economic_group_id', authCtx.group.id);
    }

    if (
      data.businessUnits &&
      Array.isArray(data.businessUnits) &&
      data.businessUnits.length > 0
    ) {
      qb.where('business_unit_id', data.businessUnits);
    }

    const withBusinessStates =
      data.businessStates &&
      Array.isArray(data.businessStates) &&
      data.businessStates.length > 0;
    const withBusinessCities =
      data.businessCities &&
      Array.isArray(data.businessCities) &&
      data.businessCities.length > 0;
    if (withBusinessStates || withBusinessCities) {
      qb.whereHas('businessUnit', query => {
        if (withBusinessStates) {
          query.whereIn('state', data.businessStates ?? []);
        }

        if (withBusinessCities) {
          query.whereIn('city', data.businessCities ?? []);
        }
      });
    }

    if (data.fromDate) {
      qb.whereRaw('bill_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('bill_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.client) {
      qb.where('client_id', data.client);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    const result = await qb;

    return result
      .map(elem => ({
        id: elem.id,
        tag: elem.tag,
        billDate: elem.billDate,
        productValue: elem.productValue,
        serviceValue: elem.serviceValue,
        discountValue: elem.discountValue,
        totalValue: elem.totalValue,
        paidValue: elem.paidValue,
        missingPaymentValue: elem.totalValue - elem.paidValue,
        status: elem.status,

        group: {
          id: elem.economicGroup.id,
          name: elem.economicGroup.companyName,
        },
        unit: {
          id: elem.businessUnit.id,
          identification: elem.businessUnit.identification ?? '-',
          city: elem.businessUnit.city,
          state: elem.businessUnit.state,
        },
        seller: this.sharedService.captureGroup(elem.seller, v => ({
          id: v.id,
          name: v.name,
        })),
        client: this.sharedService.captureGroup(elem.client, v => ({
          id: v.id,
          name: v.name,
          tag: v.tag,
          cellphone: v.tutor?.cellphone ?? null,
          origin: v.tutor?.clientOrigin?.description ?? null,
        })),
        patient: this.sharedService.captureGroup(elem.patient, v => ({
          id: v.id,
          name: v.name,
        })),
      }))
      .sort((a, b) => {
        if (a.group.name.localeCompare(b.group.name) !== 0) {
          return a.group.name.localeCompare(b.group.name);
        }

        if (a.unit.identification.localeCompare(b.unit.identification) !== 0) {
          return a.unit.identification.localeCompare(b.unit.identification);
        }

        return (
          a.billDate.toJSDate().getTime() - b.billDate.toJSDate().getTime()
        );
      });
  }

  async detailedSalesReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      client?: string;
      patient?: string;
      businessUnit?: string;
    },
  ) {
    const qb = Bill.query()
      .preload('businessUnit')
      .preload('seller')
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('profession');
          query.preload('clientOrigin');
        });
      })
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('items', query => {
        query.preload('productVariation', query => {
          query.preload('product', query => {
            query.preload('subgroup');
          });
        });
      })
      .preload('budget')
      .preload('payments', query => {
        query.preload('flag').preload('paymentMethod');
      })
      .where('economic_group_id', authCtx.group.id)
      .whereNull('deleted_at')
      .orderBy('bill_date', 'desc');

    if (data.fromDate) {
      qb.whereRaw('bill_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('bill_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.client) {
      qb.where('client_id', data.client);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      billDate: elem.billDate,
      productValue: elem.productValue,
      serviceValue: elem.serviceValue,
      discountValue: elem.discountValue,
      totalValue: elem.totalValue,
      paidValue: elem.paidValue,
      missingPaymentValue: elem.totalValue - elem.paidValue,
      status: elem.status,

      unit: {
        id: elem.businessUnit.id,
        identification: elem.businessUnit.identification,
      },
      seller: this.sharedService.captureGroup(elem.seller, v => ({
        id: v.id,
        name: v.name,
      })),
      client: elem.client
        ? {
            id: elem.client.id,
            name: elem.client.name,
            profession: elem.client.tutor?.profession?.description ?? null,
            origin: elem.client.tutor?.clientOrigin?.description ?? null,
            document: elem.client.tutor?.document ?? null,
            createdAt: elem.client.createdAt,
            address: [
              elem.client.tutor?.postalCode,
              elem.client.tutor?.street,
              elem.client.tutor?.number,
              elem.client.tutor?.complement,
              elem.client.tutor?.district,
              elem.client.tutor?.city,
              elem.client.tutor?.state,
            ]
              .filter(Boolean)
              .join(', '),
          }
        : null,
      patient: this.sharedService.captureGroup(elem.patient, v => ({
        id: v.id,
        name: v.name,
        race: v.patientAnimal.race,
        gender: v.gender ?? null,
        castrated: v?.patientAnimal?.castrated ?? null,
      })),
      budget: this.sharedService.captureGroup(elem.budget, v => ({
        id: v.id,
        tag: v.tag,
        budgetDate: v.budgetDate,
      })),
      payments: elem.payments.map(inner => ({
        id: inner.id,
        block: inner.block,
        qtyInstallments: inner.qtyInstallments,
        totalValue: inner.totalValue,
        installments: inner.installments,

        paymentMethod: this.sharedService.captureGroup(
          inner.paymentMethod,
          v => ({
            id: v.id,
            description: v.description,
          }),
        ),
        flag: this.sharedService.captureGroup(inner.flag, v => ({
          id: v.id,
          description: v.description,
        })),
      })),
      items: elem.items.map(inner => ({
        id: inner.id,
        quantity: inner.quantity,
        costValue: inner.costValue,
        saleValue: inner.saleValue,
        discountValue: inner.discountValue,
        totalValue: inner.totalValue,
        product: {
          description: inner.productVariation.product.description ?? null,
          type: inner.productVariation.product.type ?? null,
          subgroup: this.sharedService.captureGroup(
            inner.productVariation.product?.subgroup,
            v => ({ id: v.id, description: v.description }),
          ),
        },
      })),
    }));
  }

  async saleAnalyticsReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      client?: string;
      patient?: string;
      businessUnits?: string[];
      economicGroups?: string[];
      businessStates?: string[];
      businessCities?: string[];
    },
  ) {
    const qb = Bill.query()
      .preload('economicGroup')
      .preload('businessUnit')
      .preload('seller')
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('profession');
          query.preload('clientOrigin');
        });
      })
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      })
      .preload('items', query => {
        query.preload('productVariation', query => {
          query.preload('product', query => {
            query.preload('subgroup');
          });
        });
      })
      .preload('budget')
      .preload('payments', query => {
        query.preload('flag').preload('paymentMethod');
      })
      .where('economic_group_id', authCtx.group.id)
      .whereNull('deleted_at')
      .orderBy('bill_date', 'desc');

    if (
      data.economicGroups &&
      Array.isArray(data.economicGroups) &&
      data.economicGroups.length > 0
    ) {
      qb.whereIn('economic_group_id', data.economicGroups);
    } else {
      qb.where('economic_group_id', authCtx.group.id);
    }

    if (
      data.businessUnits &&
      Array.isArray(data.businessUnits) &&
      data.businessUnits.length > 0
    ) {
      qb.whereIn('business_unit_id', data.businessUnits);
    }

    const withBusinessStates =
      data.businessStates &&
      Array.isArray(data.businessStates) &&
      data.businessStates.length > 0;
    const withBusinessCities =
      data.businessCities &&
      Array.isArray(data.businessCities) &&
      data.businessCities.length > 0;
    if (withBusinessStates || withBusinessCities) {
      qb.whereHas('businessUnit', query => {
        if (withBusinessStates) {
          query.whereIn('state', data.businessStates ?? []);
        }

        if (withBusinessCities) {
          query.whereIn('city', data.businessCities ?? []);
        }
      });
    }
    if (data.fromDate) {
      qb.whereRaw('bill_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('bill_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.status) {
      qb.where('status', data.status);
    }

    if (data.client) {
      qb.where('client_id', data.client);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    const result = await qb;

    return result
      .map(elem => ({
        id: elem.id,
        tag: elem.tag,
        billDate: elem.billDate,
        productValue: elem.productValue,
        serviceValue: elem.serviceValue,
        discountValue: elem.discountValue,
        totalValue: elem.totalValue,
        paidValue: elem.paidValue,
        missingPaymentValue: elem.totalValue - elem.paidValue,
        status: elem.status,

        group: {
          id: elem.economicGroup.id,
          name: elem.economicGroup.companyName,
        },
        unit: {
          id: elem.businessUnit.id,
          identification: elem.businessUnit.identification ?? '-',
          city: elem.businessUnit.city,
          state: elem.businessUnit.state,
        },
        seller: this.sharedService.captureGroup(elem.seller, v => ({
          id: v.id,
          name: v.name,
        })),
        client: this.sharedService.captureGroup(elem.client, v => ({
          id: v.id,
          name: v.name,
          tag: v.tag,
          profession: v.tutor?.profession?.description ?? null,
          origin: v.tutor?.clientOrigin?.description ?? null,
          document: v.tutor?.document ?? null,
          cellphone: v.tutor?.cellphone ?? null,
          createdAt: v.createdAt,
          address: [
            v.tutor?.postalCode,
            v.tutor?.street,
            v.tutor?.number,
            v.tutor?.complement,
            v.tutor?.district,
            v.tutor?.city,
            v.tutor?.state,
          ]
            .filter(Boolean)
            .join(', '),
        })),
        patient: this.sharedService.captureGroup(elem.patient, v => ({
          id: v.id,
          name: v.name,
          race: v.patientAnimal.race,
          tag: v.tag ?? null,
          gender: v.gender ?? null,
          castrated: v?.patientAnimal?.castrated ?? null,
        })),
        budget: this.sharedService.captureGroup(elem.budget, v => ({
          id: v.id,
          tag: v.tag,
          budgetDate: v.budgetDate,
        })),
        payments: elem.payments.map(inner => ({
          id: inner.id,
          block: inner.block,
          qtyInstallments: inner.qtyInstallments,
          totalValue: inner.totalValue,
          installments: inner.installments,
          epxirationDate: inner.expirationDate,
          nsuDocument: inner.nsuDocument,

          paymentMethod: this.sharedService.captureGroup(
            inner.paymentMethod,
            v => ({
              id: v.id,
              description: v.description,
            }),
          ),
          flag: this.sharedService.captureGroup(inner.flag, v => ({
            id: v.id,
            description: v.description,
          })),
        })),
        items: elem.items.map(inner => ({
          id: inner.id,
          quantity: inner.quantity,
          costValue: inner.costValue,
          saleValue: inner.saleValue,
          discountValue: inner.discountValue,
          totalValue: inner.totalValue,
          product: {
            description: inner.productVariation.product.description ?? null,
            type: inner.productVariation.product.type ?? null,
            subgroup: this.sharedService.captureGroup(
              inner.productVariation.product?.subgroup,
              v => ({ id: v.id, description: v.description }),
            ),
          },
        })),
      }))
      .sort((a, b) => {
        if (a.group.name.localeCompare(b.group.name) !== 0) {
          return a.group.name.localeCompare(b.group.name);
        }

        if (a.unit.identification.localeCompare(b.unit.identification) !== 0) {
          return a.unit.identification.localeCompare(b.unit.identification);
        }

        return (
          a.billDate.toJSDate().getTime() - b.billDate.toJSDate().getTime()
        );
      });
  }

  async entriesReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      businessUnit?: string;
    },
  ) {
    const qb = Finance.query()
      .preload('unit')
      .where('economic_group_id', authCtx.group.id);

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    if (data.fromDate) {
      qb.whereRaw('expiration_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('expiration_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    const result = await qb;

    const unitsSet = new Set<string>(result.map(r => r.unit.id));
    const uniqueUnitIds = Array.from(unitsSet);
    const units = uniqueUnitIds
      .map(elem => result.find(r => r.unit.id === elem)?.unit)
      .filter(Boolean) as BusinessUnit[];

    return units.map(elem => ({
      id: elem.id,
      identification: elem.identification ?? '-',
      credits: result
        .filter(r => r.business_unit_id === elem.id && r.type === FinanceType.C)
        .map(r => r.totalValue)
        .reduce((a, b) => a + b, 0),
      debits: result
        .filter(r => r.business_unit_id === elem.id && r.type === FinanceType.D)
        .map(r => r.totalValue)
        .reduce((a, b) => a + b, 0),
    }));
  }

  async budgetsReport(
    authCtx: AuthContext,
    data: {
      fromBudgetDate?: string;
      toBudgetDate?: string;
      fromExpirationDate?: string;
      toExpirationDate?: string;
      fromFinishedDate?: string;
      toFinishedDate?: string;
      clientName?: string;
      patientName?: string;
      businessUnit?: string;
      status?: string;
    },
  ) {
    const qb = Budget.query()
      .preload('unit')
      .preload('client')
      .preload('patient')
      .preload('user')
      .preload('seller')
      .preload('conclusionUser')
      .preload('cancelationReason')
      .where('economic_group_id', authCtx.group.id)
      .whereNull('deleted_at');

    if (data.businessUnit) {
      qb.where('business_unit_id', data.businessUnit);
    }

    if (data.patientName) {
      qb.andWhereHas('patient', query => {
        query.whereILike('name', `%${data.patientName!}%`);
      });
    }

    if (data.clientName) {
      qb.andWhereHas('client', query => {
        query.whereILike('name', `%${data.clientName!}%`);
      });
    }

    if (data.fromBudgetDate) {
      qb.whereRaw('budget_date::date >= ?', [
        DateTime.fromISO(data.fromBudgetDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toBudgetDate) {
      qb.whereRaw('budget_date::date <= ?', [
        DateTime.fromISO(data.toBudgetDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.fromExpirationDate) {
      qb.whereRaw('expiration_date::date >= ?', [
        DateTime.fromISO(data.fromExpirationDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toExpirationDate) {
      qb.whereRaw('expiration_date::date <= ?', [
        DateTime.fromISO(data.toExpirationDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.fromFinishedDate) {
      qb.whereRaw('finished_at::date >= ?', [
        DateTime.fromISO(data.fromFinishedDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toFinishedDate) {
      qb.whereRaw('finished_at::date <= ?', [
        DateTime.fromISO(data.toFinishedDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    const result = await qb;

    return result.map(elem => ({
      id: elem.id,
      tag: elem.tag,
      budgetDate: elem.budgetDate,
      expirationDate: elem.expirationDate,
      finishedDate: elem.finishedAt,
      productValue: elem.productValue,
      serviceValue: elem.serviceValue,
      discountValue: elem.discountValue,
      totalValue: elem.totalValue,
      status: elem.status,
      unit: {
        id: elem.unit.id,
        identification: elem.unit.identification,
      },
      client: this.sharedService.captureGroup(elem.client, v => ({
        id: v.id,
        name: v.name,
      })),
      patient: this.sharedService.captureGroup(elem.patient, v => ({
        id: v.id,
        name: v.name,
      })),
      seller: this.sharedService.captureGroup(elem.seller, v => ({
        id: v.id,
        name: v.name,
      })),
      conclusionUser: this.sharedService.captureGroup(
        elem.conclusionUser,
        v => ({
          id: v.id,
          name: v.name,
        }),
      ),
      reason: this.sharedService.captureGroup(elem.cancelationReason, v => ({
        id: v.id,
        description: v.reason,
      })),
    }));
  }

  async schedulingReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      holder?: string;
      patient?: string;
      businessUnits?: string[];
      economicGroups?: string[];
      businessStates?: string[];
      businessCities?: string[];
    },
  ) {
    const qb = Schedule.query()
      .preload('businessUnit', query => {
        query.preload('economicGroup');
      })
      .preload('cancellationUser')
      .preload('serviceType')
      .preload('serviceStatus')
      .preload('holder', query => {
        query.preload('tutor', query => {
          query.preload('profession');
          query.preload('clientOrigin');
        });
      })
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.preload('specie');
          });
        });
      });

    if (
      data.economicGroups &&
      Array.isArray(data.economicGroups) &&
      data.economicGroups.length > 0
    ) {
      qb.whereHas('businessUnit', query => {
        query.whereIn('economic_group_id', data.economicGroups ?? []);
      });
    } else {
      qb.whereHas('businessUnit', query => {
        query.where('economic_group_id', authCtx.group.id);
      });
    }

    if (
      data.businessUnits &&
      Array.isArray(data.businessUnits) &&
      data.businessUnits.length > 0
    ) {
      qb.whereIn('business_unit_id', data.businessUnits);
    } else {
      qb.where('business_unit_id', authCtx.unit.id);
    }

    const withBusinessStates =
      data.businessStates &&
      Array.isArray(data.businessStates) &&
      data.businessStates.length > 0;
    const withBusinessCities =
      data.businessCities &&
      Array.isArray(data.businessCities) &&
      data.businessCities.length > 0;
    if (withBusinessStates || withBusinessCities) {
      qb.whereHas('businessUnit', query => {
        if (withBusinessStates) {
          query.whereIn('state', data.businessStates ?? []);
        }

        if (withBusinessCities) {
          query.whereIn('city', data.businessCities ?? []);
        }
      });
    }
    if (data.fromDate) {
      qb.whereRaw('start_hour::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('start_hour::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.status) {
      qb.where('schedule_status_id', data.status);
    }

    if (data.holder) {
      qb.where('holder_id', data.holder);
    }

    if (data.patient) {
      qb.where('patient_id', data.patient);
    }

    const result = await qb;

    return result
      .map(elem => ({
        id: elem.id,
        startHour: elem.startHour,
        endHour: elem.endHour,
        duration: elem.endHour.diff(elem.startHour).minutes,
        finishedAt: elem.finishedAt,
        deletedAt: elem.deletedAt,
        cancelledAt: elem.cancellation_user_id ? elem.updatedAt : null,
        hasReturn: !!elem.scheduleReturnId,
        isReturn: !!elem.scheduleOriginId,
        type: elem.onDuty ? 'Plantão / Avulso' : 'Normal',

        group: {
          id: elem.businessUnit.economicGroup.id,
          name: elem.businessUnit.economicGroup.companyName,
        },
        unit: {
          id: elem.businessUnit.id,
          identification: elem.businessUnit.identification ?? '-',
          city: elem.businessUnit.city,
          state: elem.businessUnit.state,
        },
        cancellationUser: this.sharedService.captureGroup(
          elem.cancellationUser,
          v => ({
            id: v.id,
            name: v.name,
          }),
        ),
        serviceType: this.sharedService.captureGroup(elem.serviceType, v => ({
          id: v.id,
          description: v.description,
        })),
        serviceStatus: this.sharedService.captureGroup(
          elem.serviceStatus,
          v => ({
            id: v.id,
            description: v.description,
          }),
        ),
        holder: this.sharedService.captureGroup(elem.holder, v => ({
          id: v.id,
          name: v.name,
          tag: v.tag,
          gender: v.gender,
          profession: v.tutor?.profession?.description ?? null,
          origin: v.tutor?.clientOrigin?.description ?? null,
          document: v.tutor?.document ?? null,
          cellphone: v.tutor?.cellphone ?? null,
          createdAt: v.createdAt,
          address: [
            v.tutor?.postalCode,
            v.tutor?.street,
            v.tutor?.number,
            v.tutor?.complement,
            v.tutor?.district,
            v.tutor?.city,
            v.tutor?.state,
          ]
            .filter(Boolean)
            .join(', '),
        })),
        patient: this.sharedService.captureGroup(elem.patient, v => ({
          id: v.id,
          name: v.name,
          race: v.patientAnimal.race,
          tag: v.tag ?? null,
          gender: v.gender ?? null,
          castrated: v?.patientAnimal?.castrated ?? null,
        })),
      }))
      .sort((a, b) => {
        if (a.group.name.localeCompare(b.group.name) !== 0) {
          return a.group.name.localeCompare(b.group.name);
        }

        if (a.unit.identification.localeCompare(b.unit.identification) !== 0) {
          return a.unit.identification.localeCompare(b.unit.identification);
        }

        return (
          a.startHour.toJSDate().getTime() - b.startHour.toJSDate().getTime()
        );
      });
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

    const result = Object.fromEntries(dataSet.entries());
    const keys = Object.keys(result).sort();

    return keys.map(k => ({
      [k]: result[k],
    }));
  }
}
