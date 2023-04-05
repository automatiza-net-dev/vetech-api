import { DateTime } from 'luxon';

export interface IOpenDailyMovementData {
  userId: string;
  openingDate: DateTime;
}

export interface ICloseDailyMovementData {
  userId: string;
  closingDate: DateTime;
  observations?: string;
}

export interface ICheckedDailyMovementData {
  userId: string;
  checkingDate: DateTime;
  observations: string;
}
