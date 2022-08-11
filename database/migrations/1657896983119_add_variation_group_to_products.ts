import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'products';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('variation_group_id').references('variation_groups.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('variation_group_id');
    });
  }
}
