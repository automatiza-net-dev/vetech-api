import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import BadRequestException from "App/Exceptions/BadRequestException";
import BusinessUnitMeta from "App/Models/BusinessUnitMeta";
import SharedService, { AuthContext } from "App/Services/SharedService";

interface ISearch {
	units?: string[];
	groups?: string[];
	period?: string;
}

@inject()
export default class BusinessUnitMetaService {
	constructor(private sharedService: SharedService) {}

	async index(authCtx: AuthContext, data: ISearch) {
		if (!data.period) {
			throw new BadRequestException("Período não informado", 400, "E_ERR");
		}

		const qb = Database.from("business_units")
			.select(
				Database.raw(`
          business_units.id                      as b_id,
          business_units.identification,
          metas.id                               as m_id,
          metas.description,
          business_unit_metas.id                 as bum_id,
          coalesce(business_unit_metas.value, 0) as valor_meta,
          business_unit_metas.period
          `),
			)
			.joinRaw(
				`join metas on (business_units.economic_group_id = metas.economic_group_id or metas.economic_group_id is null) and metas.deleted_at is null`,
			)
			.joinRaw(
				`left join business_unit_metas on metas.id = business_unit_metas.meta_id and
                                          business_units.id = business_unit_metas.business_unit_id and business_unit_metas.period = ? and business_unit_metas.active = true`,
				[data.period],
			)
			.orderByRaw(`business_units.id, metas.id, business_unit_metas.id`);

		if (data.units && Array.isArray(data.units) && data.units.length > 0) {
			qb.whereIn("business_units.id", data.units);
		} else {
			qb.where("business_units.id", authCtx.unit.id);
		}

		if (data.groups && Array.isArray(data.groups) && data.groups.length > 0) {
			qb.whereIn("business_units.economic_group_id", data.groups);
		} else {
			qb.where("business_units.economic_group_id", authCtx.group.id);
		}

		const rows = await qb;

		const map: Map<
			string,
			{
				metaId: number;
				buMetaId: string;
			}[]
		> = new Map();

		for (const row of rows) {
			if (!map.has(row.b_id)) {
				map.set(row.b_id, []);
			}

			map.get(row.b_id)?.push({
				metaId: row.m_id,
				buMetaId: row.bum_id,
			});
		}

		return Array.from(map.entries()).flatMap(([key, value]) => {
			const unitRows: any[] = [];
			for (const row of value) {
				const innerRows = rows.filter(
					(r) =>
						r.b_id === key &&
						r.m_id === row.metaId &&
						r.bum_id === row.buMetaId,
				);

				unitRows.push(...innerRows);
			}

			return {
				id: key,
				identification: unitRows[0].identification,
				period: data.period ?? unitRows[0].period,
				metas: unitRows.map((r) => ({
					id: r.m_id,
					description: r.description,
					unitMetaId: r.bum_id,
					value: r.valor_meta,
				})),
			};
		});
	}

	async store(
		_: AuthContext,
		data: {
			metaId: number;
			businessUnitId: string;
			value: number;
			period: string;
		}[],
	) {
		return await Database.transaction(async (trx) => {
			const tasks = data.map(async (d) => {
				const existing = await BusinessUnitMeta.query()
					.useTransaction(trx)
					.where("business_unit_id", d.businessUnitId)
					.where("meta_id", d.metaId)
					.where("period", d.period);

				if (existing.length > 0) {
					throw new BadRequestException("Meta já cadastrada", 400, "E_ERR");
				}

				return BusinessUnitMeta.create(
					{
						business_unit_id: d.businessUnitId,
						meta_id: d.metaId,
						value: d.value,
						period: d.period,
					},
					{
						client: trx,
					},
				);
			});

			await Promise.all(tasks);
		});
	}

	async show(authCtx: AuthContext, id: string) {
		const model = await BusinessUnitMeta.query()
			.where("business_unit_id", authCtx.unit.id)
			.where("id", id)
			.preload("unit", (query) => {
				query.select("id", "identification");
			})
			.first();

		if (!model) {
			throw this.sharedService.ResourceNotFound();
		}

		return model;
	}

	async update(
		authCtx: AuthContext,
		data: {
			id: number;
			value: number;
			active: boolean;
		}[],
	) {
		await Database.transaction(async (trx) => {
			const rows = await BusinessUnitMeta.query()
				.useTransaction(trx)
				.where("business_unit_id", authCtx.unit.id)
				.whereIn(
					"id",
					data.map((d) => d.id),
				);

			if (rows.length !== data.length) {
				throw this.sharedService.ResourceNotFound();
			}

			const tasks = rows.map(async (row) => {
				const d = data.find((d) => d.id === row.id);
				if (!d) {
					throw this.sharedService.ResourceNotFound();
				}

				return row
					.merge({
						value: d.value,
						active: d.active,
					})
					.useTransaction(trx)
					.save();
			});

			await Promise.all(tasks);
		});
	}

	async destroy(authCtx: AuthContext, id: string) {
		const model = await this.show(authCtx, id);

		await model.delete();
	}
}
