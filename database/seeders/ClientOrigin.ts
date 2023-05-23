import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ClientOrigin, { ClientOriginType } from 'App/Models/ClientOrigin';
import System from 'App/Models/System';

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
      description: 'Indicação de amigo',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Indicação de colega veterinário',
      type: ClientOriginType.C,
      active: true,
    },
    {
      description: 'Indicação de Petshop',
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
    const systems = await System.query().whereIn('name', ['Vetech', 'Sanclá']);

    if (systems.length < 2) {
      throw new Error('Systems not found');
    }

    const tasks = systems.map(system => {
      return ClientOrigin.fetchOrCreateMany(
        ['description', 'system_id'],
        this.BASE.map(elem2 => ({ ...elem2, system_id: system.id })),
      );
    });
    await Promise.all(tasks);
  }
}
