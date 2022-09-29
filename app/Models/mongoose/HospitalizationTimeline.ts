import { model, Schema } from '@ioc:Mongoose';

type T = {
  data: object;
};

export const hospitalizationTimelineSchema = new Schema<T>(
  {
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
