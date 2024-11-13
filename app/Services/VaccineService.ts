import { inject } from "@adonisjs/fold";
import Database from "@ioc:Adonis/Lucid/Database";
import ResourceNotFoundException from "App/Exceptions/ResourceNotFoundException";
import Vaccine from "App/Models/Vaccine";
import SharedService, { AuthContext } from "App/Services/SharedService";
import { IVaccineData } from "Contracts/interfaces/IVaccineData";
import { validate } from "uuid";
import BadRequestException from "../Exceptions/BadRequestException";

interface ISearch {
	name?: string;
	description?: string;
	type?: string;
}

type ShowIt = {
	id: string;
	identification: string;
	pacientes: {
		idPaciente: string;
		nomePaciente: string;
		idTutor: string;
		nomeTutor: string;
		tipoContatoTutor: string;
		contatoTutor: string | null;
		vacinasPaciente: {
			idVacinaPaciente: string;
			vacina: {
				tipo: string;
				idVacina: string;
				nomeVacina: string;
				idProtocolo: string;
				nomeProtocolo: string;
				qtdDosesProtocolo: number;
				intervaloDiasDosesProtocolo: number;
				protocoloValidoPor: string;
				dataUltimaAplicacao: string | null;
				dataValido: string | null;
				statusVacina: string | null;
				vaccineCalendar: {
					idVaccineCalendar: string;
					scheduleId: string | null;
					dataAgendamento: string;
					dataAplicacao: string | null;
					doseAplicacao: number;
					laboratorioAplicacao: string | null;
					loteAplicacao: string | null;
					statusAgendamentoVacina: string;
				}[];
			};
		}[];
	}[];
};

@inject()
export default class VaccineService {
	constructor(private readonly sharedService: SharedService) {}

	public async index(authCtx: AuthContext, data: ISearch) {
		const qb = Vaccine.query()
			.preload("protocols", (query) => {
				query.select("id", "name", "doses", "interval", "active", "specie_id");

				query.preload("specie", (query) => {
					query.select("id", "description");
				});
			})
			.where("system_id", authCtx.system.id)
			.whereRaw("(economic_group_id = ? or economic_group_id is null)", [
				authCtx.group.id,
			]);

		if (data.name) {
			qb.where("name", "ilike", `%${data.name}%`);
		}

		if (data.description) {
			qb.where("description", "ilike", `%${data.description}%`);
		}

		if (data.type) {
			qb.where("type", data.type);
		}

		// TODO paginate
		return qb;
	}

	public async status(
		authCtx: AuthContext,
		patientID: string,
		data: {
			units?: string[];
			type?: string;
		},
	) {
		if (!validate(patientID)) {
			throw new BadRequestException("ID de paciente inválido", 400, "E_ERR");
		}

		const qb = Database.from("patient_vaccines")
			.select(
				Database.raw(`business_units.id                                                        as id_unidade,
       business_units.identification                                            as identificador_unidade,
       p.id                                                                     as id_paciente,
       p.name                                                                   as nome_paciente,
       tutor.id                                                                 as id_tutor,
       tutor.name                                                               as nome_tutor,
       patient_contacts.type                                                    as tipo_contato_tutor,
       patient_contacts.contact                                                 as contato_tutor,
       case when vaccines."type" = 'vaccine' then 'Vacina' else 'Vermifugo' end as tipo,
       patient_vaccines.id                                                      as id_vacina_paciente,

      patient_vaccines.last_application_at                          as data_ultima_aplicacao,
      patient_vaccines.valid_until                                            as data_valido,
      patient_vaccines.status                                                  as status_vacina,

       vaccines.id                                                              as id_vacina,
       vaccines.name                                                            as nome_Vacina,
       vaccine_protocols.id                                                     as id_Protocolo,
       vaccine_protocols."name"                                                 as nome_Protocolo,
       vaccine_protocols.doses::int                                             as qtd_Doses_Protocolo,

       vaccine_protocols."interval"::int                                        as intervalo_Dias_Doses_Protocolo,
       coalesce(vaccine_protocols.expiration_days, 0) || ' dias'                as protocolo_Valido_Por,

       vaccine_calendars.id                                                     as id_Vaccine_Calendar,
       vaccine_calendars.schedule_id,
       vaccine_calendars.scheduling_date                                        as data_Agendamento,
       vaccine_calendars.application_date                                       as data_Aplicacao,

       vaccine_calendars.dose::int                                              as dose_Aplicacao,
       vaccine_calendars.laboratory                                             as laboratorio_Aplicacao,
       vaccine_calendars.batch                                                  as lote_Aplicacao,

       case
           when vaccine_calendars.application_date is not null then 'Aplicada'

           when vaccine_calendars.scheduling_date::date < now()::date and vaccine_calendars.application_date is null
               then 'Atrasada (' || now()::date - vaccine_calendars.scheduling_date::date || ' dias)'

           when vaccine_calendars.scheduling_date::date >= now()::date and vaccine_calendars.application_date is null
               then 'Agendada' end                                              as status_Agendamento_Vacina`),
			)
			.joinRaw(
				"join business_units on patient_vaccines.business_unit_id = business_units.id",
			)
			.joinRaw("join patients p on patient_vaccines.patient_id = p.id")
			.joinRaw(
				"join holder_dependents on p.id = holder_dependents.dependent_id",
			)
			.joinRaw(
				"join patients tutor on tutor.id = holder_dependents.holder_id and holder_dependents.is_main = true",
			)
			.joinRaw(
				"left join patient_contacts on tutor.id = patient_contacts.patient_id and patient_contacts.type = 'celular'",
			)
			.joinRaw(
				"join vaccine_calendars on vaccine_calendars.patient_vaccine_id = patient_vaccines.id",
			)
			.joinRaw("join vaccines on patient_vaccines.vaccine_id = vaccines.id")
			.joinRaw(
				"join vaccine_protocols on patient_vaccines.vaccine_protocol_id = vaccine_protocols.id",
			)
			.whereRaw("patient_vaccines.deleted_at is null")
			.where("business_units.economic_group_id", authCtx.group.id)
			.whereRaw("patient_vaccines.patient_id = ?", [patientID])
			.orderByRaw(`vaccine_calendars.created_at desc, p.name, vaccines.name, vaccine_protocols."name", vaccine_calendars.dose,
         vaccine_calendars.scheduling_date, vaccine_calendars.application_date`);

		if (data.units && Array.isArray(data.units)) {
			qb.whereIn("patient_vaccines.business_unit_id", data.units);
		} else {
			qb.where("patient_vaccines.business_unit_id", authCtx.unit.id);
		}

		if (data.type === "vacinas") {
			qb.where("vaccines.type", "vaccine");
		} else if (data.type === "vermifugos") {
			qb.where("vaccines.type", "vermifuge");
		}

		const result: {
			id_unidade: string;
			identificador_unidade: string;
			id_paciente: string;
			nome_paciente: string;
			id_tutor: string;
			nome_tutor: string;
			tipo_contato_tutor: string;
			contato_tutor: string | null;
			tipo: "Vacina" | "Vermifugo";
			id_vacina_paciente: string;
			data_ultima_aplicacao: string | null;
			data_valido: string | null;
			status_vacina: string | null;
			id_vacina: string;
			nome_vacina: string;
			id_protocolo: string;
			nome_protocolo: string;
			qtd_doses_protocolo: number;
			intervalo_dias_doses_protocolo: number;
			protocolo_valido_por: string;
			id_vaccine_calendar: string;
			schedule_id: string | null;
			data_agendamento: string;
			data_aplicacao: string | null;
			dose_aplicacao: number;
			laboratorio_aplicacao: string | null;
			lote_aplicacao: string | null;
			status_agendamento_vacina: string;
			status_protocolo: string;
			validade_vacina: string;
		}[] = await qb;

		return {
			units: result.reduce((resultUnits, currRow) => {
				if (resultUnits.find((ru) => ru.id === currRow.id_unidade)) {
					// já na lista
					return resultUnits;
				}

				resultUnits.push({
					id: currRow.id_unidade,
					identification: currRow.identificador_unidade,
					pacientes: result
						.filter((f) => f.id_unidade === currRow.id_unidade)
						.reduce(
							(currPatients, pac) => {
								if (
									currPatients.find((f) => f.idPaciente === pac.id_paciente)
								) {
									return currPatients;
								}

								currPatients.push({
									idPaciente: pac.id_paciente,
									nomePaciente: pac.nome_paciente,
									idTutor: pac.id_tutor,
									nomeTutor: pac.nome_tutor,
									contatoTutor: pac.contato_tutor,
									tipoContatoTutor: pac.tipo_contato_tutor,
									vacinasPaciente: result
										.filter(
											(f) =>
												f.id_unidade === currRow.id_unidade &&
												f.id_paciente === pac.id_paciente,
										)
										.reduce(
											(currVacinas, vac) => {
												if (
													currVacinas.find(
														(f) =>
															f.idVacinaPaciente === vac.id_vacina_paciente,
													)
												) {
													return currVacinas;
												}

												currVacinas.push({
													idVacinaPaciente: vac.id_vacina_paciente,
													vacina: {
														tipo: vac.tipo,
														idVacina: vac.id_vacina,
														nomeVacina: vac.nome_vacina,
														idProtocolo: vac.id_protocolo,
														nomeProtocolo: vac.nome_protocolo,
														qtdDosesProtocolo: vac.qtd_doses_protocolo,
														intervaloDiasDosesProtocolo:
															vac.intervalo_dias_doses_protocolo,
														protocoloValidoPor: vac.protocolo_valido_por,
														dataUltimaAplicacao: vac.data_ultima_aplicacao,
														dataValido: vac.data_valido,
														statusVacina: vac.status_vacina,
														vaccineCalendar: result
															.filter(
																(f) =>
																	f.id_unidade === currRow.id_unidade &&
																	f.id_paciente === pac.id_paciente &&
																	f.id_vacina_paciente ===
																		vac.id_vacina_paciente,
															)
															.map((cal) => ({
																idVaccineCalendar: cal.id_vaccine_calendar,
																scheduleId: cal.schedule_id,
																dataAgendamento: cal.data_agendamento,
																dataAplicacao: cal.data_aplicacao,
																doseAplicacao: cal.dose_aplicacao,
																laboratorioAplicacao: cal.laboratorio_aplicacao,
																loteAplicacao: cal.lote_aplicacao,
																statusAgendamentoVacina:
																	cal.status_agendamento_vacina,
															})),
													},
												});

												return currVacinas;
											},
											[] as ShowIt["pacientes"][number]["vacinasPaciente"],
										),
								});

								return currPatients;
							},
							[] as ShowIt["pacientes"],
						),
				});

				return resultUnits;
			}, [] as ShowIt[]),
		};
	}

	public async store(
		authCtx: AuthContext,

		data: Omit<IVaccineData, "active">,
	) {
		return Vaccine.create({
			economic_group_id: authCtx.group.id,
			system_id: authCtx.system.id,
			subgroup_id: data.subgroupId,
			type: data.type,
			name: data.name,
			description: data.description,
		});
	}

	public async show(authCtx: AuthContext, id: string) {
		const vaccine = await Vaccine.query()
			.where("system_id", authCtx.system.id)
			.where("id", id)
			.first();

		if (!vaccine) {
			throw new ResourceNotFoundException(
				"Vacina não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		if (!vaccine.economic_group_id) {
			return vaccine;
		}

		if (authCtx.group.id !== vaccine.economic_group_id) {
			throw new ResourceNotFoundException(
				"Vacina não encontrada",
				404,
				"E_NOT_FOUND",
			);
		}

		return vaccine;
	}

	public async update(authCtx: AuthContext, id: string, data: IVaccineData) {
		const vaccine = await this.show(authCtx, id);

		if (!vaccine.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		return vaccine
			.merge({
				subgroup_id: data.subgroupId,

				name: data.name,
				description: data.description,
				active: data.active,
				type: data.type,
			})
			.save();
	}

	public async destroy(authCtx: AuthContext, id: string) {
		const vaccine = await this.show(authCtx, id);

		if (!vaccine.economic_group_id) {
			throw this.sharedService.SystemResource();
		}

		await vaccine.softDelete();
	}
}
