import {
  BaseModel,
  LucidRow,
  ModelQueryBuilderContract,
} from '@ioc:Adonis/Lucid/Orm';
import { DateTime } from 'luxon';

// Optional null check query
export const softDeleteQuery = (
  query: ModelQueryBuilderContract<typeof BaseModel>,
) => {
  query.whereNull('deleted_at');
};

export const softDelete = async (row: LucidRow, column = 'deletedAt') => {
  if (!row[column]) {
    // eslint-disable-next-line no-param-reassign
    row[column] = DateTime.local();
    await row.save();
  }
};
