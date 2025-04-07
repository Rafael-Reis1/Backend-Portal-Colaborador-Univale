import { CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Socket } from "socket.io";
import { Observable } from "rxjs";
import { JwtPayload, verify } from "jsonwebtoken";

export class WsJwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        if(context.getType() !== 'ws') {
            return true;
        }
        
        const client: Socket = context.switchToWs().getClient();
        WsJwtGuard.validateToken(client);

        return true;
    }

    static validateToken(client: Socket): JwtPayload {
        const { authorization } = client.handshake.auth;
        if (!authorization) {
            throw new UnauthorizedException('No authorization header');
        }
        const token: string = authorization.split(' ')[1];

        try {
            const payload = verify(token, process.env.JWT_SECRET) as JwtPayload;
            return payload;
        } catch (error) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}