import Database from '@ioc:Adonis/Lucid/Database';
import { test } from '@japa/runner';

test.group('Patient resource', group => {
  group.each.setup(async () => {
    await Database.beginGlobalTransaction();
    return () => Database.rollbackGlobalTransaction();
  });

  const createData = async (): Promise<[]> => {
    return [];
  };
});
