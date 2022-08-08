import { model, Schema } from '@ioc:Mongoose';

export type IAnimalMedicalRecipe = {
  tag: string;
  recipe: string;
};

export const AnimalMedicalRecipeSchema = new Schema<IAnimalMedicalRecipe>(
  {
    recipe: {
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

const AnimalMedicalRecipe = model<IAnimalMedicalRecipe>(
  'animal_medical_recipe',
  AnimalMedicalRecipeSchema,
);

export default AnimalMedicalRecipe;
