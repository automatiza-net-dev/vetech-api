import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'reschedulings';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table.uuid('schedule_id').references('schedules.id');
      table.uuid('user_id').references('users.id');
      table.uuid('reason_id').references('reasons.id');

      table.text('observation');

      table.timestamp('original_date', { useTz: true });

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
