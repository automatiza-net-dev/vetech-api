import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'patients';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.float('weight');
      table.dateTime('weight_date');
      table.string('weight_origin');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('weight');
      table.dropColumn('weight_date');
      table.dropColumn('weight_origin');
    });
  }
}
