import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Observable, catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.token();

  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });
  } else {
    authReq = req.clone({
      setHeaders: {
        Accept: 'application/json'
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      if (error?.status === 401 && !req.url.includes('/login')) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
