import BaseSeeder from '@ioc:Adonis/Lucid/Seeder';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';

export default class extends BaseSeeder {
  BASE_SCHEDULES = ['Agendamento 1', 'Agendamento 2'];

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
