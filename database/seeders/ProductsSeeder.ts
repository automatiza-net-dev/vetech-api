import Database from '@ioc:Adonis/Lucid/Database';
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Brand from 'App/Models/Brand';
import EconomicGroup from 'App/Models/EconomicGroup';
import Product, { ProductType } from 'App/Models/Product';
import Subgroup from 'App/Models/Subgroup';
import Unit from 'App/Models/Unit';
import { v4 } from 'uuid';

import raw from './products.json';

export default class extends BaseSeeder {
  public async run() {
    const units = await Unit.all();
    const brands = await Brand.all();
    const subgroups = await Subgroup.all();

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

      const pData: Array<Partial<Product>> = raw.map(elem => {
        const unit = units.find(
          u => u.tag.toLowerCase() === elem.Unidade.toLowerCase(),
        );
        const brand = brands.find(
          u => u.description.toLowerCase() === elem.brands.toLowerCase(),
        );
        const subgroup = subgroups.find(
          u => u.description.toLowerCase() === elem.subgroups.toLowerCase(),
        );

        if (!unit) {
          throw new Error(
            `Unidade ${elem.Unidade} não encontrada para o produto ${elem.Produto}`,
          );
        }
        if (!brand) {
          throw new Error(
            `Marca ${elem.brands} não encontrada para o produto ${elem.Produto}`,
          );
        }
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
          cest: elem.CEST,
          unit_id: unit.id,
          icmsOrigin: '0', // TODO correct
          economic_group_id: economicGroup.id,
          subgroup_id: subgroup.id,
          brand_id: brand.id,
        };
      });

      const products = await Product.createMany(pData, { client: trx });
    });
  }
}
