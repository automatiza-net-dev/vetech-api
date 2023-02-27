import { inject } from '@adonisjs/fold';
import Database from '@ioc:Adonis/Lucid/Database';
import BusinessUnit from 'App/Models/BusinessUnit';
import Product, { ProductType } from 'App/Models/Product';
import SharedService from 'App/Services/SharedService';
import IServiceData, {
  IUpdateService,
} from 'Contracts/interfaces/IServiceData';

interface ISearch {
  description?: string;
}

@inject()
export default class ServiceService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch): Promise<Array<Product>> {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = group
      .related('products')
      .query()
      .where('type', ProductType.SERVICE)
      .preload('unit')
      .preload('group', query => {
        query.select('id', 'name', 'active');
      })
      .preload('subgroup', query => {
        query.select('id', 'description');
      })
      .preload('variations', query => {
        query.orderBy('created_at', 'desc');
        query.select('id', 'barcode', 'active');

        query.preload('businessUnitProducts', query => {
          query.preload('businessUnit', query => {
            query.select('id', 'fantasyName', 'companyName', 'identification');
          });
        });

        query.preload('variationOptions', subquery => {
          subquery.select('id', 'description', 'active');
        });
      })
      .preload('variationGroup', query => {
        query.select('id', 'description', 'active');
      })
      .preload('taxationGroup');

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);

    const product = await group
      .related('products')
      .query()
      .where('id', id)
      .where('type', ProductType.SERVICE)
      .preload('unit')
      .preload('taxationGroup')
      .preload('group', query => {
        query.select('id', 'name', 'active');
      })
      .preload('subgroup', query => {
        query.select('id', 'description');
      })
      .preload('variations', query => {
        query.orderBy('created_at', 'desc');
        query.select('id', 'barcode', 'active');

        query.preload('businessUnitProducts', query => {
          query.preload('businessUnit', query => {
            query.select('id', 'fantasyName', 'companyName', 'identification');
          });
        });

        query.preload('variationOptions', subquery => {
          subquery.select('id', 'description', 'active');
        });
      })
      .preload('variationGroup', query => {
        query.select('id', 'description', 'active');
      })
      .first();

    if (!product) {
      throw this.sharedService.ResourceNotFound();
    }

    return product;
  }

  public async store(unitId: string, data: IServiceData) {
    const group = await this.sharedService.getUserGroup(unitId);

    await Database.transaction(async trx => {
      const businessUnits = await BusinessUnit.query()
        .useTransaction(trx)
        .where('economic_group_id', group.id)
        .preload('unitConfig', query => {
          query.preload('serviceVariationGroup');
        });

      const someUnitConfig = businessUnits.find(
        bu => bu.unitConfig,
      )?.unitConfig;

      const service = await Product.create(
        {
          description: data.description,
          type: ProductType.SERVICE,
          referenceCode: data.referenceCode,
          features: data.features,
          unit_id: data.unitId,
          economic_group_id: group.id,
          taxation_group_id: data.taxationGroupId,
          subgroup_id: data.subgroupId,
          icmsOrigin: '0',
          ncm: '00',
          variation_group_id: someUnitConfig?.service_variation_group_id,
        },
        {
          client: trx,
        },
      );

      const servVariation = await service.related('variations').create(
        {
          barcode: undefined,
        },
        {
          client: trx,
        },
      );

      await servVariation.related('businessUnitProducts').createMany(
        businessUnits.map(unit => ({
          businness_unit_id: unit.id,
          stock: 0,
          price: data.price.price,
          costPrice: data.price.costPrice,
          maximumStock: 0,
          minimumStock: 0,
          maximumDiscountPercentage: data.price.maximumDiscountPercentage,
          maximumDiscountValue: data.price.maximumDiscountValue,
          profitMargin: data.price.profitMargin,
          commission: data.price.commission,
          commissionMeta: data.price.commissionMeta,
          meta: data.price.meta,
          metaType: data.price.metaType,
        })),
        {
          client: trx,
        },
      );
    });
  }

  public async update(
    unitId: string,
    id: string,
    data: IUpdateService,
  ): Promise<Product> {
    const service = await this.show(unitId, id);

    return service
      .merge({
        description: data.description,
        referenceCode: data.referenceCode,
        features: data.features,
        unit_id: data.unitId,
        active: data.active,
        subgroup_id: data.subgroupId,
        taxation_group_id: data.taxationGroupId,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const product = await this.show(unitId, id);

    await product.softDelete();
  }
}
