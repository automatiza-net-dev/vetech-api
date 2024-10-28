import { HttpContextContract } from "@ioc:Adonis/Core/HttpContext";
import { SpanStatusCode, trace } from "@opentelemetry/api";

export default class TracerMiddleware {
	public async handle(ctx: HttpContextContract, next: () => Promise<void>) {
		const tracer = trace.getTracer("api");

		const span = tracer.startSpan(
			`HTTP ${ctx.request.method()} ${ctx.request.url()}`,
		);

		try {
			await next();

      span.setStatus({
				code: SpanStatusCode.OK,
			});

		} catch (e) {
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: e.message,
			});

			throw e;
		} finally {
			span.end();
		}
	}
}
