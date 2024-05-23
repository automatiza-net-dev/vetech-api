/**
 * Config source: https://git.io/JesV9
 *
 * Feel free to let us know via PR, if you find something broken in this config
 * file.
 */

import Env from "@ioc:Adonis/Core/Env";
import { DatabaseConfig } from "@ioc:Adonis/Lucid/Database";

const databaseConfig: DatabaseConfig = {
	/*
  |--------------------------------------------------------------------------
  | Connection
  |--------------------------------------------------------------------------
  |
  | The primary connection for making database queries across the application
  | You can use any key from the `connections` object defined in this same
  | file.
  |
  */
	connection: Env.get("DB_CONNECTION"),

	connections: {
		/*
    |--------------------------------------------------------------------------
    | PostgreSQL config
    |--------------------------------------------------------------------------
    |
    | Configuration for PostgreSQL database. Make sure to install the driver
    | from npm when using this connection
    |
    | npm i pg
    |
    */
		pg: {
			client: "pg",
			connection: `postgresql://${Env.get("PG_USER")}:${Env.get(
				"PG_PASSWORD",
			)}@${Env.get("PG_HOST")}:${Env.get("PG_PORT")}/${Env.get(
				"PG_DB_NAME",
			)}?options=-c%20TimeZone=America/Sao_Paulo`,
			migrations: {
				naturalSort: true,
			},
			healthCheck: false,
			debug: false,
		},
	},
};

export default databaseConfig;
