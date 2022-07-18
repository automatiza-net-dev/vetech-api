import Factory from '@ioc:Adonis/Lucid/Factory';
import ScheduleStatus from 'App/Models/ScheduleStatus';

export default Factory.define(ScheduleStatus, () => {
  return {
    description: 'some status',
    color: '#000',
  };
}).build();
