import { model, Schema } from '@ioc:Mongoose';

type T = {
  meta: object;
  data: object;
};

export const hospitalizationTimelineSchema = new Schema<T>(
  {
    meta: {
      type: Object,
    },
    data: {
      type: Object,
    },
  },
  {
    timestamps: true,
  },
);

const HospitalizationTimeline = model<T>(
  'hospitalization',
  hospitalizationTimelineSchema,
);

export default HospitalizationTimeline;
