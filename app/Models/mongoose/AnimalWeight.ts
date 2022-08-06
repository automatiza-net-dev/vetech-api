import { model, Schema } from '@ioc:Mongoose';

export type IAnimalWeight = {
  tag: string;
  weight: number;
};

export const AnimalWeightSchema = new Schema<IAnimalWeight>(
  {
    weight: {
      type: Number,
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

const AnimalWeight = model<IAnimalWeight>('animal_weight', AnimalWeightSchema);

export default AnimalWeight;
