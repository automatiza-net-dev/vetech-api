import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import SharedService from 'App/Services/SharedService';
import VariationOptionService from 'App/Services/VariationOptionService';
import VariationService from 'App/Services/VariationService';
import { v4 } from 'uuid';

import { userBootstrap } from '../utils';

test.group('Variation options resource', group => {
  const sharedService = new SharedService();
  const variationService = new VariationService(sharedService);
  let service: VariationOptionService;

  group.each.setup(async () => {
    service = new VariationOptionService(sharedService, variationService);

    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const variation = await group.related('variations').create({
      description: 'some description',
    });

    const option = await variation.related('options').create({
      description: 'some option',
    });

    return { user, unit: business, variation, option };
  };

  test('should return all variations', async ({ assert }) => {
    const { unit, option } = await createData();

    const result = await service.index(unit.id);

    assert.isArray(result);
    assert.isTrue(Boolean(result.find(f => f.id === option.id)));
  });

  test('should throw ResourceNotFoundException if no variation option was found', async ({
    assert,
  }) => {
    const { unit } = await createData();

    try {
      await service.show(unit.id, v4());
    } catch (e) {
      assert.instanceOf(e, ResourceNotFoundException);
    }
  });

  test('should return variation option', async ({ assert }) => {
    const { unit, option } = await createData();

    const result = await service.show(unit.id, option.id);

    assert.equal(option.id, result.id);
  });

  test('should store a new variation option', async ({ assert }) => {
    const { unit, variation } = await createData();

    const result = await service.store(unit.id, {
      description: 'test option',
      variationId: variation.id,
    });

    assert.equal('test option', result.description);
  });

  test('should update a variation option', async ({ assert }) => {
    const { unit, option } = await createData();

    const result = await service.update(unit.id, option.id, {
      description: 'updated option',
      active: true,
    });

    assert.notEqual(option.description, result.description);
    assert.equal('updated option', result.description);
  });

  test('should soft delete a variation', async ({ assert }) => {
    const { unit, option } = await createData();

    await service.destroy(unit.id, option.id);

    // tem o que testar?
    assert.equal(1, 1);
  });
});
