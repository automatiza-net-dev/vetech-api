import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bills'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('user_who_closed_id').references('users.id');
      table.dateTime('closing_date');
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_who_closed_id');
      table.dropColumn('closing_date');
    })
  }
}
