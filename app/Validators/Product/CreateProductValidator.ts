import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
import { BusinessUnitProductMetaType } from 'App/Models/BusinessUnitProduct';
import { ProductType } from 'App/Models/Product';

export default class CreateProductValidator {
  constructor(protected ctx: HttpContextContract) {}

  private price = schema.object().members({
    maximumStock: schema.number([rules.unsigned()]),
    minimumStock: schema.number([rules.unsigned()]),
    maximumDiscountPercentage: schema.number([rules.unsigned()]),
    maximumDiscountValue: schema.number([rules.unsigned()]),
    price: schema.number([rules.unsigned()]),
    costPrice: schema.number([rules.unsigned()]),
    profitMargin: schema.number([rules.unsigned()]),
    commission: schema.number([rules.unsigned()]),
    meta: schema.number([rules.unsigned()]),
    metaType: schema.enum(Object.values(BusinessUnitProductMetaType)),
    commissionMeta: schema.number([rules.unsigned()]),
  });

  public schema = schema.create({
    description: schema.string({}, []),
    type: schema.enum(Object.values(ProductType), []),
    referenceCode: schema.string({}, []),
    collectionYear: schema.number([rules.unsigned()]),
    ncm: schema.string.optional({}, []),
    cest: schema.string.optional({}, []),
    features: schema.string.optional({}, []),
    unitId: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'units',
        column: 'id',
      }),
    ]),
    variationGroup: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'variation_groups',
        column: 'id',
      }),
    ]),
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
    variations: schema.array().members(
      schema.object().members({
        barcode: schema.string({}),
        price: this.price,
        variation_options: schema.array().members(schema.string()),
        specificPrice: schema.array.optional([rules.minLength(1)]).members(
          schema.object().members({
            business: schema.string({}, [
              rules.uuid(),
              rules.exists({
                table: 'business_units',
                column: 'id',
              }),
            ]),
            price: this.price,
          }),
        ),
      }),
    ),
  });

  public messages: CustomMessages = {};
}
