import { registerAs } from '@nestjs/config';
import { ConfigFactory } from '@nestjs/config/dist/interfaces';
import Joi from 'joi';

/**
 * 환경 변수 스키마
 *
 * @returns 환경 변수 스키마
 */
export enum ENV_SCHEMA {
  PORT = 'PORT',
  REDIS_HOST = 'REDIS_HOST',
  REDIS_PORT = 'REDIS_PORT',
  RMQ_ID = 'RMQ_ID',
  RMQ_PASSWORD = 'RMQ_PASSWORD',
  RMQ_HOST = 'RMQ_HOST',
  RMQ_PORT = 'RMQ_PORT',
}

const envSchema = {
  [ENV_SCHEMA.PORT]: Joi.number().required(),
  [ENV_SCHEMA.REDIS_HOST]: Joi.string().required(),
  [ENV_SCHEMA.REDIS_PORT]: Joi.number().required(),
  [ENV_SCHEMA.RMQ_ID]: Joi.string().required(),
  [ENV_SCHEMA.RMQ_PASSWORD]: Joi.string().required(),
  [ENV_SCHEMA.RMQ_HOST]: Joi.string().required(),
  [ENV_SCHEMA.RMQ_PORT]: Joi.number().required(),
};

/**
 * 환경 변수 프로바이더
 *
 * @returns 환경 변수 프로바이더
 */
export const envProvider = (): Array<
  ConfigFactory | Promise<ConfigFactory>
> => {
  const returnProvider: Record<string, string | undefined> = {};

  for (const key in envSchema) {
    returnProvider[key] = process.env[key];
  }

  const envConfig = registerAs('env', () => returnProvider);
  return [envConfig];
};

/**
 * 환경 변수 검증 스키마
 *
 * @returns 환경 변수 검증 스키마
 */
export const envValidators = Joi.object().append(envSchema);
