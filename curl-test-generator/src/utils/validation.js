import Joi from 'joi';

export function validateCurlRequest(data) {
  const schema = Joi.object({
    text: Joi.string().required().min(5).messages({
      'string.empty': 'Curl command text is required',
      'string.min': 'Curl command must be at least 5 characters long'
    }),
    processId: Joi.string().required().messages({
      'string.empty': 'Process ID is required'
    })
  });

  return schema.validate(data);
}

export function validateProcessRequest(data) {
  const schema = Joi.object({
    processId: Joi.string().required().messages({
      'string.empty': 'Process ID is required'
    })
  });

  return schema.validate(data);
}
