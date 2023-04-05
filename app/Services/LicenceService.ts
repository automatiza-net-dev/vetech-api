import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Licence, { LicenceType } from 'App/Models/Licence';
import Plan from 'App/Models/Plan';
import ILicenceData from 'Contracts/interfaces/ILicenceData';
import { addDays, isBefore } from 'date-fns';
import { v4 } from 'uuid';

@inject()
export default class LicenceService {
  public async addAdditionalTrial({ unit }: { unit: string }): Promise<void> {
    const trialPlan = await Plan.findBy('default', true);
    if (!trialPlan) {
      Logger.error('No trial plan');
      // should have admin role
      throw new InternalErrorException(
        'Erro interno',
        400,
        'E_INTERNAL_SERVER_ERROR',
      );
    }

    const unitEntity = await BusinessUnit.findOrFail(unit);

    const activeLicence = await unitEntity
      .related('licences')
      .query()
      .where('active', true)
      .first();

    if (!activeLicence) {
      throw new BadRequestException(
        'Não existe licença ativa',
        400,
        'E_NO_LICENCE',
      );
    }

    if (activeLicence.type !== LicenceType.TRIAL) {
      throw new BadRequestException(
        'Apenas licença em teste podem ser extendidas',
        400,
        'E_BAD_LICENCE',
      );
    }

    if (isBefore(new Date(), activeLicence.expirationDate)) {
      throw new BadRequestException(
        'Licença ainda não expirou',
        400,
        'E_BAD_LICENCE',
      );
    }

    await Database.transaction(async trx => {
      activeLicence.active = false;
      await activeLicence.useTransaction(trx).save();

      await unitEntity.related('licences').create(
        {
          id: v4(),
          type: LicenceType.ADDITIONAL_TRIAL,
          active: true,
          expirationDate: addDays(new Date(), trialPlan.trialAdditional),
        },
        {
          client: trx,
        },
      );
    });
  }

  public async custom(
    data: Pick<ILicenceData, 'business_unit_id' | 'expiration_date'>,
  ): Promise<void> {
    const unit = await BusinessUnit.findOrFail(data.business_unit_id);

    const trx = await Database.transaction();

    await Licence.query()
      .where('business_unit_id', unit.id)
      .update({ active: false })
      .useTransaction(trx);

    await unit.related('licences').create(
      {
        id: v4(),
        type: LicenceType.MANUAL,
        active: true,
        expirationDate: data.expiration_date.toJSDate(),
      },
      {
        client: trx,
      },
    );

    await trx.commit();
  }
}
