import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';

export default class extends BaseSeeder {
  private BASE: Array<Partial<ClientOrigin>> = [
    {
      description: 'Google',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Facebook',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Instagram',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Indicação',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Passando na rua',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Radio',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Televisão',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Panfletagem',
      type: ClientOriginType.C,
      active: true,
    },
  ];

  public async run() {
    await ClientOrigin.fetchOrCreateMany('description', this.BASE);
  }
}
