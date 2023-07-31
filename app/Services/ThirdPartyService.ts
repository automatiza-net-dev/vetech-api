import { inject } from '@adonisjs/fold';
import { AuthContract } from '@ioc:Adonis/Addons/Auth';
import Hash from '@ioc:Adonis/Core/Hash';
import Database from '@ioc:Adonis/Lucid/Database';
import BadRequestException from 'App/Exceptions/BadRequestException';
import BusinessUnit from 'App/Models/BusinessUnit';
import ProfileAccess from 'App/Models/ProfileAccess';
import RoleProfileAccess from 'App/Models/RoleProfileAccess';
import ThirdPartyUserPermission from 'App/Models/ThirdPartyUserPermission';
import User from 'App/Models/User';
import { AuthContext } from 'App/Services/SharedService';

@inject()
export default class ThirdPartyService {
  private unauthotizedException = new BadRequestException(
    'Credenciais inválidas',
    400,
    'E_INVALID',
  );

  public async authenticate(
    authContract: AuthContract,
    system: 'Vetech' | 'LiftOne' | 'Sanclá',
    data: {
      key: string;
      password: string;
    },
  ) {
    const tpUser = await ThirdPartyUserPermission.query()
      .where('key', data.key)
      .whereHas('system', query => {
        query.where('name', system);
      })
      .first();

    if (!tpUser) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(tpUser.password, data.password))) {
      throw this.unauthotizedException;
    }

    const token = await authContract.use('tpApi').generate(tpUser, {
      expiresIn: '1y',
    });

    return {
      token: token.token,
      expirates_at: token.expiresAt,
    };
  }

  public async extendedAuthenticate(
    authContract: AuthContract,
    system: 'Vetech' | 'LiftOne' | 'Sanclá',
    data: {
      appKey: string;
      appPassword: string;

      userEmail: string;
      userPassword: string;
    },
  ) {
    const tpUser = await ThirdPartyUserPermission.query()
      .where('key', data.appKey)
      .whereHas('system', query => {
        query.where('name', system);
      })
      .first();

    if (!tpUser) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(tpUser.password, data.appPassword))) {
      throw this.unauthotizedException;
    }

    const user = await User.query()
      .where('email', data.userEmail)
      .where('system_id', tpUser.system_id)
      .first();

    if (!user) {
      throw this.unauthotizedException;
    }

    if (!(await Hash.verify(user.password, data.userPassword))) {
      throw this.unauthotizedException;
    }

    const userToken = await authContract.use('api').generate(user, {
      expiresIn: '1w',
    });

    const appToken = await authContract.use('tpApi').generate(tpUser, {
      expiresIn: '1y',
    });

    return {
      app: {
        token: appToken.token,
        expirates_at: appToken.expiresAt,
      },
      user: {
        token: userToken.token,
        expirates_at: userToken.expiresAt,
      },
    };
  }

  public async businessUnitInfo(id: string) {
    const businessUnit = await BusinessUnit.query().where('id', id).first();

    if (!businessUnit) {
      throw new BadRequestException(
        'Unidade não encontrada',
        400,
        'E_NOT_FOUND',
      );
    }

    return {
      id: businessUnit.id ?? null,
      identificacao: businessUnit.identification ?? null,
      razaoSocial: businessUnit.companyName ?? null,
      nomeFantasia: businessUnit.fantasyName ?? null,
      cnpj: businessUnit.document ?? null,
      inscricaoEstadual: businessUnit.stateRegistration ?? null,
      inscricaoMunicipal: businessUnit.cityRegistration ?? null,
      email: businessUnit.email ?? null,
      telefone: businessUnit.phone ?? null,
      cep: businessUnit.postalCode ?? null,
      logradouro: businessUnit.address ?? null,
      numero: businessUnit.number ?? null,
      complemento: businessUnit.complement ?? null,
      bairro: businessUnit.district ?? null,
      cidade: businessUnit.city ?? null,
      uf: businessUnit.state ?? null,
      dataUltimaAtualizacao: businessUnit.updatedAt ?? null,
    };
  }

  public async userInfo(id: string) {
    const model = await User.query().where('id', id).first();

    if (!model) {
      throw new BadRequestException(
        'Usuário não encontrado',
        400,
        'E_NOT_FOUND',
      );
    }

    return {
      id: model.id ?? null,
      nome: model.name ?? null,
      cpf: model.document ?? null,
      rg: model.inscription ?? null,
      email: model.email ?? null,
      telefone: model.phone ?? null,
      cep: model.postalCode ?? null,
      logradouro: model.address ?? null,
      numero: model.number ?? null,
      complemento: model.complement ?? null,
      bairro: model.district ?? null,
      cidade: model.city ?? null,
      uf: model.state ?? null,
      dataUltimaAtualizacao: model.updatedAt ?? null,
    };
  }

  public async searchProfileAccesses(authCtx: AuthContext) {
    const result = await ProfileAccess.query()
      .where('system_id', authCtx.system.id)
      .where('active', true);

    return result.map(elem => ({
      idPerfil: elem.id,
      descricao: elem.description,
    }));
  }

  public async syncProfileAccesses(
    _: AuthContext,
    data: { roleId: number; profileAccessIdList: number[] },
  ) {
    await Database.transaction(async trx => {
      await RoleProfileAccess.query()
        .useTransaction(trx)
        .where('role_id', data.roleId)
        .delete();

      await RoleProfileAccess.createMany(
        data.profileAccessIdList.map(
          elem => ({
            role_id: data.roleId,
            profile_access_id: elem,
            active: true,
          }),
          { client: trx },
        ),
      );
    });
  }
}
