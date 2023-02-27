import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';

export default class CreateServiceValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    description: schema.string({}, []),
    referenceCode: schema.string.optional({}, []),
    subgroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'subgroups',
        column: 'id',
      }),
    ]),
    features: schema.string.optional({}, []),
    taxationGroupId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'taxation_groups',
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
    price: schema.object().members({
      maximumDiscountPercentage: schema.number([rules.unsigned()]),
      maximumDiscountValue: schema.number([rules.unsigned()]),
      price: schema.number([rules.unsigned()]),
      costPrice: schema.number.optional([rules.unsigned()]),
      profitMargin: schema.number.optional([rules.unsigned()]),
      commission: schema.number([rules.unsigned()]),
      meta: schema.number([rules.unsigned()]),
      metaType: schema.enum(Object.values(BusinessUnitProductMetaType)),
      commissionMeta: schema.number([rules.unsigned()]),
    }),
  });

  public messages: CustomMessages = {};
}
