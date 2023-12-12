import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'system_variation_group_variations';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table
        .integer('system_variation_group_id')
        .references('system_variation_groups.id');
      table.uuid('variation_id').references('variations.id');

      table.unique(['system_variation_group_id', 'variation_id']);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
