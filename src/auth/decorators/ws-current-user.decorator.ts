import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtPayload, verify } from 'jsonwebtoken';

export const WsUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const client: Socket = context.switchToWs().getClient();
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
  },
);