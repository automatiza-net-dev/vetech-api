import { inject } from "@adonisjs/fold";
import { AuthContract } from "@ioc:Adonis/Addons/Auth";
import Database, {
	TransactionClientContract,
} from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import UnauthorizedException from "App/Exceptions/UnauthorizedException";
import BusinessUnit from "App/Models/BusinessUnit";
import DailyCashier, { DailyCashierStatus } from "App/Models/DailyCashier";
import DailyMovement, { DailyMovementStatus } from "App/Models/DailyMovement";
import EconomicGroup from "App/Models/EconomicGroup";
import System from "App/Models/System";
import User from "App/Models/User";
import UserUnitRole from "App/Models/UserUnitRole";
import { DateTime } from "luxon";
import { validate } from "App/Shared";

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
	public formatter = new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	});

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

	public async userHasPermission(
		authCtx: AuthContext,
		permissionControlID: string,
	): Promise<boolean> {
		const rows = await Database.from("users")
			.select("users.*")
			.join("user_unit_roles", "users.id", "user_unit_roles.user_id")
			.join("roles", "user_unit_roles.role_id", "roles.id")
			.join("role_permissions", "roles.id", "user_unit_roles.role_id")
			.join("permissions", "role_permissions.permission_id", "permissions.id")
			.where("users.id", authCtx.user.id)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("control_id", permissionControlID)
			.where("user_unit_roles.active", true)
			.where("role_permissions.status", true);

		return rows.length > 0;
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
		return validate(document.replace(/\D/g, ""));
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

	public async getContextMovement(
		authCtx: AuthContext,
		trx: TransactionClientContract,
		shouldThrow = true,
	) {
		const row = await DailyMovement.query()
			.useTransaction(trx)
			.where("business_unit_id", authCtx.unit.id)
			// .where("user_who_opened_id", authCtx.user.id)
			.where("status", DailyMovementStatus.A)
			.first();

		if (!row && shouldThrow) {
			throw new BadRequestException(
				"Não existe movimento diário aberto",
				400,
				"E_NOT_OPEN",
			);
		}

		return row;
	}

	public async checkDiscount(
		trx: TransactionClientContract,
		authCtx: AuthContext,
		data: {
			variationId: string;
			unitaryValue: number;
			discountValue: number;
			quantity: number;
		}[],
	) {
		const rows = await Database.rawQuery(
			`select * from check_max_discount(?, ?, ?)`,
			[
				authCtx.user.id,
				authCtx.unit.id,
				JSON.stringify(
					data.map((d) => ({
						variacao: d.variationId,
						quantidade: d.quantity,
						preco: d.unitaryValue,
						vlrdesc: d.discountValue,
					})),
				),
			],
		)
			.useTransaction(trx)
			.exec();

		return rows.rows.map((elem) => {
			return {
				rule: "DescontoMaximo",
				message: elem.descricao,
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

	static ParseDecimal(value: string | number) {
		if (typeof value === "string") {
			return parseFloat(value.replace(",", "."));
		}

		return value;
	}
}
