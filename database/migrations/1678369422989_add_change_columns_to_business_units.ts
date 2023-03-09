import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'business_units';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('state_registration');
      table.string('city_registration');
      table.string('cnae');
      table.boolean('simple').defaultTo(true);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('state_registration');
      table.dropColumn('city_registration');
      table.dropColumn('cnae');
      table.dropColumn('simple');
    });
  }
}
