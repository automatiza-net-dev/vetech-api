import Factory from '@ioc:Adonis/Lucid/Factory';
import User from 'App/Models/User';

export default Factory.define(User, ({ faker }) => {
  return {
    name: faker.name.firstName(),
    email: faker.internet.email(),
    password: '102030',
    document: '123456789',
    phone: '|PHONE|',
    licensingJob: 'Veterinário',
  };
}).build();
