import { inject } from '@adonisjs/fold';
import SystemUrl from 'App/Models/SystemUrl';

@inject()
export default class SystemUrlService {
  public async getSystemUrl(data: { url: string }) {
    return SystemUrl.query()
      .where('url', data.url)
      .preload('system', query => {
        query.select(['id', 'name']);
      })
      .select(['id', 'system_id', 'url', 'active'])
      .firstOrFail();
  }
}
