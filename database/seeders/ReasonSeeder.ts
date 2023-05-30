import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Reason from 'App/Models/Reason';

export default class extends BaseSeeder {
  private BASE: Array<Partial<Reason>> = [
    {
      reason: 'Imprevisto Tutor',
      type: 'RA',
      requiresObservation: false,
    },
    {
      reason: 'Outros',
      type: 'RA',
      requiresObservation: true,
    },
    {
      reason: 'Cliente desistiu do Orçamento',
      type: 'OR',
      requiresObservation: false,
    },
    {
      reason: 'Orçamento ficou muito Caro',
      type: 'OR',
      requiresObservation: false,
    },
    {
      reason: 'Outros',
      type: 'OR',
      requiresObservation: true,
    },
    {
      reason: 'Cancelamento Tutor',
      type: 'CA',
      requiresObservation: false,
    },
    {
      reason: 'Cancelamento Clínica',
      type: 'CA',
      requiresObservation: true,
    },
    {
      reason: 'Outros',
      type: 'CA',
      requiresObservation: true,
    },

    {
      reason: 'Confiança no médico veterinário que indicou',
      type: 'CRM_W',
    },
    {
      reason: 'Confiança no familiar/ amigo que indicou',
      type: 'CRM_W',
    },
    {
      reason: 'Infraestrutura',
      type: 'CRM_W',
    },
    {
      reason: 'Já conhecia a SanClá',
      type: 'CRM_W',
    },
    {
      reason: 'Gostou do atendimento',
      type: 'CRM_W',
    },
    {
      reason: 'Outro motivo',
      type: 'CRM_W',
    },
    {
      reason: 'Preço',
      type: 'CRM_W',
    },
    {
      reason: 'Diversas Tentativas de Contato – Sem sucesso',
      type: 'CRM_L',
    },
    {
      reason: 'Engano',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Achou Caro',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Curiosidade (Procedimentos)',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Curiosidade (Valores)',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Desemprego',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Distância',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Financeiro',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Foi em Outro Lugar',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Não responde Whats',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Óbito do Animal',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Outras Espécies',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Outros',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Problema Pessoal',
      type: 'CRM_L',
    },
    {
      reason: 'Não Agendado - Problemas de Saúde',
      type: 'CRM_L',
    },
    {
      reason: 'Telefone Indisponível (Diversas vezes)',
      type: 'CRM_L',
    },
    {
      reason: 'Telefone Não Existe',
      type: 'CRM_L',
    },
  ];
  public async run() {
    await Reason.fetchOrCreateMany('reason', this.BASE);
  }
}
