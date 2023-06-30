import { model, Schema } from '@ioc:Mongoose';

type T = {
  meta: object;
  data: object;
  extra?: object;
};

export const hospitalizationTimelineSchema = new Schema<T>(
  {
    meta: {
      type: Object,
    },
    data: {
      type: Object,
    },
    extra: {
      type: Object,
      required: false,
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
