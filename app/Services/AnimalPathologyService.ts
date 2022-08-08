import { inject } from '@adonisjs/fold';
import AnimalPathology, {
  IAnimalPathology,
} from 'App/Models/mongoose/AnimalPathology';
import { MBase } from 'App/Models/mongoose/type';

@inject()
export default class AnimalPathologyService {
  public async index(tag: string): Promise<Array<MBase & IAnimalPathology>> {
    return AnimalPathology.find({ tag });
  }

  public async store(data: IAnimalPathology) {
    return AnimalPathology.create({
      tag: data.tag,
      pathology: data.pathology,
    });
  }
}
