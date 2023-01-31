import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnitFiscalDocument, {
  BusinessUnitFiscalDocumentMovementType,
} from 'App/Models/BusinessUnitFiscalDocument';
import CorrectedFiscalDocument from 'App/Models/CorrectedFiscalDocument';
import IssuedFiscalDocument, {
  IssuedFiscalDocumentContingency,
} from 'App/Models/IssuedFiscalDocument';
import User from 'App/Models/User';
import SharedService from 'App/Services/SharedService';
import IBusinessUnitFiscalDocumentData, {
  IAuthorizeFiscalDocument,
  ICancelFiscalDocument,
  ICorrectFiscalDocument,
  IDisableFiscalDocument,
} from 'Contracts/interfaces/IBusinessUnitFiscalDocumentData';
import { DateTime } from 'luxon';

interface ISearch {
  unit?: string;
  type?: BusinessUnitFiscalDocumentMovementType;
  bill?: string;
  active?: string;
  document?: string;
}

@inject()
export default class BusinessUnitFiscalDocumentService {
  constructor(private readonly sharedService: SharedService) {}

  async index(unitId: string, data: ISearch) {
    const qb = IssuedFiscalDocument.query().where(
      'business_unit_id',
      data.unit ?? unitId,
    );

    if (data.type) {
      qb.where('movement_type', data.type);
    }

    if (data.document) {
      qb.where('fiscal_document_id', data.document);
    }

    if (data.bill) {
      qb.where('bill_id', data.bill);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    qb.preload('corrections');

    return qb;
  }

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

  async authorize(unitId: string, user: User, data: IAuthorizeFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const issuedDocumentAlready = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('bill_id', data.billId)
        .first();

      // TODO where fiscal document ???
      if (issuedDocumentAlready) {
        throw new BadRequestException(
          'Documento já emitido',
          400,
          'E_ALREADY_ISSUED',
        );
      }

      const document = await BusinessUnitFiscalDocument.findOrFail(
        data.unitFiscalDocumentId,
        {
          client: trx,
        },
      );

      // before or after?
      await document
        .merge({
          sequence: document.sequence + 1,
        })
        .useTransaction(trx)
        .save();

      const issuedDocument = await IssuedFiscalDocument.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          bill_id: data.billId,
          movementType: data.type,
          fiscal_document_id: document.id,
          model: document.model,
          series: document.series,
          sequence: document.sequence + 1,
          accessKeyRef: data.accessKeyRef,
          user_who_authorized_id: user.id,
          authorizationDate: DateTime.now(),
          contingency: IssuedFiscalDocumentContingency.N,
          active: true,
        },
        {
          client: trx,
        },
      );

      // TODO call external service

      return issuedDocument;
    });
  }

  async cancel(unitId: string, user: User, data: ICancelFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.accessKey || // 2.15.5.1
        !document.authorizationReceipt || // 2.15.5.2
        !document.authorizationDate || // 2.15.5.3
        !!document.cancellationDate || // 2.15.5.4
        !!document.disablingReceipt // 2.15.5.5
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      await document
        .merge({
          user_who_cancelled_id: user.id,
          cancellationDate: DateTime.now(),
          cancellationReason: data.reason,
        })
        .useTransaction(trx)
        .save();

      // TODO call external service
    });
  }

  async disable(unitId: string, user: User, data: IDisableFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.authorizationDate || // 2.16.5.1
        !!document.accessKey || // 2.16.5.2
        !!document.authorizationReceipt || // 2.16.5.3
        !!document.authorizationReceiptDate || // 2.16.5.4
        !!document.cancellationReceipt || // 2.16.5.5
        !!document.disablingReceipt // 2.16.5.6
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      await document
        .merge({
          user_who_disabled_id: user.id,
          disablingDate: DateTime.now(),
          disablingReason: data.reason,
        })
        .useTransaction(trx)
        .save();

      // TODO call external service
    });
  }

  async correct(unitId: string, user: User, data: ICorrectFiscalDocument) {
    const group = await this.sharedService.getUserGroup(unitId);

    return Database.transaction(async trx => {
      const document = await IssuedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('id', data.issuedDocumentId)
        .first();

      if (!document) {
        throw this.sharedService.ResourceNotFound();
      }

      if (
        !document.accessKey || // 2.17.5.1
        !document.authorizationReceipt || // 2.17.5.2
        !document.authorizationReceiptDate || // 2.17.5.3
        !!document.cancellationReceipt || // 2.17.5.4
        !!document.disablingReceipt // 2.17.5.5
      ) {
        throw new BadRequestException(
          'Documento em estado inválido',
          400,
          'E_INVALID_STATE',
        );
      }

      const count = await CorrectedFiscalDocument.query({
        client: trx,
      })
        .where('economic_group_id', group.id)
        .where('business_unit_id', unitId)
        .where('fiscal_document_id', document.id);

      await CorrectedFiscalDocument.create(
        {
          economic_group_id: group.id,
          business_unit_id: unitId,
          fiscal_document_id: document.id,
          correctionNumber: (count.length + 1).toString(),
          user_id: user.id,
          correctedDate: DateTime.now(),
          description: data.reason,
        },
        {
          client: trx,
        },
      );

      // TODO call external service
    });
  }
}
