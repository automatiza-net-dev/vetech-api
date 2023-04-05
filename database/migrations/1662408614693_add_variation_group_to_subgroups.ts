import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'subgroups';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('variation_group_id')
        .nullable()
        .references('variation_groups.id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('variation_group_id');
    });
  }
}
