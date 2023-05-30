import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Activity from 'App/Models/Activity';

export default class extends BaseSeeder {
  public async run() {
    const data = [
      {
        description: 'Agendamento – Avaliação Cirúrgica',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Avaliação Preventiva',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Consulta',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Exames',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Outros',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Reavaliação',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Agendamento – Vacinas',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Confirmação de Agenda – WhatsApp',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Confirmação de Agenda - Ligação',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Ligação',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Retorno – Envio de Vídeo ou Card',
        duration: 30,
        type: 'crm',
        active: true,
      },
      {
        description: 'Retorno – Ligação',
        duration: 30,
        type: 'crm',
        active: true,
      },
    ];

    await Activity.fetchOrCreateMany('description', data);
  }
}
