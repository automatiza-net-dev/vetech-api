import { inject } from '@adonisjs/fold';
import AnimalDocument, {
  IAnimalDocument,
} from 'App/Models/mongoose/AnimalDocument';
import { MBase } from 'App/Models/mongoose/type';

@inject()
export default class AnimalDocumentService {
  public async index(tag: string): Promise<Array<MBase & IAnimalDocument>> {
    return AnimalDocument.find({ tag });
  }

  public async store(data: IAnimalDocument) {
    return AnimalDocument.create({
      tag: data.tag,
      type: data.type,
      value: data.value,
    });
  }
}
