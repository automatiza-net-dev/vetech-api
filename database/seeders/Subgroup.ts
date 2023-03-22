import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Subgroup from 'App/Models/Subgroup';

export default class extends BaseSeeder {
  public async run() {
    const BASE = [
      'Acessórios',
      'Anestesias',
      'Antiparasitários / Vermifugos',
      'Consultas',
      'Destinação',
      'Endoscopia',
      'Exames em Geral',
      'Farmácia Veterinária',
      'Materias de consumo',
      'Medicamentos Aplicados',
      'Pacotes de prevenção',
      'Papelaria',
      'Procedimentos',
      'Psicotrópicos',
      'Ração',
      'Vacinas',
      'Bloco Cirúrgico',
      'Cirurgia Eletiva',
      'Cirurgias Terapêutica',
      'Material de consumo - CC',
      'Imagem',
      'Material de consumo - Imagem',
      'Radiologia',
      'Ultrassom',
      'Internação',
      'Diárias',
      'Materiais consumo - internação',
      'Procedimentos Internação',
    ];
    const parsed: Array<Partial<Subgroup>> = BASE.map(elem => ({
      description: elem,
    }));

    await Subgroup.fetchOrCreateMany('description', parsed);
  }
}
