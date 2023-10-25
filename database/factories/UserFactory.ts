import Factory from '@ioc:Adonis/Lucid/Factory';
import User from 'App/Models/User';

export default Factory.define(User, ({ faker }) => {
  return {
    name: faker.person.firstName(),
    email: faker.internet.email(),
    password: '102030',
    document: '22463560000115',
    phone: '|PHONE|',
    licensingJob: 'Veterinário',
    type: 'user' as const,
  };
}).build();
