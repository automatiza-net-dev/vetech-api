import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import Unit, { UnitType } from 'App/Models/Unit';

export default class extends BaseSeeder {
  private BASE: Array<Partial<Unit>> = [
    {
      name: 'Caixa',
      tag: 'cx',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Pacote',
      tag: 'pac',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Par',
      tag: 'par',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Peça',
      tag: 'pc',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Rolo',
      tag: 'rl',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Quilo',
      tag: 'kg',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Saco',
      tag: 'sc',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Unidade',
      tag: 'un',
      type: UnitType.PRODUCT,
    },
    {
      name: 'Ampola',
      tag: 'amp',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Borrifada',
      tag: 'borrifada',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Cartela',
      tag: 'cart',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Comprimido',
      tag: 'comprimido',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Drágeas',
      tag: 'drágeas',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Frasco',
      tag: 'fr',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Gotas',
      tag: 'gotas',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Gotas por Quilo',
      tag: 'gotas/kg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Grama',
      tag: 'gr',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Micrograma por Quilo',
      tag: 'mcg/kg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Miligrama',
      tag: 'mg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Miligramas por Quilo',
      tag: 'mg/kg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Mililitro',
      tag: 'ml',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Mililitros por Quilo',
      tag: 'ml/kg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'UI por Mililitro',
      tag: 'ui/ml',
      type: UnitType.MEDICINE,
    },
    {
      name: 'UI por Quilo',
      tag: 'ui/kg',
      type: UnitType.MEDICINE,
    },
    {
      name: 'Gotas por Minuto',
      tag: 'gotas/min',
      type: UnitType.FLUID_VELOCITY,
    },
    {
      name: 'Mililitros por Dia',
      tag: 'ml/dia',
      type: UnitType.FLUID_VELOCITY,
    },
    {
      name: 'Mililitros por Hora',
      tag: 'ml/h',
      type: UnitType.FLUID_VELOCITY,
    },
  ];

  public async run() {
    await Unit.fetchOrCreateMany('tag', this.BASE);
  }
}
