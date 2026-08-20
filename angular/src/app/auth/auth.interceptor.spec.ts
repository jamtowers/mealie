import {
  HttpErrorResponse,
  type HttpEvent,
  HttpEventType,
  type HttpHandlerFn,
  HttpRequest,
} from "@angular/common/http";
import { TestBed } from "@angular/core/testing";

import { of, throwError } from "rxjs";
import type { Mock } from "vitest";

import { authInterceptor } from "./auth.interceptor";
import { AuthService } from "./auth.service";

describe("authInterceptor", () => {
  let getToken: Mock<() => string | null>;
  let setToken: Mock<(token: string | null) => void>;
  let getSession: Mock<() => Promise<void>>;
  let next: Mock<HttpHandlerFn>;

  const responseEvent = () => ({ type: HttpEventType.Response, body: { ok: true } }) as HttpEvent<unknown>;

  beforeEach(() => {
    getToken = vi.fn();
    setToken = vi.fn();
    getSession = vi.fn();
    next = vi.fn();

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: { getToken, setToken, getSession } }],
    });
  });

  const runInterceptor = (req: HttpRequest<unknown>) => TestBed.runInInjectionContext(() => authInterceptor(req, next));

  it("should pass the request through unchanged when there is no token", () => {
    getToken.mockReturnValue(null);
    const req = new HttpRequest("GET", "/api/recipes");
    next.mockReturnValue(of(responseEvent()));

    runInterceptor(req).subscribe();

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(req);
    expect(setToken).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("should attach an Authorization header with the token", () => {
    getToken.mockReturnValue("my-token");
    const req = new HttpRequest("GET", "/api/recipes");
    next.mockReturnValue(of(responseEvent()));

    runInterceptor(req).subscribe();

    const forwarded = next.mock.calls[0][0];
    expect(forwarded.headers.get("Authorization")).toBe("Bearer my-token");
    // The request is cloned, so the original must not be mutated.
    expect(req.headers.get("Authorization")).toBeNull();
  });

  it("should pass successful responses through untouched", () => {
    getToken.mockReturnValue("my-token");
    const req = new HttpRequest("GET", "/api/recipes");
    const event = responseEvent();
    next.mockReturnValue(of(event));

    const events: HttpEvent<unknown>[] = [];
    runInterceptor(req).subscribe((e) => events.push(e));

    expect(events).toEqual([event]);
  });

  it("should clear the token, refresh the session, and rethrow on 401", () => {
    getToken.mockReturnValue("my-token");
    const req = new HttpRequest("GET", "/api/recipes");
    const error = new HttpErrorResponse({ status: 401, statusText: "Unauthorized", url: "/api/recipes" });
    next.mockReturnValue(throwError(() => error));

    const onError = vi.fn();
    runInterceptor(req).subscribe({ error: onError });

    expect(setToken).toHaveBeenCalledWith(null);
    expect(getSession).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(error);
  });

  it("should rethrow non-401 errors without touching auth state", () => {
    getToken.mockReturnValue("my-token");
    const req = new HttpRequest("GET", "/api/recipes");
    const error = new HttpErrorResponse({ status: 500, statusText: "Server Error", url: "/api/recipes" });
    next.mockReturnValue(throwError(() => error));

    const onError = vi.fn();
    runInterceptor(req).subscribe({ error: onError });

    expect(setToken).not.toHaveBeenCalled();
    expect(getSession).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(error);
  });
});
