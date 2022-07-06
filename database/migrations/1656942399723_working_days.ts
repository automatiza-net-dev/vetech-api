import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'working_days';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('user_id').references('users.id');
      table.uuid('economic_group_id').references('economic_groups.id');
      table.string('day_of_week');
      table.timestamp('start_hour');
      table.timestamp('end_hour');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
