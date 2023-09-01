import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_logs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('balance').nullable().alter();
    });
  }

  public async down() {}
}
