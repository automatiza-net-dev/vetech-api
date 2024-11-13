import { inject } from "@adonisjs/fold";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import BusinessUnit from "App/Models/BusinessUnit";
import WeekDay from "App/Models/shared/WeekDay";
import UnavailableDay from "App/Models/UnavailableDay";
import IUnavailableDayData from "Contracts/interfaces/IUnavailableDayData";

interface ISearch {
	frequency?: WeekDay;
	user?: string;
	title?: string;
	active?: string;
}

@inject()
export default class UnavailableDayService {
	public async index(
		unitId: string,
		data: ISearch,
	): Promise<Array<UnavailableDay>> {
		const unit = await BusinessUnit.findOrFail(unitId);

		const qb = unit.related("unavailableDays").query();

		if (data.title) {
			qb.where("title", "ilike", `%${data.title}%`);
		}

		if (data.user) {
			qb.where("user_id", data.user);
		}

		if (data.frequency) {
			qb.where("frequency", data.frequency);
		}

		if (data.active === "true") {
			qb.whereRaw("(end_date is null or end_date::date >= now()::date)").where(
				"active",
				true,
			);
		}

		return qb;
	}

	public async show(unitId: string, id: string): Promise<UnavailableDay> {
		const unavailableDay = await UnavailableDay.find(id);

		if (!unavailableDay || unavailableDay.business_unit_id !== unitId) {
			throw new ResourceNotFoundException(
				"Recurso não foi encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		return unavailableDay;
	}

	public async store(
		unitId: string,
		data: Omit<IUnavailableDayData, "active">,
	): Promise<UnavailableDay> {
		const unit = await BusinessUnit.findOrFail(unitId);

		return unit.related("unavailableDays").create({
			title: data.title,
			user_id: data.userId,
			startHour: data.startHour,
			endHour: data.endHour,
			frequency: data.frequency,
			startDate: data.startDate,
			endDate: data.endDate,
		});
	}

	public async update(
		unitId: string,
		id: string,
		data: Omit<IUnavailableDayData, "userId">,
	): Promise<UnavailableDay> {
		const unavailableDay = await this.show(unitId, id);

		return unavailableDay
			.merge({
				title: data.title,
				startHour: data.startHour,
				endHour: data.endHour,
				frequency: data.frequency,
				startDate: data.startDate,
				endDate: data.endDate,
				active: data.active,
			})
			.save();
	}

	public async destroy(unitId: string, id: string): Promise<void> {
		const unavailableDay = await this.show(unitId, id);

		await unavailableDay.delete();
	}
}
