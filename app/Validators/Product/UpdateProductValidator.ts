import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { ProductIcmsOrigin, ProductType } from 'App/Models/Product';

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    type: schema.enum(Object.values(ProductType), []),
    referenceCode: schema.string.optional({}, []),
    collectionYear: schema.number.optional([rules.unsigned()]),
    ncm: schema.string.optional({}, []),
    cest: schema.string.optional({}, []),
    features: schema.string.optional({}, []),
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
