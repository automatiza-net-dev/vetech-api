import { inject } from '@adonisjs/fold';
import BusinessUnitFiscalDocument from 'App/Models/BusinessUnitFiscalDocument';
import SharedService from 'App/Services/SharedService';
import IBusinessUnitFiscalDocumentData from 'Contracts/interfaces/IBusinessUnitFiscalDocumentData';

@inject()
export default class BusinessUnitFiscalDocumentService {
  constructor(private readonly sharedService: SharedService) {}

  async store(unitId: string, data: IBusinessUnitFiscalDocumentData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return BusinessUnitFiscalDocument.create({
      economic_group_id: group.id,
      business_unit_id: unitId,

      documentType: data.type,
      movementType: data.movement,
      description: data.description,
      model: data.model,
      series: data.series,
      sequence: data.sequence,
    });
  }
}
