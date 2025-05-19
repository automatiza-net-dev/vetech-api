import { inject } from "@adonisjs/fold";
import { schema, type TypedSchema } from "@ioc:Adonis/Core/Validator";
import Drive from "@ioc:Adonis/Core/Drive";
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
import { ValidationException } from "@ioc:Adonis/Core/Validator";
import type { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import PaymentMethod from "App/Models/PaymentMethod";
import SystemUrl from "App/Models/SystemUrl";
import S3Cache from "App/Models/S3Cache";
import { TDynamicForm } from "App/Models/BusinessUnitConfig";

type KeySelector<T> = (item: T) => any[];

export type DateSet = {
	start: Date;
	end: Date;
};

export type AuthContext = {
	user: User;
	group: EconomicGroup;
	system: System;
	systemUrl: SystemUrl;
	unit: BusinessUnit;
	$roleMetas: UserUnitRole[];
	permissions: string[];
	ip: string | null;
	hasPermission: (controlID: string) => boolean;
	hasPermissions: (controlIDs: string[]) => boolean;
};

type ItemToCheckDiscount = {
	variacao: string;
	quantidade: number;
	preco: number;
	vlrdesc: number;
	cortesia: boolean;
	aprovado: boolean;
};

@inject()
export default class SharedService {
	public static intlMap = {
		scheduleServiceTypeId: "Serviço de agendamento",
		scheduleServiceId: "Serviço de agendamento",
		startHour: "Hora de início",
		endHour: "Hora de término",
		patientId: "Paciente",
		holderId: "Tutor",
		userId: "Usuário",
		scheduleOriginId: "Agenda de Origem",
		scheduleId: "Agenda",
		statusId: "Status",
		ignoreBlocking: "Ignorar bloqueios",
		patientName: "Nome do Paciente",
		patientPhone: "Telefone do Paciente",
		age: "Idade",
		raceId: "Raça",
		majorComplaint: "Reclamação",
		ignoreOverlapping: "Ignorar sobreposição",
		onDuty: "Em plantação",
		reasonId: "Motivo",
		observation: "Observação",
		resume: "Resumo",
		protocol: "Protocolo",
		internalObservation: "Observação interna",
		tag: "Identificador do Paciente",
		technicianId: "Técnico",
		tutorId: "Tutor",
		photos: "Fotos",
		title: "Título",
		complaint: "Reclamação",
		type: "Tipo",
		scheduleStatusType: "Tipo de Status",
		document: "Documento",
		gender: "Genero",
		email: "Email",
		cellphone: "Celular",
		professionId: "Profissão",
		postalCode: "CEP",
		zipCode: "CEP",
		street: "Rua",
		number: "Numero",
		complement: "Complemento",
		district: "Bairro",
		city: "Cidade",
		state: "Estado",
		origin: "Origem",
		clientOriginId: "Origem do Cliente",
		contact: "Contato",
		residence: "Residência",
		address: "Endereço",
		birthDate: "Data de Nascimento",
		contacts: "Contatos",
		birthMonths: "Meses",
		birthYears: "Anos",
		birthDays: "Dias",
		inscription: "Documento",
		name: "Nome",
		holders: "Tutores",
	} as const;

	public static async ComputePublicS3Link(keys: string[]) {
		if (keys.length === 0) {
			return {};
		}

		// const existingKeys = await S3Cache.query()
		// 	.whereIn("key", keys)
		// 	.whereRaw("expires_at > now()");
		//
		// const partialResult = existingKeys.reduce(
		// 	(acc, curr) => {
		// 		acc[curr.key] = curr.value;
		// 		return acc;
		// 	},
		// 	{} as Record<string, string>,
		// );
		//
		// const missingKeys = keys.filter(
		// 	(k) => !Object.keys(partialResult).includes(k),
		// );

		// if (missingKeys.length > 0) {

		// await S3Cache.createMany(
		// 	updatedResult.map((row) => ({
		// 		key: row.key,
		// 		value: row.value,
		// 		expiresAt: DateTime.now().plus({ days: 7 }),
		// 	})),
		// );
		//
		// for (const row of updatedResult) {
		// 	partialResult[row.key] = row.value;
		// }
		// }

		const updatedKeyTasks = keys.map(async (key) => {
			return {
				key,
				view: await Drive.use("s3").getSignedUrl(
					key.startsWith("/uploads/") ? key.slice(9) : key,
					{
						expiresIn: "7d",
					},
				),
				download: await Drive.use("s3").getSignedUrl(
					key.startsWith("/uploads/") ? key.slice(9) : key,
					{
						expiresIn: "7d",
						contentDisposition: "attachment",
					},
				),
			};
		});
		return await Promise.all(updatedKeyTasks);
	}

	public async errorHoc(
		response: HttpContextContract["response"],
		fn: () => Promise<void>,
	) {
		try {
			await fn();
		} catch (e) {
			console.log("got an error", e);
			if (e instanceof ValidationException) {
				return response.unprocessableEntity({
					data: null,
					status: 422,
					title: "Entidade não processável",
					message: null,
					// @ts-expect-error
					validationErrors: e.messages.errors.reduce(
						(prev, curr) => {
							const key = curr.field.replace(/\.([0-9]+)/g, "[$1]");
							if (!prev[key]) {
								prev[key] = { errors: [] };
							}

							prev[key].errors.push(
								curr.message.replace(
									"Campo",
									`Campo '${SharedService.intlMap[key.split(".").at(-1)] ?? key.split(".").at(-1)}'`,
								),
							);

							return prev;
						},
						{} as Record<string, Record<string, string[]>>,
					),
				});
			}

			return response.badRequest({
				data: null,
				status: 400,
				title: "Requisição inválida",
				message: e.message.split(":").at(1)?.trim() ?? "Algo deu errado",
				validationErrors: {},
			});
		}
	}

	public formatter = new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	});

	public formatPercentage(value: number | string) {
		if (typeof value === "string") {
			return this.formatPercentage(Number.parseFloat(value));
		}

		if (Number.isNaN(value)) {
			return "0%";
		}

		if (!Number.isFinite(value)) {
			return "0%";
		}

		return `${value.toFixed(2)}%`;
	}

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
		const rows = await Database.from("user_unit_roles")
			.select(Database.raw("1"))
			.joinRaw("join roles on roles.id = user_unit_roles.role_id")
			.joinRaw("join role_permissions on role_permissions.role_id = roles.id")
			.joinRaw(
				"join permissions on role_permissions.permission_id = permissions.id and permissions.control_id = ?",
				[permissionControlID],
			)
			.where("user_unit_roles.user_id", authCtx.user.id)
			.where("user_unit_roles.unit_id", authCtx.unit.id)
			.where("roles.system_id", authCtx.system.id)
			.where("roles.active", true)
			.where("role_permissions.active", true)
			.where("role_permissions.status", true)
			.whereIn("roles.type", ["controller", "both", "all", "user"])
			.whereIn("permissions.type", ["controller", "both", "all", "user"]);

		return rows.length > 0;
	}

	public extractUser(auth: AuthContract): {
		user: User;
		unit_id: string;
		system_id: number;
		system_url_id: number | null;
		ip: string | null;
	} {
		const user = auth.use("api").user!;
		const meta = auth.use("api").token!.meta;

		return { user, ...meta };
	}

	public async getAuthContext(auth: AuthContract): Promise<AuthContext> {
		const { user, unit_id, ip, system_url_id } = this.extractUser(auth);

		const [unit, userRoles] = await Promise.all([
			BusinessUnit.query()
				.where("id", unit_id)
				.preload("economicGroup", (query) => {
					query.preload("system", (query) => {
						query.preload("systemUrls", (query) => {
							if (system_url_id) {
								query.where("id", system_url_id);
							}
						});
					});
				})
				.preload("unitConfig")
				.firstOrFail(),
			UserUnitRole.query().where("user_id", user.id).where("unit_id", unit_id),
		]);

		const rows = await Database.from("user_unit_roles")
			.select(Database.raw("permissions.control_id"))
			.joinRaw("join roles on roles.id = user_unit_roles.role_id")
			.joinRaw("join role_permissions on role_permissions.role_id = roles.id")
			.joinRaw(
				"join permissions on role_permissions.permission_id = permissions.id",
			)
			.where("user_unit_roles.user_id", user.id)
			.where("user_unit_roles.unit_id", unit_id)
			.where("roles.system_id", unit.economicGroup.system_id)
			.where("roles.active", true)
			.where("role_permissions.active", true)
			.where("role_permissions.status", true)
			.whereIn("roles.type", ["controller", "both", "all", "user"])
			.whereIn("permissions.type", ["controller", "both", "all", "user"]);

		const flatPermissions = rows.map((r) => r.control_id);

		return {
			user,
			group: unit.economicGroup,
			system: unit.economicGroup.system,
			systemUrl: unit.economicGroup.system.systemUrls[0],
			unit,
			$roleMetas: userRoles,
			permissions: flatPermissions,
			ip,
			hasPermission: (controlID) => {
				return !!flatPermissions.find((r) => r === controlID);
			},
			hasPermissions: (controlIDs) => {
				return controlIDs.every((r) => flatPermissions.includes(r));
			},
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
			courtesy?: boolean;
			maxDiscount?: boolean;
			approved?: boolean;
		}[],
	) {
		// [cortesia, maxdiscount]
		// não, não -> precisa verificar o desconto máximo
		// sim, não -> não precisa verificar
		// não, sim -> não precisa verificar
		// sim, sim -> não precisa verificar

		const items: ItemToCheckDiscount[] = [];
		for (const entry of data) {
			// const shouldIgnoreForCourtesy =
			// 	typeof entry.courtesy === "boolean" ? entry.courtesy : false;
			//
			// const shouldIgnoreForMxDisc =
			// 	typeof entry.maxDiscount === "boolean" ? entry.maxDiscount : false;
			//
			// if (!shouldIgnoreForCourtesy && !shouldIgnoreForMxDisc) {
			items.push({
				variacao: entry.variationId,
				quantidade: entry.quantity,
				preco: entry.unitaryValue,
				vlrdesc: entry.discountValue,
				cortesia: typeof entry.courtesy === "boolean" ? entry.courtesy : false,
				aprovado: typeof entry.approved === "boolean" ? entry.approved : false,
			});
			// }
		}

		const rows = await Database.rawQuery(
			"select * from check_max_discount(?, ?, ?)",
			[authCtx.user.id, authCtx.unit.id, JSON.stringify(items)],
		)
			.useTransaction(trx)
			.exec();

		return rows.rows.map((elem: { descricao: string; tipoerro: string }) => {
			return {
				rule: elem.tipoerro ?? "DescontoMaximo",
				message: elem.descricao,
			};
		});
	}

	public static NoopPromise<T>(
		predicate: () => boolean,
		promiseGen: () => Promise<T>,
	): Promise<T | undefined> {
		if (!predicate()) {
			return Promise.resolve(undefined);
		}

		return promiseGen();
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
			return Number.parseFloat(value.replace(",", "."));
		}

		return value;
	}

	static CalculateDateOffset(
		idx: number,
		date: DateTime,
		paymentMethod: PaymentMethod,
	): DateTime {
		// 1a parcela
		if (idx === 0) {
			// pular exatamente 1 mês
			if (paymentMethod.daysFirstInstallment === 30) {
				return date.plus({ months: 1 });
			}

			// pular quantos dias forem necessários
			return date.plus({ days: paymentMethod.daysFirstInstallment });
		}

		// 2a parcela em diante
		const lastDate = SharedService.CalculateDateOffset(
			idx - 1,
			date,
			paymentMethod,
		);
		// pular exatamente 1 mês depois da ultima parcela
		if (paymentMethod.daysBetweenInstallments === 30) {
			return lastDate.plus({ months: 1 });
		}

		// pular dias necessários desde a ultima parcela
		return lastDate.plus({ days: paymentMethod.daysBetweenInstallments });
	}

	static GroupBy<T>(
		array: T[],
		keySelector: KeySelector<T>,
	): Record<string, T[]> {
		return array.reduce(
			(acc, item) => {
				// Select multiple keys and join them into a composite key
				const compositeKey = keySelector(item).join("___");

				if (!acc[compositeKey]) {
					acc[compositeKey] = [];
				}
				acc[compositeKey].push(item);

				return acc;
			},
			{} as Record<string, T[]>,
		);
	}

	private static reduceSimpleValidator(row: TDynamicForm["cadastro"][string]) {
		switch (row.type) {
			case "string":
				return row.required ? schema.string() : schema.string.optional();
			case "date":
				return row.required ? schema.date() : schema.date.optional();
			default:
				console.log({ row });
				throw new Error("Não deveria chegar aqui?");
		}
	}

	private static reduceValidatorObject(rows: TDynamicForm[string]["prop"]) {
		const memberProps = (Array.isArray(rows) ? rows : [rows])
			.flat()
			.reduce((acc, curr) => {
				acc[curr.key] = SharedService.reduceSimpleValidator(curr);

				return acc;
			}, {} as TypedSchema);

		return schema.object().members(memberProps);
	}

	private static reduceValidatorArray(rows: TDynamicForm[string]["prop"]) {
		const memberProps = (Array.isArray(rows) ? rows : [rows])
			.flat()
			.reduce((acc, curr) => {
				acc[curr.key] = SharedService.reduceSimpleValidator(curr);

				return acc;
			}, {} as TypedSchema);

		return schema.array().members(schema.object().members(memberProps));
	}

	static CreateDynamicValidator(form: TDynamicForm["cadastro"]) {
		return Object.entries(form).reduce((acc, [key, prop]) => {
			if (prop.type === "array" && "prop" in prop) {
				acc[key] = SharedService.reduceValidatorArray(prop.prop);
			} else if (prop.type === "object" && "prop" in prop) {
				acc[key] = SharedService.reduceValidatorObject(prop.prop);
			} else if (prop.type === "string" || prop.type === "date") {
				acc[key] = SharedService.reduceSimpleValidator(prop);
			}

			return acc;
		}, {} as TypedSchema);
	}

	static CreateDynamicErrorMessages(form: TDynamicForm[string]) {
		return {
			"*": (field: string) => {
				const tokens = field.split(".");

				let root: unknown = form;
				for (const token of tokens) {
					const isNumeric = token === "0" || Number.isNaN(new Number(token));

					if (!root[token]) {
						if (root.prop) {
							if (isNumeric) {
								const dynamicField = root.prop[Number.parseInt(token)];
								if (dynamicField) {
									return (
										dynamicField?.error_message ?? "Campo é obrigatório [3]"
									);
								}

								return "Campo é obrigatório [4]";
							}

							const dynamicField = root.prop.find((f) => f.title === token);
							if (dynamicField) {
								return dynamicField?.error_message ?? "Campo é obrigatório [3]";
							}
						}

						return "Campo é obrigatório [1]";
					}

					if (root[token]?.error_message) {
						return root[token]?.error_message;
					}

					root = root[token];
				}

				return "Campo é obrigatório [2]";
			},
		};
	}

	static async UserHasPermission(
		userID: string,
		unitID: string,
		systemID: string,
		permissionControlID: string,
	) {
		const rows = await Database.from("user_unit_roles")
			.select(Database.raw("permissions.control_id"))
			.joinRaw("join roles on roles.id = user_unit_roles.role_id")
			.joinRaw("join role_permissions on role_permissions.role_id = roles.id")
			.joinRaw(
				"join permissions on role_permissions.permission_id = permissions.id",
			)
			.where("user_unit_roles.user_id", userID)
			.where("user_unit_roles.unit_id", unitID)
			.where("roles.system_id", systemID)
			.where("roles.active", true)
			.where("role_permissions.active", true)
			.where("role_permissions.status", true)
			.whereIn("roles.type", ["controller", "both", "all", "user"])
			.whereIn("permissions.type", ["controller", "both", "all", "user"]);

		return rows.some((r) => r.control_id === permissionControlID);
	}
}
