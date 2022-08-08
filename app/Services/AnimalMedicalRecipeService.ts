import { inject } from '@adonisjs/fold';
import AnimalMedicalRecipe, {
  IAnimalMedicalRecipe,
} from 'App/Models/mongoose/AnimalMedicalRecipe';
import { MBase } from 'App/Models/mongoose/type';

@inject()
export default class AnimalMedicalRecipeService {
  public async index(
    tag: string,
  ): Promise<Array<MBase & IAnimalMedicalRecipe>> {
    return AnimalMedicalRecipe.find({ tag });
  }

  public async store(data: IAnimalMedicalRecipe) {
    return AnimalMedicalRecipe.create({
      tag: data.tag,
      recipe: data.recipe,
    });
  }
}
