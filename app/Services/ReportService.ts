import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import Bill, { BillStatus } from 'App/Models/Bill';
import Budget from 'App/Models/Budget';
import BusinessUnit from 'App/Models/BusinessUnit';
import CheckingAccount from 'App/Models/CheckingAccount';
import Finance, { FinanceStatus, FinanceType } from 'App/Models/Finance';
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
      businessUnits?: string[];
      economicGroups?: string[];
    },
  ) {
    const qb = Finance.query()
      .preload('client')
      .preload('checkingAccount')
      .preload('paymentMethod')
      .preload('accountPlan')
      .preload('unit', query => {
        query.preload('economicGroup', query => {
          query.preload('system');
        });
      });

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

    if (data.businessUnits && Array.isArray(data.businessUnits)) {
      qb.whereIn('business_unit_id', data.businessUnits);
    }

    if (data.economicGroups && Array.isArray(data.economicGroups)) {
      qb.whereIn('economic_group_id', data.economicGroups);
    } else {
      qb.where('economic_group_id', authCtx.group.id);
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
      discountValue: elem.discountValue,
      feeValue: elem.feeValue,
      paymentValue: elem.paymentValue,
      nsuDocument: elem.nsuDocument,
      status: elem.status,
      qtyInstallments: elem.qtyInstallments,
      installment: elem.installment,
      originFlag: elem.originFlag,
      historic: elem.historic,

      system: this.sharedService.captureGroup(
        elem.unit?.economicGroup?.system,
        v => ({
          id: v.id,
          name: v.name,
        }),
      ),
      unit: this.sharedService.captureGroup(elem.unit, v => ({
        id: v.id,
        identification: v.identification,
        city: v.city,
        state: v.state,
      })),
      client: this.sharedService.captureGroup(elem.client, v => ({
        id: v.id,
        name: v.name,
      })),
      checkingAccount: this.sharedService.captureGroup(
        elem.checkingAccount,
        v => ({
          id: v.id,
          description: v.description,
        }),
      ),
      paymentMethod: this.sharedService.captureGroup(elem.paymentMethod, v => ({
        id: v.id,
        description: v.description,
      })),
      accountPlan: this.sharedService.captureGroup(elem.accountPlan, v => ({
        id: v.id,
        description: v.description,
      })),
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
      if (!key) {
        return;
      }

      if (!dataSet.has(key)) {
        dataSet.set(key, 0);
      }

      const entry = dataSet.get(key);
      dataSet.set(key, (entry ?? 0) + r.balance);
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
          query.preload('profession');
        });
      })
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.select('id', 'description', 'specie_id');
            query.preload('specie', query => {
              query.select('id', 'description');
            });
          });
        });
      })
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
          document: v.tutor?.document ?? null,
          profession: v.tutor?.profession?.description ?? null,
          postalCode: v.tutor?.postalCode ?? null,
          street: v.tutor?.street ?? null,
          number: v.tutor?.number ?? null,
          complement: v.tutor?.complement ?? null,
          district: v.tutor?.district ?? null,
          city: v.tutor?.city ?? null,
          state: v.tutor?.state ?? null,
          createdAt: v.createdAt,
        })),
        patient: this.sharedService.captureGroup(elem.patient, v => ({
          id: v.id,
          name: v.name,
          tag: v.tag,
          birthDate: v.birthDate,
          race: v.patientAnimal?.race ?? null,
          gender: v.gender ?? null,
          castrated: v?.patientAnimal?.castrated ?? null,
          weight: v?.weight ?? null,
          vaccineOrigin: v?.vaccineOrigin ?? null,
          death: v?.patientAnimal?.death ?? null,
          deathDate: v?.patientAnimal?.deathDate ?? null,
          createdAt: v.createdAt,
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
    _authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      client?: string;
      patient?: string;
      businessUnit?: string;
    },
  ) {
    const qb = Database.from('bills')
      .select(
        Database.raw(`
        systems.name                                                            as Sistema,
       economic_groups.company_name                                            as Grupo,
       business_units.city                                                     as Cidade,
       business_units.state                                                    as UF,
       bills.bill_date::Date                                                   as data_Venda,
       bills.bill_date::time                                                   as hora_Venda,
       bills.tag                                                               as Codigo_Venda,
       users."name"                                                            as vendedor,
       bills.service_value                                                     as total_Servicos_Venda,
       bills.product_value                                                     as Total_Produtos_Venda,
       bills.discount_value                                                    as total_Desconto_Venda,
       bills.total_value                                                       as Total_Venda,
       bills.paid_value                                                        as Total_Pago_Venda,
       (bills.total_value - bills.paid_value)                                  as Total_Em_Aberto_Venda,
       CliTu.created_at::date                                                  as data_Cadastro_Cliente,
       Cli."name"                                                              as nomeCliente,
       CliTu.document                                                          as cpfCnpj,
       CliTu.cellphone,
       client_origins.description                                              as Origem_Cliente,
       professions.description                                                 as profissao_Cliente,
       CliTu.postal_code                                                       as cep_Cliente,
       CliTu.street                                                            as endereço_Cliente,
       CliTu.number                                                            as numero_Endereco_Cliente,
       CliTu.complement                                                        as complemento_Endereco_Cliente,
       CliTu.district                                                          as bairro_Cliente,
       CliTu.city                                                              as cidade_Cliente,
       CliTu.state                                                             as uf_Cliente,
       Dep."name"                                                              as Dependente,
       Dep.tag                                                                 as dependente_RG,
       Dep.birth_date                                                          as data_Nasc_Dep,
       Dep.gender                                                              as genero_Dep,
       species.description                                                     as especie_Dep,
       races.description                                                       as raca_Dep,
       case when CliDep.castrated = true then 'Sim' else 'Não' end             as castrado_Dep,
       Cli.vaccine_origin                                                      as vacinado_Dep,
       Dep.weight,
       case when CliDep.death = true then 'Sim' else 'Não' end                 as obito_Dep,
       case when CliDep.death = true then CliDep.death_date else null end      as data_Obito_Dep,
       case when products."type" = 'product' then 'Produto' else 'Serviço' end as tipo_Item,
       subgroups.description                                                   as subGrupo_Item,
       products.description                                                    as descricao_Item,
       bill_items.quantity                                                     as qtd_Item,
       bill_items.unitary_value                                                as valor_Unitario_Item,
       (bill_items.quantity * bill_items.unitary_value)                        as valor_Bruto_Item,
       bill_items.discount_value                                               as valor_Desconto_Item,
       bill_items.total_value                                                  as valor_Liquido_Item
        `),
      )
      .joinRaw(
        `join bill_items on bills.id = bill_items.bill_id AND bill_items.status <> 'INATIVA'`,
      )
      .joinRaw(
        `join product_variations on bill_items.product_variation_id = product_variations.id`,
      )
      .joinRaw(
        `join (products join subgroups on products.subgroup_id = subgroups.id)
        on product_variations.product_id = products.id`,
      )
      .joinRaw(
        `JOIN business_units ON bills.business_unit_id = business_units."id"`,
      )
      .joinRaw(
        `JOIN economic_groups ON business_units.economic_group_id = economic_groups."id"`,
      )
      .joinRaw(`JOIN systems ON economic_groups.system_id = systems."id"`)
      .joinRaw(`JOIN patients Cli ON bills.client_id = Cli."id"`)
      .joinRaw(
        `JOIN (patient_tutors CliTu left join professions on CliTu.profession_id = professions.id)
        ON Cli."id" = CliTu.patient_id`,
      )
      .joinRaw(
        `LEFT JOIN (patients Dep JOIN (patient_animals CliDep join races on cliDep.race_id = races.id join species
          on races.specie_id = species.id) ON Dep."id" = CliDep.patient_id)
ON bills.patient_id = Dep."id"`,
      )
      .joinRaw(
        `LEFT JOIN client_origins ON CliTu.client_origin_id = client_origins."id"`,
      )
      .joinRaw(`join users on bills.seller_id = users.id`)
      .whereNull('bills.deleted_at')
      .orderByRaw('Cli."name", Dep.tag, bills.bill_date');

    if (data.fromDate) {
      qb.whereRaw('bills.bill_date::date >= ?', [
        DateTime.fromISO(data.fromDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.toDate) {
      qb.whereRaw('bills.bill_date::date <= ?', [
        DateTime.fromISO(data.toDate).toFormat('yyyy-MM-dd'),
      ]);
    }

    if (data.status) {
      qb.where('bills.status', data.status);
    }

    if (data.client) {
      qb.where('bills.client_id', data.client);
    }

    if (data.patient) {
      qb.where('bills.patient_id', data.patient);
    }

    if (data.businessUnit) {
      qb.where('bills.business_unit_id', data.businessUnit);
    }

    return qb;
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
      .preload('client', query => {
        query.preload('tutor', query => {
          query.preload('clientOrigin');
          query.preload('profession');
        });
      })
      .preload('patient', query => {
        query.preload('patientAnimal', query => {
          query.preload('race', query => {
            query.select('id', 'description', 'specie_id');
            query.preload('specie', query => {
              query.select('id', 'description');
            });
          });
        });
      })
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
      observation: elem.observation,
      canceledObservation: elem.canceledObservation,
      unit: {
        id: elem.unit.id,
        identification: elem.unit.identification,
        city: elem.unit.city,
        state: elem.unit.state,
      },
      client: this.sharedService.captureGroup(elem.client, v => ({
        id: v.id,
        name: v.name,
        tag: v.tag,
        cellphone: v.tutor?.cellphone ?? null,
        origin: v.tutor?.clientOrigin?.description ?? null,
        document: v.tutor?.document ?? null,
        profession: v.tutor?.profession?.description ?? null,
        postalCode: v.tutor?.postalCode ?? null,
        street: v.tutor?.street ?? null,
        number: v.tutor?.number ?? null,
        complement: v.tutor?.complement ?? null,
        district: v.tutor?.district ?? null,
        city: v.tutor?.city ?? null,
        state: v.tutor?.state ?? null,
        createdAt: v.createdAt,
      })),
      patient: this.sharedService.captureGroup(elem.patient, v => ({
        id: v.id,
        name: v.name,
        tag: v.tag,
        birthDate: v.birthDate,
        race: v.patientAnimal?.race ?? null,
        gender: v.gender ?? null,
        castrated: v?.patientAnimal?.castrated ?? null,
        weight: v?.weight ?? null,
        vaccineOrigin: v?.vaccineOrigin ?? null,
        death: v?.patientAnimal?.death ?? null,
        deathDate: v?.patientAnimal?.deathDate ?? null,
        createdAt: v.createdAt,
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
      service?: string;
      holder?: string;
      patient?: string;
      businessUnits?: string[];
      economicGroups?: string[];
      businessStates?: string[];
      businessCities?: string[];
    },
  ) {
    const qb = Database.from('schedules')
      .select(
        Database.raw(`
        business_units.identification,
        business_units.city,
        business_units.state,
        uResponsavel.name                                                        as nome_Responsavel,
        to_char(start_hour, 'DD/MM/YYYY')                                        as start_hour_date,
        to_char(start_hour, 'HH24:MI')                                           as start_hour_time,
        to_char(end_hour, 'DD/MM/YYYY')                                          as end_hour_date,
        to_char(end_hour, 'HH24:MI')                                             as end_hour_time,
        schedule_service_types.reserved_minutes,
        schedules.started_at,
        schedules.finished_at,
        extract(epoch from (schedules.finished_at - schedules.started_at)) / 60  as minutos_Duracao_Atendimento,
        schedule_statuses.description                                            as status,
        schedule_service_types.description,
        case
           when schedule_service_types.type = 'A' then 'Agendamento'
           when schedule_service_types.type = 'P' then 'Procedimento'
           when schedule_service_types.type = 'R' then 'Retorno'
           end                                                                  as tipo_Agendamento,
        ucanc.name                                                               as usuario_Cancelamento,
        reasons.reason                                                           as motivo_Cancelamento,
        case
           when schedules.cancellation_user_id is not null then schedules.updated_at
           end                                                                  as data_Cancelamento,
        case when schedules.schedule_return_id is null then 'Nao' else 'Sim' end as tem_Retorno,
        case when schedules.schedule_origin_id is null then 'Nao' else 'Sim' end as e_Retorno,
        tutor.created_at                                                         as dataC_adastro_Tutor,
        tutor.name                                                               as nome_Tutor,
        patient_tutors.document                                                  as cpf_Cnpj_Tutor,
        patient_tutors.cellphone,
        patient_tutors.postal_code,
        patient_tutors.street,
        patient_tutors.number,
        patient_tutors.complement,
        patient_tutors.district,
        patient_tutors.city,
        patient_tutors.state,
        professions.description                                                         as profissao_Tutor,
        client_origins.description                                                           as origem_Tutor,
        pac.name                                                                 as nome_Paciente,
        pac.tag                                                                  as rg_Paciente,
        pac.birth_date                                                           as nasc_Paciente,
        case
           when pac.gender = 'male' then 'macho'
           when pac.gender = 'female' then 'femea'
           else null end                                                        as genero_Paciente,
        species.description                                                      as especie_Paciente,
        races.description                                                        as raca_Paciente,
        case when pa.castrated then 'Sim' else 'Não' end                         as castrado_Paciente,
        pac.weight                                                               as peso_Paciente,
        pac.vaccine_origin                                                       as vacinado,
        case when pa.death then 'Sim' else 'Não' end                             as obito_Paciente,
        case when pa.death then pa.death_date end                                as data_Obito_Paciente
    `),
      )
      .joinRaw(
        `join business_units on schedules.business_unit_id = business_units.id`,
      )
      .joinRaw(
        `join schedule_service_types on schedules.schedule_service_type_id = schedule_service_types.id`,
      )
      .joinRaw(
        `join schedule_statuses on schedules.schedule_status_id = schedule_statuses.id`,
      )
      .joinRaw(
        ` join (patients tutor join
    ((patient_tutors left join professions on patient_tutors.profession_id = professions.id) left join client_origins
     on patient_tutors.client_origin_id = client_origins.id)
               on tutor.id = patient_tutors.patient_id) on schedules.holder_id = tutor.id`,
      )

      .joinRaw(
        `join (patients pac join
    (patient_animals pa join (races join species on races.specie_id = species.id) on pa.race_id = races.id)
               on pac.id = pa.patient_id
    ) on schedules.patient_id = pac.id`,
      )

      .joinRaw(`join users uResponsavel on schedules.user_id = uResponsavel.id`)

      .joinRaw(
        `left join users uCanc on schedules.cancellation_user_id = ucanc.id`,
      )

      .joinRaw(`left join reasons on schedules.reason_id = reasons.id`);

    if (
      data.economicGroups &&
      Array.isArray(data.economicGroups) &&
      data.economicGroups.length > 0
    ) {
      qb.whereIn('business_units.economic_group_id', data.economicGroups);
    } else {
      qb.where('business_units.economic_group_id', authCtx.group.id);
    }

    if (
      data.businessUnits &&
      Array.isArray(data.businessUnits) &&
      data.businessUnits.length > 0
    ) {
      qb.whereIn('business_units.id', data.businessUnits);
    } else {
      qb.where('business_units.id', authCtx.unit.id);
    }

    const withBusinessStates =
      data.businessStates &&
      Array.isArray(data.businessStates) &&
      data.businessStates.length > 0;
    const withBusinessCities =
      data.businessCities &&
      Array.isArray(data.businessCities) &&
      data.businessCities.length > 0;

    if (withBusinessStates) {
      qb.whereIn('business_units.state', data.businessStates ?? []);
    }
    if (withBusinessCities) {
      qb.whereIn('business_units.city', data.businessCities ?? []);
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
      qb.where('schedules.schedule_status_id', data.status);
    }

    if (data.service) {
      qb.where('schedules.schedule_service_type_id', data.service);
    }

    if (data.holder) {
      qb.where('schedules.holder_id', data.holder);
    }

    if (data.patient) {
      qb.where('schedules.patient_id', data.patient);
    }

    return await qb;
  }

  async productTypeReport(
    authCtx: AuthContext,
    data: {
      fromDate?: string;
      toDate?: string;
      status?: string;
      type?: string;
      holder?: string;
      patient?: string;
      businessUnits?: string[];
      economicGroups?: string[];
      businessStates?: string[];
      businessCities?: string[];
    },
  ) {
    const qb1 = Database.from('bills')
      .select(Database.raw('sum(bill_items.total_value) as total_sales'))
      .joinRaw(
        `join business_units on bills.business_unit_id = business_units.id`,
      )
      .joinRaw(`join bill_items on bills.id = bill_items.bill_id`)
      .joinRaw(
        `join product_variations on bill_items.product_variation_id = product_variations.id`,
      )
      .joinRaw(`join products on product_variations.product_id = products.id`)
      .whereNull('bills.deleted_at')
      .whereNot('bills.status', BillStatus.EX);

    const qb2 = Database.from('bills')
      .select(
        Database.raw(
          `
            economic_groups.id as e_id,
            economic_groups.company_name,
            business_units.id as b_id,
            business_units.identification,
            business_units.city,
            business_units.state,
            products.description,
            products.type,
            sum(bill_items.quantity)         as quantity,
            count(distinct bills.id)         as sales,
            count(distinct bills.client_id)  as clients,
            count(distinct bills.patient_id) as patients,
            sum(bill_items.total_value)      as total_value
          `,
        ),
      )
      .groupBy(
        'economic_groups.id',
        'business_units.id',
        'products.id',
        'products.description',
      )
      .joinRaw(
        `join economic_groups on bills.economic_group_id = economic_groups.id`,
      )
      .joinRaw(
        `join business_units on bills.business_unit_id = business_units.id`,
      )
      .joinRaw(`join bill_items on bills.id = bill_items.bill_id`)
      .joinRaw(
        `join product_variations on bill_items.product_variation_id = product_variations.id`,
      )
      .joinRaw(`join products on product_variations.product_id = products.id`)
      .orderByRaw(`sum(bill_items.total_value) desc, products.description`)
      .whereNull('bills.deleted_at')
      .whereNot('bills.status', BillStatus.EX);

    if (data.type) {
      qb1.andWhere('products.type', data.type);
      qb2.andWhere('products.type', data.type);
    }

    if (data.fromDate) {
      qb1.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
      qb2.andWhereRaw('bill_date::date >= ?', [data.fromDate]);
    }

    if (data.toDate) {
      qb1.andWhereRaw('bill_date::date <= ?', [data.toDate]);
      qb2.andWhereRaw('bill_date::date <= ?', [data.toDate]);
    }

    if (data.status) {
      qb1.andWhere('bills.status', data.status);
      qb2.andWhere('bills.status', data.status);
    }

    if (data.holder) {
      qb1.andWhere('bills.client_id', data.holder);
      qb2.andWhere('bills.client_id', data.holder);
    }

    if (data.patient) {
      qb1.andWhere('bills.patient_id', data.patient);
      qb2.andWhere('bills.patient_id', data.patient);
    }

    if (data.businessUnits && Array.isArray(data.businessUnits)) {
      qb1.andWhereIn('bills.business_unit_id', data.businessUnits);
      qb2.andWhereIn('bills.business_unit_id', data.businessUnits);
    } else {
      qb1.andWhereIn('bills.business_unit_id', [authCtx.unit.id]);
      qb2.andWhereIn('bills.business_unit_id', [authCtx.unit.id]);
    }

    if (data.economicGroups && Array.isArray(data.economicGroups)) {
      qb1.andWhereIn('bills.economic_group_id', data.economicGroups);
      qb2.andWhereIn('bills.economic_group_id', data.economicGroups);
    } else {
      qb1.andWhereIn('bills.economic_group_id', [authCtx.group.id]);
      qb2.andWhereIn('bills.economic_group_id', [authCtx.group.id]);
    }

    if (data.businessStates && Array.isArray(data.businessStates)) {
      qb1.andWhereIn('business_units.state', data.businessStates);
      qb2.andWhereIn('business_units.state', data.businessStates);
    }

    if (data.businessCities && Array.isArray(data.businessCities)) {
      qb1.andWhereIn('business_units.city', data.businessCities);
      qb2.andWhereIn('business_units.city', data.businessCities);
    }

    const [{ total_sales = '0' }] = await qb1;
    const parsedTotal = parseFloat(total_sales);

    const result = await qb2;

    return result.map(elem => ({
      group: {
        id: elem.e_id,
        name: elem.company_name,
      },
      unit: {
        id: elem.b_id,
        identification: elem.identification,
        city: elem.city,
        state: elem.state,
      },
      product: {
        description: elem.description,
        type: elem.type,
      },
      quantity: elem.quantity,
      sales: parseInt(elem.sales, 10),
      clients: parseInt(elem.clients, 10),
      patients: parseInt(elem.patients, 10),
      totalValue: elem.total_value,
      percentage: (elem.total_value / parsedTotal) * 100,
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

    const result = Object.fromEntries(dataSet.entries());
    const keys = Object.keys(result).sort();

    return keys.map(k => ({
      [k]: result[k],
    }));
  }
}
