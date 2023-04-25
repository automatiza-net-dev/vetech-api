import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'kits';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.increments('id');

      table.uuid('economic_group_id').references('economic_groups.id');

      table.text('description');
      table.timestamp('from_expiration');
      table.timestamp('to_expiration');
      table.boolean('active').defaultTo(true);

      table.timestamp('created_at', { useTz: true });
      table.timestamp('updated_at', { useTz: true });
    });
  }

  public async down() {
    this.schema.dropTable(this.tableName);
  }
}
