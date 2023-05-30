import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { ProductIcmsOrigin, ProductPurpose } from 'App/Models/Product';

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) { }

  public schema = schema.create({
    description: schema.string({}, []),
    referenceCode: schema.string.optional({}, []),
    collectionYear: schema.number.optional([rules.unsigned()]),
    subgroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    purpose: schema.enum(Object.values(ProductPurpose)),

    features: schema.string.optional({}, []),

    taxationGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'taxation_groups',
        column: 'id',
      }),
    ]),
    icmsOrigin: schema.enum(Object.values(ProductIcmsOrigin), []),
    ncm: schema.string.optional({}, []),
    cest: schema.string.optional({}, []),
    unitId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),

    taxBenefitCode: schema.string.optional({}, []),
    anvisaCode: schema.string.optional({}, []),
    active: schema.boolean([]),
    groupId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'groups',
        column: 'id',
      }),
    ]),
  });

  public messages: CustomMessages = {};
}
