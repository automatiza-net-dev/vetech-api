import { inject } from '@adonisjs/fold';
import Opportunity from 'App/Models/Opportunity';
import { DateTime } from 'luxon';

import { AuthContext } from './SharedService';

@inject()
export default class OpportunityService {
  // constructor(private sharedService: SharedService) {}

  public async store(
    authCtx: AuthContext,
    data: {
      userId: string;
      clientId: string;
      contactId: string;
      statusId: number;
      contactDate: DateTime;
      contactTypeId: number;
      contactSubjectId: number;
      originId: string;
      description: string;
      observation: string;
      value: number;
    },
  ) {
    await Opportunity.create({
      system_id: authCtx.system.id,
      economic_group_id: authCtx.group.id,
      opening_user_id: authCtx.user.id,
      user_id: data.userId,
      client_id: data.clientId,
      contact_id: data.contactId,
      status_id: data.statusId,
      contact_type_id: data.contactTypeId,
      contact_subject_id: data.contactSubjectId,
      client_origin_id: data.originId,

      openingDate: DateTime.now(),
      contactDate: data.contactDate,
      description: data.description,
      observation: data.observation,
      value: data.value,
    });
  }
}
