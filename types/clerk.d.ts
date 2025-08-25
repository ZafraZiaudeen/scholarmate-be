// types/clerk.d.ts
import { AuthContext } from '@clerk/clerk-sdk-node';

declare global {
  namespace Express {
    interface Request {
      auth(): AuthContext | null;
    }
  }
}