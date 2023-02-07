import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import MedicalDocumentTemplate from 'App/Models/MedicalDocumentTemplate';

export default class extends BaseSeeder {
  BASE = [
    {
      title: 'Orientação para fêmea gestante',
      description: 'Orientação para fêmea gestante',
    },
    {
      title: 'Orientação para gato obstruído',
      description: 'Orientação para gato obstruído',
    },
    {
      title: 'Orientação pós parto/cesarena',
      description: 'Orientação pós parto/cesarena',
    },
    {
      title: 'Orientação pós profilaxia dentária',
      description: 'Orientação pós profilaxia dentária',
    },
    {
      title: 'Orientação pré-operatória',
      description: 'Orientação pré-operatória',
    },
    {
      title: 'Orientações do paciente diabético',
      description: 'Orientações do paciente diabético',
    },
    {
      title: 'Orientações para paciente convulsivo',
      description: 'Orientações para paciente convulsivo',
    },
    {
      title: 'Otohematoma',
      description: 'Otohematoma',
    },
    {
      title: 'Pedido de exame - Raio-x',
      description: 'Pedido de exame - Raio-x',
    },
    {
      title: 'Pedido de exames - Laboratório',
      description: 'Pedido de exames - Laboratório',
    },
    {
      title: 'Pedido de exames - Ultrassom',
      description: 'Pedido de exames - Ultrassom',
    },
    {
      title: 'Preparo do paciente para colonoscopia',
      description: 'Preparo do paciente para colonoscopia',
    },
    {
      title: 'Receita atopia',
      description: 'Receita atopia',
    },
    {
      title: 'Receita Cirurgia Geral',
      description: 'Receita Cirurgia Geral',
    },
    {
      title: 'Receita Controle Especial',
      description: 'Receita Controle Especial',
    },
    {
      title: 'Receita de dieta para paciente com cálculo vesical',
      description: 'Receita de dieta para paciente com cálculo vesical',
    },
    {
      title: 'Receita gastroenterite',
      description: 'Receita gastroenterite',
    },
    {
      title: 'Receita Geral',
      description: 'Receita Geral',
    },
    {
      title: 'Receita Osh eletiva',
      description: 'Receita Osh eletiva',
    },
    {
      title: 'Receita otite',
      description: 'Receita otite',
    },
    {
      title: 'Receita P.O. osteossíntese',
      description: 'Receita P.O. osteossíntese',
    },
    {
      title: 'Receita para filhotes órfãos',
      description: 'Receita para filhotes órfãos',
    },
    {
      title: 'Recomendações de manejo do cão atópico',
      description: 'Recomendações de manejo do cão atópico',
    },
  ];

  public async run() {
    await MedicalDocumentTemplate.fetchOrCreateMany(
      'title',
      this.BASE.map(elem => ({
        ...elem,
        header: '',
        template: '',
      })),
    );
  }
}
