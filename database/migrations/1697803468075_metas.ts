import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'metas';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .uuid('economic_group_id')
        .references('id')
        .inTable('economic_groups')
        .onDelete('CASCADE');

      table.string('description');
      table.string('type');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.timestamp('deleted_at', { useTz: true }).defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
