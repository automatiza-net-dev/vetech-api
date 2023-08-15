import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'ip_access_controls';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('business_unit_id')
        .references('id')
        .inTable('business_units')
        .onDelete('CASCADE');
      table.dropColumn('economic_group_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');
      table.dropColumn('business_unit_id');
    });
  }
}
