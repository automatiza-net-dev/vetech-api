import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'species';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.string('description');
      table.uuid('economic_group_id').references('economic_groups.id');

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
      table.dateTime('deleted_at').defaultTo(null);
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
