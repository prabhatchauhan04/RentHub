
/*
 * Validates request bodies using the supplied Zod schema.
 * Returns field-level validation errors for invalid requests.
 */

import AppError from "../utils/app-error.js";

const validate = (schema) => (req, res, next) => {

  const result = schema.safeParse(req.body);

  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));

    return next(
      new AppError("Validation failed.", 400, details)
    );
  }

  req.body = result.data;
  next();
};

export default validate;
