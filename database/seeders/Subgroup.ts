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
      'Cirurgias Eletiva',
      'Cirurgia Terapêutica',
      'Material de consumo - CC',
      'Imagem',
      'Material de consumo - Imagem',
      'Radiologia',
      'Ultrassom',
      'Ultrassonografia',
      'Internação',
      'Diárias',
      'Materiais consumo - internação',
      'Procedimentos Internação',
    ];
    const parsed: Array<Partial<Subgroup>> = BASE.map(elem => ({
      description: elem,
    }));

    const existingSubgroups = await Subgroup.query()
      .whereIn('description', BASE)
      .whereNull('economic_group_id');

    const existingSubgroupsDescriptions = existingSubgroups.map(
      elem => elem.description,
    );

    const subgroupsToCreate = parsed.filter(
      elem => !existingSubgroupsDescriptions.includes(elem.description ?? '-1'),
    );

    await Subgroup.createMany(subgroupsToCreate);
  }
}
