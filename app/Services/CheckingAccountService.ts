import { inject } from '@adonisjs/fold';
import BadRequestException from 'App/Exceptions/BadRequestException';
import CheckingAccount, {
  CheckingAccountOperation,
} from 'App/Models/CheckingAccount';
import SharedService from 'App/Services/SharedService';
import {
  IOpenCheckingAccountData,
  IUpdateCheckingAccountBalanceData,
  IUpdateCheckingAccountData,
} from 'Contracts/interfaces/ICheckingAccountData';

interface ISearch {
  name?: string;
  bank?: string;
  type?: string;
}

@inject()
export default class CheckingAccountService {
  constructor(private readonly sharedService: SharedService) { }

  public async index(unitId: string, data: ISearch) {
    const qb = CheckingAccount.query().where('business_unit_id', unitId);

    if (data.name) {
      qb.where('description', 'ilike', `%${data.name}%`);
    }

    if (data.bank) {
      qb.where('bankName', 'ilike', `%${data.bank}%`);
    }

    if (data.type) {
      qb.where('type', `%${data.type}%`);
    }

    return qb;
  }

  public async show(unitId: string, id: string) {
    const account = await CheckingAccount.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!account) {
      throw this.sharedService.ResourceNotFound();
    }

    return account;
  }

  public async checkBalance(unitId: string, id: string) {
    const account = await CheckingAccount.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!account) {
      throw this.sharedService.ResourceNotFound();
    }

    return {
      id: account.id,
      balance: parseFloat(account.balance as unknown as string),
      active: account.active,
    };
  }

  public async openAccount(unitId: string, data: IOpenCheckingAccountData) {
    const group = await this.sharedService.getUserGroup(unitId);

    return CheckingAccount.create({
      economic_group_id: group.id,
      business_unit_id: unitId,
      description: data.description,
      accountNumber: data.accountNumber,
      bankCode: data.bankCode,
      bankName: data.bankName,
      agency: data.agency,
      type: data.type,
      balance: 0,

      limit: data.limit,
      agencyPhone: data.agencyPhone,
      managerName: data.managerName,
      managerEmail: data.managerEmail,
      managerPhone: data.managerPhone,
    });
  }

  public async updateAccount(
    unitId: string,
    id: string,
    data: IUpdateCheckingAccountData,
  ) {
    const account = await CheckingAccount.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!account) {
      throw this.sharedService.ResourceNotFound();
    }

    return account
      .merge({
        description: data.description,
        bankCode: data.bankCode,
        bankName: data.bankName,
        agency: data.agency,
        type: data.type,
        active: data.active,
        agencyPhone: data.agencyPhone,
        managerName: data.managerName,
        managerPhone: data.managerPhone,
        managerEmail: data.managerEmail,
        limit: data.limit,
      })
      .save();
  }

  public async updateBalance(
    unitId: string,
    id: string,
    data: IUpdateCheckingAccountBalanceData,
  ) {
    const account = await CheckingAccount.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!account) {
      throw this.sharedService.ResourceNotFound();
    }

    const newBalance =
      data.operation === CheckingAccountOperation.C
        ? parseFloat(account.balance as unknown as string) + data.amount
        : parseFloat(account.balance as unknown as string) - data.amount;

    account.balance = newBalance;

    await account.save();
  }

  public async deleteAccount(unitId: string, id: string) {
    const account = await CheckingAccount.query()
      .where('id', id)
      .where('business_unit_id', unitId)
      .first();

    if (!account) {
      throw this.sharedService.ResourceNotFound();
    }

    if (parseFloat(account.balance as unknown as string) > 0) {
      throw new BadRequestException('Não é possível apagar conta com saldo');
    }

    await account.softDelete();
  }
}
