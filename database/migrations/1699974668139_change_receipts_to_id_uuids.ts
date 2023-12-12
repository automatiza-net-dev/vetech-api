import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'receipts';

  public async up() {}

  public async down() {}
}
