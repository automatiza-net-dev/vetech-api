import BaseSchema from '@ioc:Adonis/Lucid/Schema';
import WeekDay from 'App/Models/shared/WeekDay';

export default class extends BaseSchema {
  protected tableName = 'unavailable_days';

  public async up() {
    this.schema.alterTable(this.tableName, table => {
      table.time('start_hour').alter();
      table.time('end_hour').alter();

      table.string('frequency').defaultTo(WeekDay.SEGUNDA);
      table.date('start_date');
      table.date('end_date');
      table.boolean('active').defaultTo(true);
    });
  }

  public async down() {
    this.schema.alterTable(this.tableName, table => {
      table.timestamp('start_hour').alter();
      table.timestamp('end_hour').alter();

      table.dropColumn('frequency');
      table.dropColumn('start_date');
      table.dropColumn('end_date');
      table.dropColumn('active');
    });
  }
}
