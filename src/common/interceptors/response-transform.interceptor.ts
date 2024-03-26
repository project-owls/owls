import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  message: string;
  statusCode: number;
  data: T;
}

@Injectable()
// 응답 양식 통일을 위한 interceptor
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {

  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {

    const currentStatusCode = context.switchToHttp().getResponse().statusCode;

    const messageFromMetaData = this.reflector.get<string>('response-message', context.getHandler())
    
    return next.handle().pipe(map(data => ({ 
      message: messageFromMetaData || data.message || '',
      statusCode: currentStatusCode,
      data: data.data || data || {},
    })));
  }
}