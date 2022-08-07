import { model, Schema } from '@ioc:Mongoose';

export type IAnimalDocument = {
  tag: string;
  type: string;
  value: string;
};

export const AnimalDocumentSchema = new Schema<IAnimalDocument>(
  {
    type: {
      type: String,
      required: true,
    },
    value: {
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

const AnimalDocument = model<IAnimalDocument>(
  'animal_document',
  AnimalDocumentSchema,
);

export default AnimalDocument;
