import Factory from '@ioc:Adonis/Lucid/Factory';
import EconomicGroup from 'App/Models/EconomicGroup';

export default Factory.define(EconomicGroup, ({ faker }) => {
  return {
    id: faker.datatype.uuid(),
    fantasy_name: faker.company.companyName(),
    company_name: faker.company.companyName(),
    document: '123456789',
    responsible_email: faker.internet.email(),
    responsible_phone: faker.phone.number(),
  };
}).build();
