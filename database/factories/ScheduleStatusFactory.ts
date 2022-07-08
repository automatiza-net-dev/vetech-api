import Factory from '@ioc:Adonis/Lucid/Factory';
import ScheduleStatus from 'App/Models/ScheduleStatus';

export default Factory.define(ScheduleStatus, ({ faker }) => {
  return {
    description: 'some status',
    color: faker.color.rgb(),
  };
}).build();
