import Factory from '@ioc:Adonis/Lucid/Factory';
import EconomicGroup from 'App/Models/EconomicGroup';

export default Factory.define(EconomicGroup, ({ faker }) => {
  return {
    id: faker.string.uuid(),
    fantasy_name: faker.person.firstName(),
    company_name: faker.person.lastName(),
    document: '123456789',
    responsible_email: faker.internet.email(),
    responsible_phone: 'some phone',
  };
}).build();
