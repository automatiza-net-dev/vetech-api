import Factory from '@ioc:Adonis/Lucid/Factory';
import Patient, {
  PatientGender,
  PatientType,
  PatientWeightOrigin,
} from 'App/Models/Patient';
import { DateTime } from 'luxon';

export default Factory.define(Patient, ({ faker }) => {
  return {
    id: faker.datatype.uuid(),
    active: true,
    gender:
      Object.values(PatientGender)[faker.datatype.number({ min: 0, max: 1 })],
    type: Object.values(PatientType)[faker.datatype.number({ min: 0, max: 1 })],
    name: faker.name.firstName(),
    tags: faker.random.words(4),
    birthDate: new Date('2022-01-01'),
    createdAt: DateTime.now(),
    updatedAt: DateTime.now(),
    weight: 10,
    weightDate: DateTime.now(),
    weightOrigin: PatientWeightOrigin.A,
  };
}).build();
