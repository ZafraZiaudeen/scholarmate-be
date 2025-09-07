import { NotFoundError as BaseNotFoundError } from './custom-errors';

class NotFoundError extends BaseNotFoundError {
  constructor(message: string = "Resource not found") {
    super(message);
  }
}

export default NotFoundError;