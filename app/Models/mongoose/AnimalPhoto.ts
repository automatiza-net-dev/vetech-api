import { model, Schema } from '@ioc:Mongoose';

export type IAnimalPhoto = {
  tag: string;
  photo: string;
};

export const AnimalPhotoDocument = new Schema<IAnimalPhoto>(
  {
    photo: {
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

const AnimalPhoto = model<IAnimalPhoto>('animal_photo', AnimalPhotoDocument);

export default AnimalPhoto;
