import { inject } from '@adonisjs/fold';
import FiscalDocument from 'App/Models/FiscalDocument';

type ISearch = {
  document?: string;
  movement?: string;
};

@inject()
export default class FiscalDocumentService {
  async index(data: ISearch) {
    const qb = FiscalDocument.query().where('active', true);

    if (data.document) {
      qb.where('document_type', data.document);
    }

    if (data.movement) {
      qb.where('movement_type', data.movement);
    }

    return qb;
  }
}
