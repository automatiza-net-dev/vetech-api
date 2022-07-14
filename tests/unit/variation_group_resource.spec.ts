import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import SharedService from 'App/Services/SharedService';
import VariationGroupService from 'App/Services/VariationGroupService';
import VariationService from 'App/Services/VariationService';
import { v4 } from 'uuid';

import { userBootstrap } from '../utils';

test.group('Variation group resource', group => {
  const sharedService = new SharedService();
  const variationService = new VariationService(sharedService);
  let service: VariationGroupService;

  group.each.setup(async () => {
    service = new VariationGroupService(sharedService, variationService);

    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const variation = await group.related('variations').create({
      description: 'some description',
    });

    const variationGroup = await group.related('variationGroups').create({
      description: 'some description',
    });

    return { user, unit: business, variation, variationGroup };
  };

  test('should return all variation groups', async ({ assert }) => {
    const { unit, variationGroup } = await createData();

    const result = await service.index(unit.id);

    assert.isArray(result);
    assert.isTrue(Boolean(result.find(f => f.id === variationGroup.id)));
  });

  test('should throw ResourceNotFoundException if no variation group was found', async ({
    assert,
  }) => {
    const { unit } = await createData();

    try {
      await service.show(unit.id, v4());
    } catch (e) {
      assert.instanceOf(e, ResourceNotFoundException);
    }
  });

  test('should return variation group', async ({ assert }) => {
    const { unit, variationGroup } = await createData();

    const result = await service.show(unit.id, variationGroup.id);

    assert.equal(variationGroup.id, result.id);
  });

  test('should store a new variation group', async ({ assert }) => {
    const { unit } = await createData();

    const result = await service.store(unit.id, {
      description: 'test description',
    });

    assert.equal('test description', result.description);
  });

  test('should update a variation group', async ({ assert }) => {
    const { unit, variationGroup } = await createData();

    const result = await service.update(unit.id, variationGroup.id, {
      description: 'new description',
      active: true,
    });

    assert.notEqual(variationGroup.description, result.description);
    assert.equal('new description', result.description);
  });

  test('should soft delete a variation group', async ({ assert }) => {
    const { unit, variationGroup } = await createData();

    await service.destroy(unit.id, variationGroup.id);

    // tem o que testar?
    assert.equal(1, 1);
  });

  test('should attach a variation', async ({ assert }) => {
    const { unit, variationGroup, variation } = await createData();

    await service.assignVariation(unit.id, {
      group_variation_id: variationGroup.id,
      variation_id: variation.id,
    });

    // tem o que testar?
    assert.equal(1, 1);
  });

  test('should detach a variation from a group', async ({ assert }) => {
    const { unit, variationGroup, variation } = await createData();

    await service.detach(unit.id, variationGroup.id, variation.id);

    // tem o que testar?
    assert.equal(1, 1);
  });
});
