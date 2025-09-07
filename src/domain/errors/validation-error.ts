import { ValidationError as BaseValidationError } from './custom-errors';

class ValidationError extends BaseValidationError {
  constructor(message: string = "Validation failed", details?: any) {
    super(message, details);
  }
}

export default ValidationError;