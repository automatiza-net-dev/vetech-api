import { inject } from '@adonisjs/fold';
import AnimalWeight, { IAnimalWeight } from 'App/Models/mongoose/AnimalWeight';
import { MBase } from 'App/Models/mongoose/type';

@inject()
export default class AnimalWeightService {
  public async index(tag: string): Promise<Array<MBase & IAnimalWeight>> {
    return AnimalWeight.find({ tag });
  }

  public async store(data: IAnimalWeight) {
    return AnimalWeight.create({
      tag: data.tag,
      weight: data.weight,
    });
  }
}
