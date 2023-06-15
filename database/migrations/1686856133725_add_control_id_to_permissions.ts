import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'permissions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.string('control_id');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('control_id');
    });
  }
}
