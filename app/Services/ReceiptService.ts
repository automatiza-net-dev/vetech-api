import { inject } from '@adonisjs/fold';
import { AuthContext } from 'App/Services/SharedService';

@inject()
export default class ReceiptService {
  store(authCtx: AuthContext, data: {}) {}
}
