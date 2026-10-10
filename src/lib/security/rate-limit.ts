export type RateLimitContext = {
  key: string;
  action:
    | "login"
    | "password-reset"
    | "form-submit"
    | "media-upload"
    | "api";
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds?: number;
};

export interface RateLimiter {
  check(context: RateLimitContext): Promise<RateLimitResult>;
}
