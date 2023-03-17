import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_units';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('city_code');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('city_code');
    });
  }
}
