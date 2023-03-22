import Database from '@ioc:Adonis/Lucid/Database';
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Brand from 'App/Models/Brand';
import EconomicGroup from 'App/Models/EconomicGroup';
import Product, { ProductType } from 'App/Models/Product';
import Subgroup from 'App/Models/Subgroup';
import TaxationGroup from 'App/Models/TaxationGroup';
import Unit from 'App/Models/Unit';
import { v4 } from 'uuid';

import raw from './products.json';

export default class extends BaseSeeder {
  parseString = (value: string) => {
    return value.replace(',', '.').replaceAll('.', '');
  };

  parseNumber = (value: string) => {
    return parseFloat(this.parseString(value));
  };

  public async run() {
    const units = await Unit.all();
    const brands = await Brand.all();
    const subgroups = await Subgroup.all();
    const taxGroups = await TaxationGroup.all();

    await Database.transaction(async trx => {
      const economicGroup = await EconomicGroup.create(
        {
          id: v4(),
          document: 'some document',
          responsibleEmail: 'some email',
          responsiblePhone: 'some phone',
        },
        {
          client: trx,
        },
      );

      const newBusinessUnit = await economicGroup
        .related('businessUnits')
        .create(
          {
            id: v4(),
            companyName: `Clínica do(a)`,
            document: 'some document',
            phone: 'some phone',
            email: 'some email',
            origin: 'CADASTRO SELF-SERVICE',
          },
          {
            client: trx,
          },
        );

      const pData: Array<Partial<Product>> = raw.map(elem => {
        const unit = units.find(
          u => u.tag.toLowerCase() === elem.Unidade?.toLowerCase(),
        );
        const brand = brands.find(
          u => u.description.toLowerCase() === elem.brands?.toLowerCase(),
        );
        const subgroup = subgroups.find(
          u => u.description.toLowerCase() === elem.subgroups?.toLowerCase(),
        );
        const taxGroup = taxGroups.find(
          u => u.name.toLowerCase() === elem['Grupo Tributacao'].toLowerCase(),
        );

        if (!unit) {
          throw new Error(
            `Unidade ${elem.Unidade} não encontrada para o produto ${elem.Produto}`,
          );
        }
        // if (!brand) {
        //   throw new Error(
        //     `Marca ${elem.brands} não encontrada para o produto ${elem.Produto}`,
        //   );
        // }
        if (!subgroup) {
          throw new Error(
            `Subgrupo ${elem.subgroups} não encontrada para o produto ${elem.Produto}`,
          );
        }

        return {
          description: elem.Produto,
          type:
            elem.Tipo === 'Produto' ? ProductType.PRODUCT : ProductType.SERVICE,
          referenceCode: elem.Código.toString(),
          ncm: elem['Código NCM'] ? elem['Código NCM'].toString() : undefined,
          cest: elem?.CEST?.toString() ?? undefined,
          unit_id: unit.id,
          icmsOrigin: '0', // TODO correct
          economic_group_id: economicGroup.id,
          subgroup_id: subgroup.id,
          brand_id: brand?.id,
          anvisaCode: elem['Código ANVISA']?.toString() ?? undefined,
          taxation_group_id: taxGroup?.id,
        };
      });

      const products = await Product.createMany(pData, { client: trx });
      const variationsPromises = products.map(product => {
        const rawProduct = raw.find(
          p => p['Código'].toString() === product.referenceCode,
        );

        if (!rawProduct) {
          throw new Error(
            `Produto ${product.referenceCode} não encontrou para o raw product`,
          );
        }

        return product.related('variations').create(
          {
            barcode: rawProduct['Código Barra']?.toString() ?? undefined,
          },
          {
            client: trx,
          },
        );
      });
      const variations = await Promise.all(variationsPromises);

      const unitProducts = products.map(product => {
        const rawProduct = raw.find(
          p => p['Código'].toString() === product.referenceCode,
        );

        if (!rawProduct) {
          throw new Error(
            `Produto ${product.referenceCode} não encontrou para o raw product`,
          );
        }

        const variation = variations.find(v => v.product_id === product.id);
        if (!variation) {
          throw new Error(
            `Variação não encontrada para produto ${product.referenceCode}`,
          );
        }

        return variation.related('businessUnitProducts').create(
          {
            businness_unit_id: newBusinessUnit.id,
            stock: 0,
            maximumStock: rawProduct['Máximo'] ?? 0,
            minimumStock: rawProduct?.Minimo ?? 0,
            maximumDiscountPercentage: 0,
            maximumDiscountValue: 0,
            price: rawProduct.Venda
              ? this.parseNumber(rawProduct.Venda)
              : undefined,
            costPrice: rawProduct.Custo
              ? this.parseNumber(rawProduct.Custo)
              : undefined,
            profitMargin: 0,
            commission: 0,
            meta: 0,
            metaType: undefined,
            commissionMeta: 0,
          },
          {
            client: trx,
          },
        );
      });
      await Promise.all(unitProducts);

      throw new Error('dont commit trx');
    });
  }
}
