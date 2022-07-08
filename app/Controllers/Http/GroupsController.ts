// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import GroupService from 'App/Services/GroupService';
import SharedService from 'App/Services/SharedService';

@inject()
export default class GroupsController {
  constructor(
    private readonly sharedService: SharedService,
    private readonly service: GroupService,
  ) {}
}
