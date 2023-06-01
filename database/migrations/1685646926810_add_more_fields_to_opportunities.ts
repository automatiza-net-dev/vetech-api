import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunities';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('business_unit_id')
        .references('id')
        .inTable('business_units')
        .onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('business_unit_id');
    });
  }
}
