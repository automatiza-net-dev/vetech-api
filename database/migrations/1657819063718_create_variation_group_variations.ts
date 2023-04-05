import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'variation_group_variations';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('group_variation_id').references('variation_groups.id');
      table.uuid('variation_id').references('variations.id');

      table.unique(['group_variation_id', 'variation_id']);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
