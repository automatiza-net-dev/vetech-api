import { model, Schema } from '@ioc:Mongoose';

export type IAnimalObservation = {
  tag: string;
  observation: string;
};

export const AnimalObservationSchema = new Schema<IAnimalObservation>(
  {
    observation: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const AnimalObservation = model<IAnimalObservation>(
  'animal_observation',
  AnimalObservationSchema,
);

export default AnimalObservation;
