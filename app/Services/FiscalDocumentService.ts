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
      const isSingle = data.document.includes(',');
      const tokens = data.document.split(',');

      if (isSingle) {
        qb.where('document_type', data.document);
      } else {
        qb.whereIn('document_type', tokens);
      }
    }

    if (data.movement) {
      const isSingle = data.movement.includes(',');
      const tokens = data.movement.split(',');

      if (isSingle) {
        qb.where('movement_type', data.movement);
      } else {
        qb.whereIn('movement_type', tokens);
      }
    }

    return qb;
  }
}
