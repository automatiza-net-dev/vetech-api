import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import SystemUrl from 'App/Models/SystemUrl';

export default class extends BaseSeeder {
  public async run() {
    const isProduction = process.env.NODE_ENV === 'production';

    await SystemUrl.fetchOrCreateMany(
      ['system_id', 'url'],
      [
        {
          id: 1,
          system_id: 1,
          url: isProduction
            ? 'https://vetech.automatiza.net'
            : 'https://sancla.creativecode.dev.br',
        },
        {
          id: 2,
          system_id: 2,
          url: isProduction
            ? 'https://sancla.automatiza.net'
            : 'https://liftone.creativecode.dev.br',
        },
        {
          id: 3,
          system_id: 3,
          url: isProduction
            ? 'https://liftone.automatiza.net'
            : 'https://vetech.creativecode.dev.br',
        },
      ],
    );
  }
}
