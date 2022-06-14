// import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import { inject } from '@adonisjs/fold';
import EconomicGroupService from 'App/Services/EconomicGroupService';

@inject()
export default class EconomicGroupsController {
  constructor(private readonly groupService: EconomicGroupService) {}
}
