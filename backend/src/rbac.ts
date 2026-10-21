import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * RBAC mínimo para GHOST KD.
 * Lee el rol desde el header `x-role: ADMIN|ANALYST|VIEWER` (por defecto VIEWER).
 * En producción, sustituir por JWT (AuthGuard + RolesGuard).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const req = ctx.switchToHttp().getRequest();
    const role = String(req.headers['x-role'] || 'VIEWER').toUpperCase();
    // Jerarquía: ADMIN > ANALYST > VIEWER
    const rank: Record<string, number> = { VIEWER: 1, ANALYST: 2, ADMIN: 3 };
    const have = rank[role] ?? 1;
    const need = Math.min(...required.map((r) => rank[r] ?? 1));
    if (have < need) throw new ForbiddenException(`Se requiere rol ${required.join('/')} (actual: ${role})`);
    return true;
  }
}
