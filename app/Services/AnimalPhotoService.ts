import { inject } from '@adonisjs/fold';
import { MultipartFileContract } from '@ioc:Adonis/Core/BodyParser';
import Drive from '@ioc:Adonis/Core/Drive';
import AnimalPhoto, { IAnimalPhoto } from 'App/Models/mongoose/AnimalPhoto';
import { MBase } from 'App/Models/mongoose/type';
import ICreateAnimalPhoto from 'Contracts/interfaces/ICreateAnimalPhoto';
import { v4 } from 'uuid';

@inject()
export default class AnimalPhotoService {
  public async index(tag: string): Promise<Array<MBase & IAnimalPhoto>> {
    return AnimalPhoto.find({ tag });
  }

  public async store(data: ICreateAnimalPhoto) {
    return AnimalPhoto.create({
      tag: data.tag,
      photo: await this.uploadPhoto(data.photo),
    });
  }

  private async uploadPhoto(file: MultipartFileContract): Promise<string> {
    const key = `${v4()}.${file.extname}`;
    await file.moveToDisk(
      'patients',
      {
        name: key,
      },
      'local',
    );

    return Drive.getUrl(`patients/${key}`);
  }
}
