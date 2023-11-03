import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patients';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('client_origin_item_description').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('client_origin_item_description');
    });
  }
}
