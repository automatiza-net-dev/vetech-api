import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'taxation_groups'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('type').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })
  }
}
