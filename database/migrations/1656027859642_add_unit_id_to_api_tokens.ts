import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'api_tokens';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('unit_id').nullable();
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('unit_id');
    });
  }
}
