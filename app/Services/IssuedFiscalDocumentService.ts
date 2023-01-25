import { inject } from '@adonisjs/fold';
import BusinessUnitFiscalDocument from 'App/Models/BusinessUnitFiscalDocument';
import { FiscalDocumentType } from 'App/Models/FiscalDocument';

interface ISearch {
  unit: string;
  type: FiscalDocumentType;
  description: string;
  model: string;
  series: string;
  sequence: number;
}

@inject()
export default class IssuedFiscalDocumentService {
  public async index(_: string, data: ISearch) {
    const qb = BusinessUnitFiscalDocument.query();

    if (data.unit) {
      qb.where('business_unit_id', data.unit);
    }

    if (data.type) {
      qb.where('movement_type', data.type);
    }

    if (data.description) {
      qb.whereILike('description', data.description);
    }

    if (data.model) {
      qb.whereILike('model', data.model);
    }

    if (data.series) {
      qb.whereILike('series', data.series);
    }

    if (data.sequence) {
      qb.where('sequence', data.sequence);
    }

    return qb;
  }
}
