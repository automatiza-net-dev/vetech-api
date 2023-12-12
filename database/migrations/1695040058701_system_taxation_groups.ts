import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'system_taxation_groups';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table
        .integer('system_id')
        .unsigned()
        .references('id')
        .inTable('systems')
        .onDelete('CASCADE');

      table.string('name');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
