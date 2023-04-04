import { inject } from '@adonisjs/fold';
import Logger from '@ioc:Adonis/Core/Logger';
import Database from '@ioc:Adonis/Lucid/Database';
import InternalErrorException from 'App/Exceptions/InternalErrorException';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import BusinessUnit from 'App/Models/BusinessUnit';
import Product, { ProductType } from 'App/Models/Product';
import VariationGroup from 'App/Models/VariationGroup';
import SharedService from 'App/Services/SharedService';
import IProductData, {
  IProductDataVariation,
} from 'Contracts/interfaces/IProductData';
import IUpdateProduct from 'Contracts/interfaces/IUpdateProduct';

interface ISearch {
  description?: string;
  reference?: string;
  collection?: number;
  purpose?: string;
  subgroup?: string;
  taxation?: string;
  active?: string;
}

@inject()
export default class ProductService {
  constructor(private readonly sharedService: SharedService) {}

  public async index(unitId: string, data: ISearch) {
    const group = await this.sharedService.getUserGroup(unitId);

    const qb = group
      .related('products')
      .query()
      .preload('brand')
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
          query.where('businness_unit_id', unitId);

          query.preload('businessUnit', query => {
            query.select('id', 'fantasyName', 'companyName', 'identification');
          });
        });

        query.preload('variationOptions', query => {
          query.select('id', 'description', 'active');
        });
      })
      .preload('variationGroup', query => {
        query.select('id', 'description', 'active');
      })
      .preload('taxationGroup')
      .where('type', ProductType.PRODUCT);

    if (data.description) {
      qb.where('description', 'ilike', `%${data.description}%`);
    }

    if (data.reference) {
      qb.where('reference_code', 'ilike', `%${data.reference}%`);
    }

    if (data.collection) {
      qb.where('collection_year', data.collection);
    }

    if (data.purpose) {
      qb.where('purpose', data.purpose);
    }

    if (data.subgroup) {
      qb.where('subgroup_id', data.subgroup);
    }

    if (data.taxation) {
      qb.where('taxation_group_id', data.taxation);
    }

    if (data.active) {
      qb.where('active', data.active === 'true');
    }

    const result = await qb;

    return result.map(product => ({
      id: product.id,
      description: product.description,
      referenceCode: product.referenceCode,
      purpose: product.purpose,
      active: product.active,
      created_at: product.createdAt,
      subgroup: {
        id: product.subgroup?.id ?? null,
        description: product.subgroup?.description ?? null,
      },
      taxationGroup: {
        id: product.taxationGroup?.id ?? null,
        name: product.taxationGroup?.name ?? null,
      },
      price: {
        id: product.variations[0]?.id ?? null,
        value:
          parseFloat(
            product.variations[0]?.businessUnitProducts[0]
              ?.price as unknown as string,
          ) ?? null,
      },
    }));
  }

  public async show(unitId: string, id: string): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);

    const product = await group
      .related('products')
      .query()
      .where('id', id)
      .preload('brand')
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
      throw new ResourceNotFoundException(
        'Recurso não encontrado',
        404,
        'E_NOT_FOUND',
      );
    }

    return product;
  }

  public async store(
    unitId: string,
    data: Omit<IProductData, 'active'>,
  ): Promise<Product> {
    const group = await this.sharedService.getUserGroup(unitId);
    const businessUnits = await BusinessUnit.query().where(
      'economic_group_id',
      group.id,
    );

    const variationGroup = data.variationGroup
      ? await VariationGroup.find(data.variationGroup)
      : null;

    const trx = await Database.transaction();

    try {
      const product = await Product.create(
        {
          description: data.description,
          type: ProductType.PRODUCT,
          referenceCode: data.referenceCode,
          collectionYear: data.collectionYear,
          ncm: data.ncm,
          cest: data.cest,
          features: data.features,
          unit_id: data.unitId,
          icmsOrigin: data.icmsOrigin,
          economic_group_id: group.id,
          variation_group_id: variationGroup?.id,
          taxation_group_id: data.taxationGroupId,
          group_id: data.groupId,
          subgroup_id: data.subgroupId,
          brand_id: data.brandId,
          taxBenefitCode: data.taxBenefitCode,
          anvisaCode: data.anvisaCode,
          purpose: data.purpose,
        },
        {
          client: trx,
        },
      );

      // eslint-disable-next-line no-restricted-syntax
      for await (const variation of data.variations) {
        // product_variations
        const prodVariation = await product.related('variations').create(
          {
            barcode: variation.barcode,
          },
          {
            client: trx,
          },
        );

        await prodVariation
          .related('variationOptions')
          .sync(variation.variation_options ?? []);

        // eslint-disable-next-line no-restricted-syntax
        for await (const unit of businessUnits) {
          const unitPrice = this.checkForPrice(unit, variation);

          // business_unit_products
          await prodVariation.related('businessUnitProducts').create(
            {
              businness_unit_id: unit.id,
              stock: 0,
              price: unitPrice.price,
              costPrice: unitPrice.costPrice,
              maximumStock: unitPrice.maximumStock,
              minimumStock: unitPrice.minimumStock,
              maximumDiscountPercentage: unitPrice.maximumDiscountPercentage,
              maximumDiscountValue: unitPrice.maximumDiscountValue,
              profitMargin: unitPrice.profitMargin,
              commission: unitPrice.commission,
              commissionMeta: unitPrice.commissionMeta,
              meta: unitPrice.meta,
              metaType: unitPrice.metaType,
            },
            {
              client: trx,
            },
          );
        }
      }

      await trx.commit();

      return product;
    } catch (e) {
      Logger.error(e);
      await trx.rollback();

      throw new InternalErrorException(
        'Erro na execução',
        500,
        'E_INTERNAL_ERROR',
      );
    }
  }

  public async update(
    unitId: string,
    id: string,
    data: IUpdateProduct,
  ): Promise<Product> {
    const product = await this.show(unitId, id);

    return product
      .merge({
        description: data.description,
        referenceCode: data.referenceCode,
        collectionYear: data.collectionYear,
        ncm: data.ncm,
        cest: data.cest,
        features: data.features,
        unit_id: data.unitId,
        active: data.active,
        group_id: data.groupId,
        subgroup_id: data.subgroupId,
        icmsOrigin: data.icmsOrigin,
        taxation_group_id: data.taxationGroupId,
        brand_id: data.brandId,
        taxBenefitCode: data.taxBenefitCode,
        anvisaCode: data.anvisaCode,
      })
      .save();
  }

  public async destroy(unitId: string, id: string): Promise<void> {
    const product = await this.show(unitId, id);

    await product.softDelete();
  }

  private checkForPrice(unit: BusinessUnit, data: IProductDataVariation) {
    if (!data.specificPrice || data.specificPrice.length === 0) {
      return data.price;
    }

    const specificPrice = data.specificPrice.find(f => f.business === unit.id);

    if (specificPrice) return specificPrice.price;

    return data.price;
  }
}
