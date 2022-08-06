import { inject } from '@adonisjs/fold';
import AnimalObservation, {
  IAnimalObservation,
} from 'App/Models/mongoose/AnimalObservation';
import { MBase } from 'App/Models/mongoose/type';

@inject()
export default class AnimalObservationService {
  public async index(tag: string): Promise<Array<MBase & IAnimalObservation>> {
    return AnimalObservation.find({ tag });
  }

  public async store(data: IAnimalObservation) {
    return AnimalObservation.create({
      tag: data.tag,
      observation: data.observation,
    });
  }
}
