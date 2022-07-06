import BaseSchema from '@ioc:Adonis/Lucid/Schema';
import { v4 } from 'uuid';

export default class extends BaseSchema {
  protected tableName = 'unavailable_days';

  public async up() {
    this.schema.createTable(this.tableName, table => {
      table.uuid('id').primary().defaultTo(v4());

      table.uuid('user_id').references('users.id');
      table.uuid('economic_group_id').references('economic_groups.id');
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
