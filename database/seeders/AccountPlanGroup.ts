import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import AccountPlanGroup, {
  AccountPlanGroupType,
} from 'App/Models/AccountPlanGroup';

export default class extends BaseSeeder {
  private BASE: Array<Partial<AccountPlanGroup>> = [
    {
      description: 'RECEITAS',
      type: AccountPlanGroupType.C,
    },
    {
      description: 'DEDUÇÕES',
      type: AccountPlanGroupType.D,
    },
    {
      description: 'CUSTOS VARIAVEIS',
      type: AccountPlanGroupType.D,
    },
    {
      description: 'CUSTOS FIXOS',
      type: AccountPlanGroupType.D,
    },
    {
      description: 'RESULTADO FINANCEIRO',
      type: AccountPlanGroupType.A,
    },
    {
      description: 'EXTRA OPERACIONAL',
      type: AccountPlanGroupType.A,
    },
  ];
  public async run() {
    await AccountPlanGroup.fetchOrCreateMany('description', this.BASE);
  }
}
