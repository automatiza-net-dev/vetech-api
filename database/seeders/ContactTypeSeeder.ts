import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ContactType from 'App/Models/ContactType';

export default class extends BaseSeeder {
  public async run() {
    await ContactType.fetchOrCreateMany('description', [
      {
        description: 'Ativo - Manual',
        observation:
          'Exemplo: cliente deixou a indicação de um amigo na recepção e ao colaborador ligou para o cliente indicado',
        type: 'crm',
        active: true,
      },
      {
        description: 'Ativo - Rede Social',
        observation:
          'Exemplo: cliente deixou o contato no Messenger do Facebook e o colaborador ligou para o cliente.',
        type: 'crm',
        active: true,
      },
      {
        description: 'Receptivo (Ligação)',
        observation: 'Exemplo: cliente ligou no fixo.',
        type: 'crm',
        active: true,
      },
      {
        description: 'Receptivo (WhatsApp mensagem)',
        observation: 'Exemplo: cliente enviou mensagem através WhatsApp.',
        type: 'crm',
        active: true,
      },
      {
        description: 'Receptivo (WhatsApp ligação)',
        observation: 'Exemplo: cliente ligou através da chamada do WhatsApp.',
        type: 'crm',
        active: true,
      },
    ]);
  }
}
