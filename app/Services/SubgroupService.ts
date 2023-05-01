import { inject } from '@adonisjs/fold';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import Subgroup from 'App/Models/Subgroup';
import SharedService, { AuthContext } from 'App/Services/SharedService';
import ISubgroupData from 'Contracts/interfaces/ISubgroupData';

interface ISearch {
  description?: string;
}

@inject()
export default class SubgroupService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(authCtx: AuthContext, data: ISearch) {
    const qb = Subgroup.query()
      .whereRaw('(economic_group_id = ? or economic_group_id is null)', [
        authCtx.group.id,
      ])
      .where('system_id', authCtx.system.id)
      .preload('parent');

    if (data.description) {
      qb.where('description', 'like', `%${data.description}%`);
    }

    return qb;
  }

  public async show(authCtx: AuthContext, id: string): Promise<Subgroup> {
    const subgroup = await Subgroup.query()
      .where('id', id)
      .preload('variationGroup')
      .preload('parent')
      .where('system_id', authCtx.system.id)
      .first();

    if (!subgroup) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    if (
      subgroup.economic_group_id &&
      subgroup.economic_group_id !== authCtx.group.id
    ) {
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return subgroup;
  }

  public async store(
    authCtx: AuthContext,
    data: Omit<ISubgroupData, 'active'>,
  ) {
    const tree = await this.getTree(data.parent);

    return authCtx.group.related('subgroups').create({
      parent_id: data.parent,
      tree,
      description: data.description,
      variation_group_id: data.variationGroup,
    });
  }

  public async update(authCtx: AuthContext, id: string, data: ISubgroupData) {
    const subgroup = await this.show(authCtx, id);

    if (!subgroup.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

    const tree = await this.getTree(data.parent);

    return subgroup
      .merge({
        description: data.description,
        parent_id: data.parent,
        tree,
        active: data.active,
        variation_group_id: data.variationGroup,
      })
      .save();
  }

  public async destroy(authCtx: AuthContext, id: string) {
    const subgroup = await this.show(authCtx, id);

    if (!subgroup.economic_group_id) {
      throw this.sharedService.SystemResource();
    }

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

  // private listToTree(arr: Array<ModelObject> = []) {
  //   const map = {};
  //   let node: ModelObject;
  //   const result: Array<ModelObject> = [];

  //   for (let i = 0; i < arr.length; i += 1) {
  //     map[arr[i].id] = i;
  //     // eslint-disable-next-line no-param-reassign
  //     arr[i].children = [];
  //   }

  //   for (let i = 0; i < arr.length; i += 1) {
  //     node = arr[i];
  //     if (arr[map[node.parent_id]]) {
  //       arr[map[node.parent_id]].children.push(node);
  //     } else {
  //       result.push(node);
  //     }
  //   }

  //   return result;
  // }

  // private mapModelObject(subgroup: Subgroup): ModelObject {
  //   const data = subgroup.toObject();

  //   // eslint-disable-next-line no-param-reassign
  //   delete data.tree;
  //   // eslint-disable-next-line no-param-reassign
  //   delete data.deletedAt;
  //   // eslint-disable-next-line no-param-reassign
  //   delete data.$extras;

  //   return data;
  // }
}
