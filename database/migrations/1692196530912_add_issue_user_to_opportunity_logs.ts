import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'opportunity_logs';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.uuid('issue_user_id').references('users.id').onDelete('CASCADE');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('issue_user_id');
    });
  }
}
