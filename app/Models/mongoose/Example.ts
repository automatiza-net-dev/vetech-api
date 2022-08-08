import { Schema, model } from '@ioc:Mongoose';

interface IExample {
  message: string;
}

export const exampleSchema = new Schema<IExample>(
  {
    message: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

const Example = model<IExample>('Example', exampleSchema);

export default Example;
