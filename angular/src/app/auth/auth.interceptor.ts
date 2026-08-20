import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";

import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { AuthService } from "./auth.service";

/**
 * Attaches the auth token to outgoing API requests and handles 401
 * responses by clearing the token and resetting auth state.
 */
export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);

  const token = authService.getToken();

  // If we have no token we're unauthenticated so we let the request continue as normal
  if (token == null) return next(req);

  const authenticatedRequest = req.clone({
    headers: req.headers.append("Authorization", `Bearer ${token}`),
  });

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.setToken(null);
        // The service's getSession() already handles the redirect
        // signal update, so we just let the error propagate.
        authService.getSession();
      }
      return throwError(() => error);
    }),
  );
}
