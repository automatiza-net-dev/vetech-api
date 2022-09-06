import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.setNullable('ncm');
      table.setNullable('cest');
      table.setNullable('features');
      table.setNullable('unity_type');
      table.setNullable('group_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropNullable('ncm');
      table.dropNullable('cest');
      table.dropNullable('features');
      table.dropNullable('unity_type');
      table.dropNullable('group_id');
    });
  }
}
