import { inject } from '@adonisjs/fold';
import Subgroup from 'App/Models/Subgroup';
import SharedService from 'App/Services/SharedService';
import ISubgroupData from 'Contracts/ISubgroupData';

@inject()
export default class SubgroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async store(unitId: string, data: Omit<ISubgroupData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);
    const tree = await this.getTree(data.parent);

    return group.related('subgroups').create({
      parent_id: data.parent,
      tree,
      description: data.description,
    });
  }

  private async getTree(
    parent?: string,
    tree: Array<string> = [],
  ): Promise<Array<string>> {
    if (!parent) {
      return tree;
    }

    const parentModel = await Subgroup.find(parent);
    if (!parentModel) {
      return this.getTree(undefined, tree);
    }

    return this.getTree(parentModel.parent_id, [...tree, parentModel.id]);
  }
}
