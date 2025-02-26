import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'bills'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
			table.dropChecks("bills_cancelled_check")
    })
  }

  public async down () {
  }
}
