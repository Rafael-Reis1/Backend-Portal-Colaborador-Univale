import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Socket } from "socket.io";
import { Observable } from "rxjs";
import { verify } from "jsonwebtoken";

export class WsJwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        if(context.getType() !== 'ws') {
            return true;
        }
        
        const client: Socket = context.switchToWs().getClient();
        WsJwtGuard.validateToken(client);

        return true;
    }

    static validateToken(client: Socket) {
        const { authorization } = client.handshake.auth;
        const token: string = authorization.split(' ')[1];
        const payload = verify(token, process.env.TOKEN_SECRET);
        return payload;
    }
}