import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_unit_metas';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table
        .integer('meta_id')
        .unsigned()
        .references('id')
        .inTable('metas')
        .after('business_units_id');

      table.dropColumn('type');
      table.dropColumn('value_type');
    });
  }

  public async down() {}
}
