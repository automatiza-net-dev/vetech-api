import { inject } from '@adonisjs/fold';
import { ModelObject } from '@ioc:Adonis/Lucid/Orm';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Subgroup from 'App/Models/Subgroup';
import SharedService from 'App/Services/SharedService';
import ISubgroupData from 'Contracts/ISubgroupData';

@inject()
export default class SubgroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string) {
    const group = await this.sharedService.getUserGroup(unitId);

    const subgroups = await group
      .related('subgroups')
      .query()
      .preload('children');

    return this.listToTree(subgroups.map(s => s.toObject()));
  }

  public async show(unitId: string, id: string): Promise<Subgroup> {
    const group = await this.sharedService.getUserGroup(unitId);

    const subgroup = await group
      .related('subgroups')
      .query()
      .where('id', id)
      .first();

    if (!subgroup) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return subgroup;
  }

  public async store(unitId: string, data: Omit<ISubgroupData, 'active'>) {
    const group = await this.sharedService.getUserGroup(unitId);
    const tree = await this.getTree(data.parent);

    return group.related('subgroups').create({
      parent_id: data.parent,
      tree,
      description: data.description,
    });
  }

  public async update(unitId: string, id: string, data: ISubgroupData) {
    const subgroup = await this.show(unitId, id);

    const tree = await this.getTree(data.parent);

    return subgroup
      .merge({
        description: data.description,
        parent_id: data.parent,
        tree,
        active: data.active,
      })
      .save();
  }

  public async destroy(unitId: string, id: string) {
    const subgroup = await this.show(unitId, id);

    await subgroup.softDelete();
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

    return this.getTree(parentModel.parent_id, [parentModel.id, ...tree]);
  }

  private listToTree(arr: Array<ModelObject> = []) {
    const map = {};
    let node: ModelObject;
    const result: Array<ModelObject> = [];

    for (let i = 0; i < arr.length; i += 1) {
      map[arr[i].id] = i;
      // eslint-disable-next-line no-param-reassign
      arr[i].children = [];
    }

    for (let i = 0; i < arr.length; i += 1) {
      node = arr[i];
      if (arr[map[node.parent_id]]) {
        arr[map[node.parent_id]].children.push(node);
      } else {
        result.push(node);
      }
    }

    return result;
  }
}
