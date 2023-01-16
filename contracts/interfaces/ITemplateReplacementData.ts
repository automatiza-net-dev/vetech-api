import { TemplateReplacementOrigin } from 'App/Models/TemplateReplacement';

export default interface ITemplateReplacementData {
  origin: TemplateReplacementOrigin;
  attribute: string;
  replacer: string;
}
