import Joi from 'joi';

export function validateCurlRequest(data) {
  const schema = Joi.object({
    text: Joi.string().required().min(5).max(50000).messages({
      'string.empty': 'Curl command text is required',
      'string.min': 'Curl command must be at least 5 characters long',
      'string.max': 'Curl command is too long (max 50000 characters)'
    }),
    processId: Joi.string().required().guid({ version: 'uuidv4' }).messages({
      'string.empty': 'Process ID is required',
      'string.guid': 'Process ID must be a valid UUID v4'
    })
  });

  return schema.validate(data);
}

export function validateProcessRequest(data) {
  const schema = Joi.object({
    processId: Joi.string().required().guid({ version: 'uuidv4' }).messages({
      'string.empty': 'Process ID is required',
      'string.guid': 'Process ID must be a valid UUID v4'
    })
  });

  return schema.validate(data);
}

export function validateTestCase(testCase) {
  const schema = Joi.object({
    testCaseName: Joi.string().required().max(200),
    description: Joi.string().required().max(500),
    url: Joi.string().required().uri(),
    method: Joi.string().required().valid('GET', 'POST', 'PUT', 'PATCH', 'DELETE'),
    headers: Joi.object(),
    body: Joi.alternatives().try(Joi.object(), Joi.string(), Joi.allow(null)),
    expectedResponse: Joi.object({
      statusCode: Joi.number().integer().min(100).max(599),
      contentType: Joi.string(),
      description: Joi.string()
    }),
    testPurpose: Joi.string().required().max(500)
  });

  return schema.validate(testCase);
}
