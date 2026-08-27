declare module '@angular/common/http' {
  export function provideHttpClient(...features: any[]): any;
  export function withFetch(): any;
  export function withInterceptors(interceptors: any[]): any;
  export interface HttpInterceptorFn {
    (req: HttpRequest<any>, next: HttpHandlerFn): import('rxjs').Observable<HttpEvent<any>>;
  }
  export class HttpClient {
    get<T = any>(url: string, options?: any): import('rxjs').Observable<T>;
    post<T = any>(url: string, body: any, options?: any): import('rxjs').Observable<T>;
    put<T = any>(url: string, body: any, options?: any): import('rxjs').Observable<T>;
    delete<T = any>(url: string, options?: any): import('rxjs').Observable<T>;
  }
  export class HttpErrorResponse {
    status: number;
    error: any;
    message: string;
  }
  export class HttpRequest<T = any> {
    url: string;
    clone(update?: any): HttpRequest<T>;
  }
  export type HttpHandlerFn = (req: HttpRequest<any>) => import('rxjs').Observable<HttpEvent<any>>;
  export interface HttpEvent<T = any> {}
}

declare module 'rxjs' {
  export class Observable<T = any> {
    subscribe(observer?: any): any;
    pipe(...operations: any[]): Observable<any>;
  }
  export function tap<T>(observer?: any): (source: Observable<T>) => Observable<T>;
  export function catchError<T, R>(selector: (err: any, caught: Observable<T>) => Observable<R>): (source: Observable<T>) => Observable<T | R>;
  export function of<T>(...args: T[]): Observable<T>;
  export function throwError(errorFactory: () => any): Observable<never>;
}
