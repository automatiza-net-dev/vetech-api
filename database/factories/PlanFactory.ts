import Factory from '@ioc:Adonis/Lucid/Factory';
import Plan from 'App/Models/Plan';

export default Factory.define(Plan, ({ faker }) => {
  return {
    description: faker.random.word(),
    trialDays: faker.datatype.number({ min: 7, max: 31 }),
    trialAdditional: faker.datatype.number({ min: 2, max: 7 }),
    default: faker.datatype.boolean(),
  };
}).build();
