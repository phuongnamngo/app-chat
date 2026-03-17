import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => void;
export default authMiddleware;
//# sourceMappingURL=auth.d.ts.map