import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedule_service_groups';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.integer('system_id').unsigned().references('id').inTable('systems');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('system_id');
    });
  }
}
