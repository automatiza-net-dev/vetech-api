/*
|--------------------------------------------------------------------------
| Http Exception Handler
|--------------------------------------------------------------------------
|
| AdonisJs will forward all exceptions occurred during an HTTP request to
| the following class. You can learn more about exception handling by
| reading docs.
|
| The exception handler extends a base `HttpExceptionHandler` which is not
| mandatory, however it can do lot of heavy lifting to handle the errors
| properly.
|
*/

import Logger from "@ioc:Adonis/Core/Logger";
import HttpExceptionHandler from "@ioc:Adonis/Core/HttpExceptionHandler";
import { axiom } from "App/Lib/Axiom";
import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import Env from "@ioc:Adonis/Core/Env";

export default class ExceptionHandler extends HttpExceptionHandler {
	constructor() {
		super(Logger);
	}

	public async handle(error: Error, ctx: HttpContextContract) {
		axiom.ingest(Env.get("AXIOM_DATASET"), [
			{
				_type: "$error",
				name: error.name ?? "-",
				message: error.message,
				stack: error.stack,
				url: ctx.request.url,
			},
		]);
		await axiom.flush();

		return super.handle(error, ctx);
	}
}
