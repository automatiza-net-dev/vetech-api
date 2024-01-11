import { inject } from "@adonisjs/fold";
import { AuthContract } from "@ioc:Adonis/Addons/Auth";
import { TransactionClientContract } from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import InternalErrorException from "App/Exceptions/InternalErrorException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import BusinessUnit from "App/Models/BusinessUnit";
import DailyCashier, { DailyCashierStatus } from "App/Models/DailyCashier";
import EconomicGroup from "App/Models/EconomicGroup";
import ProductVariation from "App/Models/ProductVariation";
import System from "App/Models/System";
import User from "App/Models/User";
import UserUnitRole from "App/Models/UserUnitRole";
import { DateTime } from "luxon";

export type DateSet = {
	start: Date;
	end: Date;
};

export type AuthContext = {
	user: User;
	group: EconomicGroup;
	system: System;
	unit: BusinessUnit;
	$roleMetas: UserUnitRole[];
};

@inject()
export default class SharedService {
	public async getUserGroup(unitId: string): Promise<EconomicGroup> {
		const unit = await BusinessUnit.findOrFail(unitId);
		return unit.related("economicGroup").query().firstOrFail();
	}

	public async getBUnit(unitId: string) {
		return BusinessUnit.query()
			.where("id", unitId)
			.preload("unitConfig")
			.firstOrFail();
	}

	public async isSuperAdmin(user: User): Promise<boolean> {
		const roles = await user.related("roles").query().preload("role");
		return Boolean(roles.find((r) => r.role?.name === "super-admin"));
	}

	public extractUser(auth: AuthContract): {
		user: User;
		unit_id: string;
		system_id: number;
	} {
		const user = auth.use("api").user!;
		const meta = auth.use("api").token!.meta;

		return { user, ...meta };
	}

	public async getAuthContext(auth: AuthContract): Promise<AuthContext> {
		const { user, unit_id } = this.extractUser(auth);

		const unit = await BusinessUnit.query()
			.where("id", unit_id)
			.preload("economicGroup", (query) => {
				query.preload("system", (query) => {
					query.preload("systemUrls");
				});
			})
			.preload("unitConfig")
			.firstOrFail();

		const userRoles = await UserUnitRole.query()
			.where("user_id", user.id)
			.where("unit_id", unit.id);

		return {
			user,
			group: unit.economicGroup,
			system: unit.economicGroup.system,
			unit,
			$roleMetas: userRoles,
		};
	}

	public checkOverlapping(ASet: DateSet, BSet: DateSet): boolean {
		const firstMatch = ASet.start.getTime() < BSet.end.getTime();
		const secondMatch = BSet.start.getTime() < ASet.end.getTime();

		return firstMatch && secondMatch;
	}

	public checkDTEqt(date1: DateTime, date2: DateTime): boolean {
		return date1.toJSDate().getTime() === date2.toJSDate().getTime();
	}

	public ResourceNotFound(message = "Recurso não encontrado") {
		return new ResourceNotFoundException(message, 404, "E_NOT_FOUND");
	}

	public SystemResource() {
		return new UnauthorizedException(
			"Registro padrão do sistema. Não pode ser acessado ou alterado diretamente.",
			400,
			"E_SYSTEM",
		);
	}

	public async userHasRoles(user: User, roles: string[]): Promise<boolean> {
		const userRoles = await user
			.related("roles")
			.query()
			.where("active", true)
			.preload("role");

		return Boolean(userRoles.find((r) => roles.includes(r.role?.name)));
	}

	public validDocument(document: string): boolean {
		const re =
			/([0-9]{2}[.]?[0-9]{3}[.]?[0-9]{3}[\\/]?[0-9]{4}[-]?[0-9]{2})|([0-9]{3}[.]?[0-9]{3}[.]?[0-9]{3}[-]?[0-9]{2})/;

		return re.test(document);
	}

	public isValidNumber(data: number | undefined) {
		if (!data) {
			return undefined;
		}

		if (typeof data !== "number") {
			return undefined;
		}

		if (data === 0) {
			return undefined;
		}

		return data;
	}

	public sum(val: Array<number>): number {
		return val
			.filter(Boolean)
			.reduce((acc: number, cur: number) => acc + cur, 0);
	}

	public captureGroup<T>(val: T | null | undefined, fn: (val: T) => unknown) {
		if (!val) {
			return null;
		}

		return fn(val);
	}

	public async getContextCashier(
		authCtx: AuthContext,
		trx: TransactionClientContract,
		shouldThrow = true,
	) {
		const dailyCashier =
			authCtx.unit.unitConfig.dailyCashierType === "usuario"
				? await DailyCashier.query()
						.useTransaction(trx)
						.where("business_unit_id", authCtx.unit.id)
						.where("user_who_opened_id", authCtx.user.id)
						.where("status", DailyCashierStatus.A)
						.first()
				: await DailyCashier.query()
						.useTransaction(trx)
						.where("business_unit_id", authCtx.unit.id)
						.where("status", DailyCashierStatus.A)
						.first();

		if (!dailyCashier && shouldThrow) {
			throw new BadRequestException(
				"Não existe caixa diário aberto",
				400,
				"E_NOT_OPEN",
			);
		}

		return dailyCashier;
	}

	public async userHasPermission(user: User, permission: string) {
		const data = await user
			.related("roles")
			.query()
			.whereHas("role", (query) => {
				query.whereHas("permissions", (query) => {
					query.where("control_id", permission);
				});
			});

		return data.length > 0;
	}

	public async checkDiscount(
		trx: TransactionClientContract,
		unitId: string,
		data: {
			variationId: string;
			discountValue: number;
			quantity: number;
		}[],
	) {
		const productVariations = await ProductVariation.query()
			.useTransaction(trx)
			.whereIn(
				"id",
				data.map((d) => d.variationId),
			)
			.whereHas("businessUnitProducts", (query) => {
				query.where("businness_unit_id", unitId);
			})
			.preload("product")
			.preload("businessUnitProducts", (query) => {
				query.where("businness_unit_id", unitId);
			});

		const overdiscountedItems = data.filter((elem) => {
			const variation = productVariations.find(
				(p) => p.id === elem.variationId,
			);
			if (!variation) {
				throw new BadRequestException(
					"Não foi possível encontrar um preço para esse produto",
					400,
					"E_NO_VARIATION",
				);
			}

			return variation.businessUnitProducts.some(
				(p) => p.maximumDiscountValue * elem.quantity < elem.discountValue,
			);
		});

		return overdiscountedItems.map((elem) => {
			const item = productVariations.find((v) => v.id === elem.variationId);

			if (!item) {
				throw new InternalErrorException(
					"Erro ao validar desconto",
					500,
					"E_VALIDATE_DISCOUNT",
				);
			}

			if (item.businessUnitProducts.length === 0) {
				throw new InternalErrorException(
					"Preço não encontrado para produto",
					500,
					"E_VALIDATE_DISCOUNT",
				);
			}

			const price = item.businessUnitProducts[0];

			return {
				rule: "DescontoMaximo",
				message: `O desconto máximo para o produto '${
					item?.product?.description
				}' é de ${this.parsePriceToBrl(price.maximumDiscountValue)}`,
			};
		});
	}

	public static GetAttendanceLabel(_: AuthContext) {
		return "Consulta"; // TODO - Remove this later

		// if (authCtx.system.name === 'LiftOne') {
		//   return 'Avaliação';
		// }
		//
		// return 'Atendimento';
	}

	public static ArrayUnion<T, F>(data: T | T[], fn: (data: T[]) => F) {
		if (Array.isArray(data)) {
			return fn(data);
		}

		return fn([data]);
	}

	private parsePriceToBrl(price: number | string) {
		if (typeof price === "string") {
			return this.parsePriceToBrl(parseFloat(price));
		}

		return price.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL",
		});
	}

	static ParseDecimal(value: string | number) {
		if (typeof value === "string") {
			return parseFloat(value.replace(",", "."));
		}

		return value;
	}
}
