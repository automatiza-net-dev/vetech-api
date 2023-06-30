import { model, Schema } from '@ioc:Mongoose';

interface IAnimalTimeline {
  timeline_id: string; // id da timeline do banco relacional
  timeline_type: object; // objeto contendo os dados do tipo da timeline
  timeline_info: object; // objeto contendo os dados da timeline, cada tipo de registro terá um objeto diferente
  extras?: object;
}

export const animalTimelineSchema = new Schema<IAnimalTimeline>(
  {
    timeline_id: { type: String, required: true },
    timeline_type: { type: Object, required: true },
    timeline_info: { type: Object, required: true },
    extras: { type: Object, required: false },
  },
  {
    timestamps: true,
  },
);

const AnimalTimeline = model<IAnimalTimeline>('timeline', animalTimelineSchema);

export default AnimalTimeline;

// const animalWeight = {
//   timeline_id: Timeline.id,
//   timeline_type: {
//     ...timelineType,
//   },
//   timeline_info: {
//     weight: 10,
//     observation: '',
//   },
// };

// const animalPhothology = {
//   timeline_id: Timeline.id,
//   timeline_type: {
//     ...timelineType,
//   },
//   timeline_info: {
//     pathology: {},
//   },
// };
