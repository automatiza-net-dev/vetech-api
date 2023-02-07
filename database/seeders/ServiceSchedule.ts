import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';

export default class extends BaseSeeder {
  BASE_SCHEDULES = [
    'Internação',
    'Cirurgia',
    'Exames',
    'Consultas',
    'Procedimentos',
    'Retorno',
  ];

  public async run() {
    const partialSchedules = this.BASE_SCHEDULES.map(scheduleName => ({
      description: scheduleName,
    }));

    await ScheduleServiceGroup.fetchOrCreateMany(
      'description',
      partialSchedules,
    );
  }
}
