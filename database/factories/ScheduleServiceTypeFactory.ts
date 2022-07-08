import Factory from '@ioc:Adonis/Lucid/Factory';
import ScheduleServiceGroup from 'App/Models/ScheduleServiceGroup';
import ScheduleServiceType from 'App/Models/ScheduleServiceType';
import { v4 } from 'uuid';

export default Factory.define(ScheduleServiceType, async () => {
  const group = await ScheduleServiceGroup.create({
    id: v4(),
    description: v4(),
  });

  return {
    id: v4(),
    description: 'some description',
    reservedMinutes: 90,
    schedule_service_group_id: group.id,
  };
}).build();
