import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Specie from 'App/Models/Specie';
import Vaccine, { VaccineType } from 'App/Models/Vaccine';
import VaccineProtocol from 'App/Models/VaccineProtocol';

export default class extends BaseSeeder {
  BASE = [
    {
      name: 'Antirábica',
      description: '',
      type: 'vaccine',
      specie_id: '',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'Bronchi Shield',
      description: '',
      type: 'vaccine',
      specie_id: 'Canina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'Bronchiguard',
      description: '',
      type: 'vaccine',
      specie_id: 'Canina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'Giardia',
      description: '',
      type: 'vermifuge',
      specie_id: 'Canina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'Giardia Primeira Imunização',
      description: '',
      type: 'vermifuge',
      specie_id: '',
      protocol_name: ['2 x 21 dias'],
      doses: 2,
      interval: 21,
    },
    {
      name: 'Lepto',
      description: '',
      type: 'vaccine',
      specie_id: 'Canina',
      protocol_name: ['Semestral'],
      doses: 1,
      interval: 182,
    },
    {
      name: 'V10 Imunização Anual',
      description: '',
      type: 'vaccine',
      specie_id: '',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'V10 Primeira Imunização',
      description: '',
      type: 'vaccine',
      specie_id: '',
      protocol_name: ['3 x 21 dias'],
      doses: 3,
      interval: 21,
    },
    {
      name: 'V4 Felina',
      description: '',
      type: 'vaccine',
      specie_id: 'Felina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'V4/V5 Protocolo vacinal de filhote',
      description: '',
      type: 'vaccine',
      specie_id: 'Felina',
      protocol_name: ['V4 2 x 25 dias', 'V5 2 x 25'],
      doses: 2,
      interval: 25,
    },
    {
      name: 'V5 Felina',
      description: '',
      type: 'vaccine',
      specie_id: 'Felina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
    {
      name: 'Vanguard Gripe Oral',
      description: '',
      type: 'vaccine',
      specie_id: 'Canina',
      protocol_name: ['Anual'],
      doses: 1,
      interval: 365,
    },
  ];

  public async run() {
    const species = await Specie.all();

    const promises = this.BASE.map(async vaccine => {
      const specie =
        vaccine.specie_id === ''
          ? null
          : species.find(specie => specie.description === vaccine.specie_id);

      const db_vaccine = await Vaccine.firstOrCreate(
        {
          name: vaccine.name,
        },
        {
          name: vaccine.name,
          description: vaccine.description,
          type:
            vaccine.type === 'vaccine'
              ? VaccineType.VACCINE
              : VaccineType.VERMIFUGE,
        },
      );

      const new_vaccines = await VaccineProtocol.fetchOrCreateMany(
        'name',
        vaccine.protocol_name.map(name => ({
          name,
          vaccine_id: db_vaccine.id,
          specie_id: specie?.id,
          doses: vaccine.doses,
          interval: vaccine.interval,
        })),
      );

      return new_vaccines;
    });

    await Promise.all(promises);
  }
}
