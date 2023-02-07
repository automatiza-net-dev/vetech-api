import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Brand from 'App/Models/Brand';

export default class extends BaseSeeder {
  BASE = [
    {
      description: 'Não informado',
    },
    {
      description: 'ASFER',
    },
    {
      description: 'SR',
    },
    {
      description: 'MEDIX',
    },
    {
      description: 'Solidor',
    },
    {
      description: 'Descarpack',
    },
    {
      description: 'pharma',
    },
    {
      description: 'FARMACE',
    },
    {
      description: 'HIPOLABOR',
    },
    {
      description: 'Cristalia',
    },
    {
      description: 'Agener União',
    },
    {
      description: 'HALEX ISTAR',
    },
    {
      description: 'HYPOFARMA',
    },
    {
      description: 'Chemitec',
    },
    {
      description: 'isoforine',
    },
    {
      description: 'FRESENIUS',
    },
    {
      description: 'Vetnil',
    },
    {
      description: 'Virbac',
    },
    {
      description: 'World Veterinária',
    },
    {
      description: 'Labgard',
    },
    {
      description: 'Cepav',
    },
    {
      description: 'Ceva',
    },
    {
      description: 'Merial',
    },
    {
      description: 'MEDLEY',
    },
    {
      description: 'Ourofino',
    },
    {
      description: 'Zoetis',
    },
    {
      description: 'MSD',
    },
    {
      description: 'NEVE',
    },
    {
      description: 'CREMER',
    },
    {
      description: 'PROCANINE',
    },
    {
      description: 'OPHTHALM',
    },
    {
      description: 'KARINA',
    },
    {
      description: 'UNIÃO QUIMICA',
    },
    {
      description: 'EMBRAMED',
    },
    {
      description: 'ABBOTT',
    },
    {
      description: 'CAPROFYL',
    },
    {
      description: 'SHALON',
    },
    {
      description: 'MULTIGEL',
    },
    {
      description: 'MUCAMBO',
    },
    {
      description: 'INOVE',
    },
    {
      description: 'LEMGRUBER',
    },
    {
      description: 'supersafety',
    },
    {
      description: 'IMPEL',
    },
    {
      description: 'Pearson',
    },
    {
      description: 'Santisa',
    },
    {
      description: 'mark med',
    },
    {
      description: 'medsonda',
    },
    {
      description: 'EQUIPLEX',
    },
    {
      description: 'ISOFARMA',
    },
    {
      description: 'CLEAN-UP',
    },
    {
      description: 'MAXXIMED',
    },
    {
      description: 'ANADONA',
    },
    {
      description: 'Rabisin',
    },
    {
      description: 'Pfizer',
    },
  ];

  public async run() {
    await Brand.fetchOrCreateMany(
      'description',
      this.BASE.map(elem => ({
        description: elem.description,
      })),
    );
  }
}
