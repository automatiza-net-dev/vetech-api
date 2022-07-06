import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'schedule_service_types';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary();

      table
        .uuid('schedule_service_group_id')
        .references('schedule_service_groups.id');
      table
        .uuid('economic_group_id')
        .references('economic_groups.id')
        .nullable();
      table.string('description');
      table.integer('reserved_minutes');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
