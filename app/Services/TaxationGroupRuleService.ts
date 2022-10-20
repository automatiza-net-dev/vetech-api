import { inject } from '@adonisjs/fold';
import TaxationGroup from 'App/Models/TaxationGroup';
import TaxationGroupRule from 'App/Models/TaxationGroupRule';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import ITaxationGroupRuleData from 'Contracts/interfaces/ITaxationGroupRuleData';

@inject()
export default class TaxationGroupRuleService {
  constructor(private sharedService: SharedService) {}

  public async index(unitId: string, user: User) {
    const group = await this.sharedService.getUserGroup(unitId);
    const isSudo = await this.sharedService.isSuperAdmin(user);

    const query = TaxationGroupRule.query()
      .preload('taxationGroup')
      .preload('taxOperation');

    if (!isSudo) {
      const groups = await TaxationGroup.query()
        .select('id')
        .where('economic_group_id', group.id);

      query.whereIn(
        'taxation_group_id',
        groups.map(g => g.id),
      );
    }

    return query;
  }

  public async store(data: Omit<ITaxationGroupRuleData, 'active'>) {
    const rule = await TaxationGroupRule.create({
      companyType: data.companyType,
      movementType: data.movementType,
      movementCategory: data.movementCategory,
      fromUf: data.fromUf,
      toUf: data.toUf,
      icmsCst: data.icmsCst,
      icmsPerc: data.icmsPerc,
      icmsPercRedAliquota: data.icmsPercRedAliquota,
      icmsPercRedBaseCalculo: data.icmsPercRedBaseCalculo,
      ivaIcmsSt: data.ivaIcmsSt,
      fcpPerc: data.fcpPerc,
      taxBenefitCode: data.taxBenefitCode,
      ipiCst: data.ipiCst,
      ipiPerc: data.ipiPerc,
      pisCst: data.pisCst,
      cofinsCst: data.cofinsCst,
      active: true,
      icmsPercDiferimento: data.icmsPercDiferimento,
      icmsPercRedBaseCalculoST: data.icmsPercRedBaseCalculoST,
      pisPerc: data.pisPerc,
      cofinsPerc: data.cofinsPerc,
      tax_operation_id: data.taxOperationId,
      taxation_group_id: data.taxationGroupId,
    });

    return rule;
  }

  public async show(unitId: string, user: User, id: string) {
    const group = await this.sharedService.getUserGroup(unitId);
    const isSudo = await this.sharedService.isSuperAdmin(user);

    const rule = await TaxationGroupRule.query()
      .preload('taxationGroup')
      .preload('taxOperation')
      .where('id', id)
      .first();

    if (!rule) {
      throw this.sharedService.ResourceNotFound();
    }

    if (!isSudo) {
      if (
        rule.taxationGroup.economic_group_id &&
        rule.taxationGroup.economic_group_id !== group.id
      ) {
        throw this.sharedService.ResourceNotFound();
      }
    }

    return rule;
  }

  public async update(
    unitId: string,
    user: User,
    id: string,
    data: ITaxationGroupRuleData,
  ) {
    const rule = await this.show(unitId, user, id);

    rule.merge({
      companyType: data.companyType,
      movementType: data.movementType,
      movementCategory: data.movementCategory,
      fromUf: data.fromUf,
      toUf: data.toUf,
      icmsCst: data.icmsCst,
      icmsPerc: data.icmsPerc,
      icmsPercRedAliquota: data.icmsPercRedAliquota,
      icmsPercRedBaseCalculo: data.icmsPercRedBaseCalculo,
      ivaIcmsSt: data.ivaIcmsSt,
      fcpPerc: data.fcpPerc,
      taxBenefitCode: data.taxBenefitCode,
      ipiCst: data.ipiCst,
      ipiPerc: data.ipiPerc,
      pisCst: data.pisCst,
      cofinsCst: data.cofinsCst,
      active: data.active,
      icmsPercDiferimento: data.icmsPercDiferimento,
      icmsPercRedBaseCalculoST: data.icmsPercRedBaseCalculoST,
      pisPerc: data.pisPerc,
      cofinsPerc: data.cofinsPerc,
      tax_operation_id: data.taxOperationId,
      taxation_group_id: data.taxationGroupId,
    });

    return rule.save();
  }

  public async destroy(unitId: string, user: User, id: string) {
    const rule = await this.show(unitId, user, id);

    await rule.softDelete();
  }
}
