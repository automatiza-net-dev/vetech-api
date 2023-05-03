import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedule_status_changes';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('schedule_id')
        .references('id')
        .inTable('schedules')
        .onDelete('CASCADE');
      table
        .uuid('schedule_status_id')
        .references('id')
        .inTable('schedule_statuses')
        .onDelete('CASCADE');
      table
        .uuid('user_id')
        .references('id')
        .inTable('users')
        .onDelete('CASCADE');
      table
        .uuid('reason_id')
        .references('id')
        .inTable('reasons')
        .onDelete('CASCADE');

      table.text('observation').nullable();

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
