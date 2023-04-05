import Factory from '@ioc:Adonis/Lucid/Factory';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';

export default Factory.define(ScheduleServiceGroup, ({ faker }) => {
  return {
    id: faker.datatype.uuid(),
    description: 'some description',
  };
}).build();
