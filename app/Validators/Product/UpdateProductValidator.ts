import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { ProductType } from 'App/Models/Product';

export default class UpdateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    type: schema.enum(Object.values(ProductType), []),
    referenceCode: schema.string({}, []),
    collectionYear: schema.number([rules.unsigned()]),
    ncm: schema.string({}, []),
    cest: schema.string({}, []),
    features: schema.string({}, []),
    unityType: schema.string({}, []),
    active: schema.boolean([]),
    groupId: schema.string({}, [
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
  });

  public messages: CustomMessages = {};
}
