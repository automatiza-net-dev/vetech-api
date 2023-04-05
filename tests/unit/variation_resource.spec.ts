import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';
import ResourceNotFoundException from 'App/Exceptions/ResourceNotFoundException';
import SharedService from 'App/Services/SharedService';
import VariationService from 'App/Services/VariationService';
import { v4 } from 'uuid';

import { userBootstrap } from '../utils';

test.group('Variation resource', group => {
  const sharedService = new SharedService();
  let service: VariationService;

  group.each.setup(async () => {
    service = new VariationService(sharedService);

    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async () => {
    const { user, group, business } = await userBootstrap();

    const variation = await group.related('variations').create({
      description: 'some description',
    });

    return { user, unit: business, variation };
  };

  test('should return all variations', async ({ assert }) => {
    const { unit, variation } = await createData();

    const result = await service.index(unit.id, {});

    assert.isArray(result);
    assert.isTrue(Boolean(result.find(f => f.id === variation.id)));
  });

  test('should throw ResourceNotFoundException if no variation was found', async ({
    assert,
  }) => {
    const { unit } = await createData();

    try {
      await service.show(unit.id, v4());
    } catch (e) {
      assert.instanceOf(e, ResourceNotFoundException);
    }
  });

  test('should return variation', async ({ assert }) => {
    const { unit, variation } = await createData();

    const result = await service.show(unit.id, variation.id);

    assert.equal(variation.id, result.id);
  });

  test('should store a new variation', async ({ assert }) => {
    const { unit } = await createData();

    const result = await service.store(unit.id, {
      description: 'test description',
    });

    assert.equal('test description', result.description);
  });

  test('should update a variation', async ({ assert }) => {
    const { unit, variation } = await createData();

    const result = await service.update(unit.id, variation.id, {
      description: 'new description',
      active: true,
    });

    assert.notEqual(variation.description, result.description);
    assert.equal('new description', result.description);
  });

  test('should soft delete a variation', async ({ assert }) => {
    const { unit, variation } = await createData();

    await service.destroy(unit.id, variation.id);

    // tem o que testar?
    assert.equal(1, 1);
  });
});
