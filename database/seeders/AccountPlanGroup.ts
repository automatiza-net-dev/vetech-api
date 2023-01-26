import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';

export default class extends BaseSeeder {
  private BASE: Array<Partial<AccountPlanGroup>> = [
    {
      id: 1,
      description: 'Receita Total',
      type: AccountPlanGroupType.C,
    },
    {
      id: 2,
      description: 'Custos Fixos',
      type: AccountPlanGroupType.D,
    },
    {
      id: 3,
      description: 'Custos Variávels',
      type: AccountPlanGroupType.D,
    },
    {
      id: 4,
      description: 'Deduções',
      type: AccountPlanGroupType.D,
    },
    {
      id: 5,
      description: 'Resultado Extra Operacional',
      type: AccountPlanGroupType.A,
    },
  ];
  public async run() {
    await AccountPlanGroup.fetchOrCreateMany('description', this.BASE);
  }
}
