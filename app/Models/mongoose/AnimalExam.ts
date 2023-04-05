export type IAnimalExam = {
  tag: string;
  name: string;
  realizedAt: Date;
  requester: {
    id: string;
    name: string;
  };
  technician: {
    id: string;
    name: string;
  };
  description: string;
  attachments: Array<string>;
};
