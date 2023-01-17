import { TemplateReplacementOrigin } from 'App/Models/TemplateReplacement';

export default interface ITemplateReplacementData {
  origin: TemplateReplacementOrigin;
  attribute: string;
  replacer: string;
}

export interface ITemplateReplacementParser {
  base: string;
  businessUnitId?: string;
  userId?: string;
  scheduleId?: string;
  tutorId?: string;
  dependentId?: string;
}
