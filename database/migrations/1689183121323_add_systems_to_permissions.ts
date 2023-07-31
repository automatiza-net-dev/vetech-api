import BaseSchema from '@ioc:Adonis/Lucid/Schema';

export default class extends BaseSchema {
  protected tableName = 'permissions';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.text('systems');
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.dropColumn('systems');
    });
  }
}
