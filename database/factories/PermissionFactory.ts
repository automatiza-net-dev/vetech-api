import Factory from '@ioc:Adonis/Lucid/Factory';
import Permission from 'App/Models/Permission';

export default Factory.define(Permission, ({ faker }) => {
  return {
    control: faker.datatype.uuid(),
    description: faker.lorem.words(3),
  };
}).build();
