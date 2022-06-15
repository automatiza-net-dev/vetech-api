import Factory from '@ioc:Adonis/Lucid/Factory';
import Permission from 'App/Models/Permission';

export default Factory.define(Permission, ({ faker }) => {
  return {
    name: faker.name.jobArea(),
  };
}).build();
