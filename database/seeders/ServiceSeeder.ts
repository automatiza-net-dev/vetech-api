import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Variation from 'App/Models/Variation';
import VariationGroup from 'App/Models/VariationGroup';
import VariationOption from 'App/Models/VariationOption';

export const SERVICE_VARIATION_ID =
  '4b4addc3-db6a-4db8-a9fa-1cd4e0e47a03' as const;
export const SERVICE_VARIATION_OPTION_ID =
  'f03aa924-31a3-4954-a48a-bc58c9e332a9' as const;
export const SERVICE_VARIATION_GROUP_ID =
  '463898a0-96d0-4c9f-88de-54f30ee297e1' as const;

export default class extends BaseSeeder {
  public async run() {
    const service_variation = await Variation.firstOrCreate(
      {
        id: SERVICE_VARIATION_ID,
      },
      {
        id: SERVICE_VARIATION_ID,
        economic_group_id: undefined,
        description: 'Serviços',
        active: true,
      },
      {},
    );

    await VariationOption.firstOrCreate(
      {
        id: SERVICE_VARIATION_OPTION_ID,
      },
      {
        id: SERVICE_VARIATION_OPTION_ID,
        description: 'Serviços',
        active: true,
        variation_id: service_variation.id,
      },
      {},
    );

    const sv_group = await VariationGroup.firstOrCreate(
      {
        id: SERVICE_VARIATION_GROUP_ID,
      },
      {
        id: SERVICE_VARIATION_GROUP_ID,
        economic_group_id: undefined,
        description: 'Serviços',
        active: true,
      },
    );

    sv_group.related('variations').sync([SERVICE_VARIATION_ID], false);
  }
}
