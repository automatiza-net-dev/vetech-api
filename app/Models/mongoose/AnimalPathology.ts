import { model, Schema } from '@ioc:Mongoose';

export type IAnimalPathology = {
  tag: string;
  pathology: string;
};

export const AnimalPahologyDocument = new Schema<IAnimalPathology>(
  {
    pathology: {
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

const AnimalPathology = model<IAnimalPathology>(
  'animal_pathology',
  AnimalPahologyDocument,
);

export default AnimalPathology;
