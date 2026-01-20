import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableNames = ['client_credits', 'client_used_credits']

  public async up() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table.uuid('client_id').references('id').inTable('patients').notNullable()
      })
    }
  }

  public async down() {
    for (const tableName of this.tableNames) {
      this.schema.alterTable(tableName, (table) => {
        table.dropColumn('client_id')
      })
    }
  }
}
