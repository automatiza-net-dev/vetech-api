import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { ProductIcmsOrigin, ProductPurpose } from 'App/Models/Product';

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    referenceCode: schema.string.optional({}, []),
    collectionYear: schema.number.optional([rules.unsigned()]),
    ncm: schema.string.optional({}, []),
    cest: schema.string.optional({}, []),
    features: schema.string.optional({}, []),
    taxBenefitCode: schema.string.optional({}, []),
    anvisaCode: schema.string.optional({}, []),
    purpose: schema.enum(Object.values(ProductPurpose)),
    active: schema.boolean([]),
    groupId: schema.string.optional({}, [
      rules.uuid(),
      rules.exists({
        table: 'groups',
        column: 'id',
      }),
    ]),
    subgroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    unitId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),
    taxationGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'taxation_groups',
        column: 'id',
      }),
    ]),
    icmsOrigin: schema.enum(Object.values(ProductIcmsOrigin), []),
  });

  public messages: CustomMessages = {};
}
