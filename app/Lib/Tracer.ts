import { Resource } from "@opentelemetry/resources";
import Logger from "@ioc:Adonis/Core/Logger";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import Env from "@ioc:Adonis/Core/Env";

class Tracer {
	// url is optional and can be omitted - default is http://localhost:4318/v1/traces
	private exporter = new OTLPTraceExporter({
		url: "https://api.axiom.co/v1/traces",
		headers: {
			Authorization: `Bearer ${Env.get("AXIOM_TOKEN")}`,
			"X-Axiom-Dataset": Env.get("AXIOM_DATASET"),
		},
	});

	public init() {
		try {
			const sdk = new NodeSDK({
				resource: new Resource({
					[ATTR_SERVICE_NAME]: Env.get("AXIOM_LABEL"),
				}),
				traceExporter: this.exporter,
				instrumentations: [
					getNodeAutoInstrumentations({
						"@opentelemetry/instrumentation-pg": {
							enabled: true,
							enhancedDatabaseReporting: true,
						},
						"@opentelemetry/instrumentation-http": { enabled: true },
						"@opentelemetry/instrumentation-net": { enabled: true },
						"@opentelemetry/instrumentation-fs": { enabled: false },
					}),
				],
			});

			// Start SDK
			sdk.start();

			// Graceful shutdown on termination signals
			process.on("SIGTERM", () => {
				sdk
					.shutdown()
					.then(() => {
						Logger.info("Tracing terminated");
						process.exit(0);
					})
					.catch((error) => {
						Logger.error("Error shutting down tracing: %o", error);
						process.exit(1);
					});
			});

			Logger.info("The tracer has been initialized");
		} catch (e) {
			Logger.error("Failed to initialize the tracer: %o", e);
		}
	}
}

export default new Tracer();
