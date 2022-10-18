import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  CompanyType,
  COMPLETE_ICMS,
  IPI_CST,
  MovementCategory,
  MovementType,
  PIS_CST__COFINS_CST,
} from 'App/Models/TaxationGroupRule';

export default class CreateTaxationGroupRuleValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    companyType: schema.enum(Object.values(CompanyType)),
    movementType: schema.enum(Object.values(MovementType)),
    movementCategory: schema.enum(Object.values(MovementCategory)),
    fromUf: schema.string(),
    toUf: schema.string(),
    icmsCst: schema.enum(Object.values(COMPLETE_ICMS)),
    icmsPerc: schema.number(),
    icmsPercRedAliquota: schema.number(),
    icmsPercRedBaseCalculo: schema.number(),
    ivaIcmsSt: schema.number(),
    fcpPerc: schema.number(),
    taxBenefitCode: schema.string(),
    ipiCst: schema.enum(Object.values(IPI_CST)),
    ipiPerc: schema.number(),
    pisCst: schema.enum(Object.values(PIS_CST__COFINS_CST)),
    pisPerc: schema.number(),
    cofinsCst: schema.enum(Object.values(PIS_CST__COFINS_CST)),
    cofinsPerc: schema.number(),
    taxationGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'taxation_groups', column: 'id' }),
    ]),
    taxOperationId: schema.string({}, [
      rules.uuid(),
      rules.exists({ table: 'tax_operations', column: 'id' }),
    ]),
  });

  public messages: CustomMessages = {};
}
