import { test } from '@japa/runner';
import SharedService, { DateSet } from 'App/Services/SharedService';
import { addMinutes } from 'date-fns';

test.group('Date overlapping', () => {
  const service = new SharedService();

  test('should return false for not overlapping dates', ({ assert }) => {
    const ASet: DateSet = {
      start: new Date(),
      end: addMinutes(new Date(), 1),
    };
    const BSet: DateSet = {
      start: addMinutes(new Date(), 2),
      end: addMinutes(new Date(), 3),
    };

    assert.isFalse(service.checkOverlapping(ASet, BSet));
  });

  test('should return false for end for sequential', ({ assert }) => {
    const ASet: DateSet = {
      start: new Date(),
      end: addMinutes(new Date(), 1),
    };
    const BSet: DateSet = {
      start: addMinutes(new Date(), 1),
      end: addMinutes(new Date(), 3),
    };

    assert.isFalse(service.checkOverlapping(ASet, BSet));
  });

  test('should return true for overlapping', ({ assert }) => {
    const ASet: DateSet = {
      start: new Date(),
      end: addMinutes(new Date(), 2),
    };
    const BSet: DateSet = {
      start: addMinutes(new Date(), 1),
      end: addMinutes(new Date(), 3),
    };

    assert.isTrue(service.checkOverlapping(ASet, BSet));
  });
});
