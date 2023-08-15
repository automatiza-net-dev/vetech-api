import Factory from '@ioc:Adonis/Lucid/Factory';
import Role from 'App/Models/Role';

export default Factory.define(Role, ({ faker }) => {
  return {
    name: faker.string.uuid(),
    externalAccess: true,
  };
}).build();
