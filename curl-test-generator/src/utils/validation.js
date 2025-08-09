import Joi from 'joi';
import { config } from '../config/index.js';
import { ValidationError } from '../errors/index.js';

const validateAndThrow = (schema, data) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new ValidationError('Validation failed', error.details);
  }
  return value;
};

export const curlRequestSchema = Joi.object({
  text: Joi.string()
    .required()
    .min(5)
    .max(config.get('processing.maxCurlLength'))
    .messages({
      'string.empty': 'Curl command text is required',
      'string.min': 'Curl command must be at least 5 characters long',
      'string.max': `Curl command is too long (max ${config.get('processing.maxCurlLength')} characters)`
    }),
  processId: Joi.string()
    .required()
    .guid({ version: 'uuidv4' })
    .messages({
      'string.empty': 'Process ID is required',
      'string.guid': 'Process ID must be a valid UUID v4'
    })
});

export const processRequestSchema = Joi.object({
  processId: Joi.string()
    .required()
    .guid({ version: 'uuidv4' })
    .messages({
      'string.empty': 'Process ID is required',
      'string.guid': 'Process ID must be a valid UUID v4'
    })
});

export const testCaseSchema = Joi.object({
  testCaseName: Joi.string().required().max(200),
  description: Joi.string().required().max(500),
  url: Joi.string().required().uri(),
  method: Joi.string()
    .required()
    .valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
  headers: Joi.object().default({}),
  body: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.allow(null)),
  expectedResponse: Joi.object({
    statusCode: Joi.number().integer().min(100).max(599),
    contentType: Joi.string(),
    description: Joi.string()
  }),
  testPurpose: Joi.string().required().max(500)
});

export const validateCurlRequest = (data) => validateAndThrow(curlRequestSchema, data);
export const validateProcessRequest = (data) => validateAndThrow(processRequestSchema, data);
export const validateTestCase = (data) => validateAndThrow(testCaseSchema, data);
