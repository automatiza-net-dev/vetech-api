import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import { CustomMessages, rules, schema } from '@ioc:Adonis/Core/Validator';
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
  });

  public schema = schema.create({
    description: schema.string({}, []),
    type: schema.enum(Object.values(ProductType), []),
    referenceCode: schema.string({}, []),
    collectionYear: schema.number([rules.unsigned()]),
    ncm: schema.string({}, []),
    cest: schema.string({}, []),
    features: schema.string({}, []),
    unityType: schema.string({}, []),
    group: schema.string({}, [
      rules.uuid(),
      rules.exists({
        table: 'variation_groups',
        column: 'id',
      }),
    ]),
    variations: schema.array().members(
      schema.object().members({
        barcode: schema.string({}),
        price: this.price,
        variation_options: schema.array().members(schema.string()),
        specificPrice: schema.array().members(
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
