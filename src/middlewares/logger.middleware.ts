import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface GraphQLBody {
  operationName?: string;
  query?: string;
  variables?: Record<string, unknown>;
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl } = request;

    // GraphQL 요청인지 확인
    const isGraphQL = originalUrl === '/graphql';

    // GraphQL 요청인 경우 body 정보도 로깅
    if (isGraphQL && request.body) {
      const { operationName, query } = request.body as GraphQLBody;

      // const queryPreview = query
      //   ? query.length > 100
      //     ? `${query.substring(0, 100)}...`
      //     : query
      //   : 'No query';

      this.logger.log(
        `GraphQL Request: ${method} ${originalUrl} - Operation: ${operationName || 'Anonymous'} - Query: \n ${query}`,
      );
    }
    const startTime = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const duration = Date.now() - startTime;

      if (isGraphQL) {
        // GraphQL 응답 로깅
        this.logger.log(
          `GraphQL Response: ${method} ${originalUrl} ${statusCode} ${contentLength} - Duration: ${duration}ms`,
        );
      } else {
        // 일반 HTTP 요청 로깅
        this.logger.log(
          `${method} ${originalUrl} ${statusCode} ${contentLength} - Duration: ${duration}ms`,
        );
      }
    });

    next();
  }
}
