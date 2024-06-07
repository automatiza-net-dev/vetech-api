/*
|--------------------------------------------------------------------------
| Validating Environment Variables
|--------------------------------------------------------------------------
|
| In this file we define the rules for validating environment variables.
| By performing validation we ensure that your application is running in
| a stable environment with correct configuration values.
|
| This file is read automatically by the framework during the boot lifecycle
| and hence do not rename or move this file to a different location.
|
*/

import Env from "@ioc:Adonis/Core/Env";

export default Env.rules({
	HOST: Env.schema.string({ format: "host" }),
	PORT: Env.schema.number(),
	FILE_UPLOAD_PREFIX: Env.schema.string(),
	APP_KEY: Env.schema.string(),
	APP_NAME: Env.schema.string(),
	DRIVE_DISK: Env.schema.enum(["local", "s3"] as const),
	NODE_ENV: Env.schema.enum(["development", "production", "test"] as const),
	AWS_SES_KEY: Env.schema.string(),
	AWS_SES_REGION: Env.schema.string(),
	AWS_SES_SECRET: Env.schema.string(),
	MONGO_URI: Env.schema.string(),
	FOCUS_NFE_URL: Env.schema.string(),
	FOCUS_NFE_KEY: Env.schema.string(),
	AWS_S3_KEY: Env.schema.string(),
	AWS_S3_BUCKET: Env.schema.string(),
	AWS_S3_REGION: Env.schema.string(),
	AWS_S3_SECRET: Env.schema.string(),
	TRANSPILER_PATH: Env.schema.string(),
});
