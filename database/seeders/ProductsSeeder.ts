import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Unit from 'App/Models/Unit';

import raw from './products.json';

export default class extends BaseSeeder {
  public async run() {
    const hasd: Record<string, boolean> = {};
    raw.forEach(async r => {
      if (!hasd[r.Unidade]) {
        hasd[r.Unidade] = true;
      }
    });

    const units = await Unit.all();
    Object.keys(hasd).forEach(prod_unit => {
      const unit = units.find(
        e => e.tag.toLowerCase() === prod_unit.toLowerCase(),
      );

      console.log({
        unit: prod_unit,
        has: Boolean(unit),
      });
    });

    // const brands = await Brand.all();
    // Object.keys(hasd).forEach(prod_brand => {
    //   const has_brand = brands.find(e => e.description === prod_brand);

    //   console.log({ brand: prod_brand, has: Boolean(has_brand) });
    // });

    // const subgroups = await Subgroup.all();
    // Object.keys(hasd).forEach(prod_sub => {
    //   const has_sub = subgroups.find(e => e.description === prod_sub);

    //   console.log({ brand: prod_sub, has: Boolean(has_sub) });
    // });

    // Write your database queries inside the run method
  }
}
