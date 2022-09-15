import { rules, schema } from '@ioc:Adonis/Core/Validator';
import {
  MedicalPrescriptionFrequency,
  MedicalPrescriptionFrequencyQuantityUnit,
  MedicalPrescriptionFrequencyUnit,
  MedicalPrescriptionType,
} from 'App/Models/MedicalPrescription';
import { DateTime } from 'luxon';

export default interface IMedicalPrescriptionData {
  name: string;
  type: MedicalPrescriptionType;
  date: DateTime;
  frequency: MedicalPrescriptionFrequency;
  description: string;
  resume: string;
}

export const PROCEDURE_RECURRING_SCHEMA = schema.create({
  frequencyInterval: schema.number(),
  frequencyUnit: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
  frequencyQuantity: schema.number(),
  frequencyQuantityUnit: schema.enum(
    Object.values(MedicalPrescriptionFrequencyQuantityUnit),
  ),
});

export const MEDICATION_RECURRING_SCHEMA = schema.create({
  frequencyInterval: schema.number(),
  frequencyUnit: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
  frequencyQuantity: schema.number(),
  frequencyQuantityUnit: schema.enum(
    Object.values(MedicalPrescriptionFrequencyQuantityUnit),
  ),
  prescriptionUnitId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  dose: schema.number(),
  drugAdministrationId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'drug_administrations',
      column: 'id',
    }),
  ]),
});

export const MEDICATION_ONCE_OR_NEEDED_SCHEMA = schema.create({
  prescriptionUnitId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  dose: schema.number(),
  drugAdministrationId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'drug_administrations',
      column: 'id',
    }),
  ]),
});

export const FLUID_RECURRENT_SCHEMA = schema.create({
  frequencyInterval: schema.number(),
  frequencyUnit: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
  frequencyQuantity: schema.number(),
  frequencyQuantityUnit: schema.enum(
    Object.values(MedicalPrescriptionFrequencyQuantityUnit),
  ),
  prescriptionUnitId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  dose: schema.number(),
  drugAdministrationId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'drug_administrations',
      column: 'id',
    }),
  ]),
  fluidSet: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
  fluidSpeed: schema.number(),
  fluidId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  suplementId: schema.string({}),
});

export const FLUID_ONCE_OR_NEEDED_SCHEMA = schema.create({
  prescriptionUnitId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  dose: schema.number(),
  drugAdministrationId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'drug_administrations',
      column: 'id',
    }),
  ]),
  fluidSet: schema.enum(Object.values(MedicalPrescriptionFrequencyUnit)),
  fluidSpeed: schema.number(),
  fluidId: schema.string({}, [
    rules.uuid(),
    rules.exists({
      table: 'units',
      column: 'id',
    }),
  ]),
  suplementId: schema.string({}),
});
