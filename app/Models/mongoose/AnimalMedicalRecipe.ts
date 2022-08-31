import { DateTime } from 'luxon';

export type IAnimalMedicalRecipe = {
  tag: string;
  name: string;
  realizedAt: DateTime;
  technicianId: string;
  recipe: string;
};
