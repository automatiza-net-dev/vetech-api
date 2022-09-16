import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'exams';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');

      table.dropColumn('business_unit_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('economic_group_id');

      table.uuid('business_unit_id').references('business_units.id').nullable();
    });
  }
}
