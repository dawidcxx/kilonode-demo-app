import { injectable } from "@needle-di/core";
import { isNil } from "@kilonode-demo-app/common";
import { LOG_LEVELS, type LogLevel } from "@/lib/Logger";

@injectable()
export class Config {
  constructor(private readonly overridesMap: Partial<Config> = {}) {}

  public get ttlCacheSize(): number {
    return this.overridesMap.ttlCacheSize ?? 10000;
  }

  public get cronEnabled(): boolean {
    if (!isNil(this.overridesMap.cronEnabled)) {
      return this.overridesMap.cronEnabled;
    }
    const fromEnv = process.env["CRON_ENABLED"]?.toLowerCase();
    return isNil(fromEnv) ? true : fromEnv !== "false";
  }

  public get logLevel(): LogLevel {
    if (!isNil(this.overridesMap.logLevel)) {
      return this.overridesMap.logLevel;
    }
    const fromEnv = process.env["LOG_LEVEL"]?.toLowerCase();
    if (!isNil(fromEnv) && LOG_LEVELS.includes(fromEnv as LogLevel)) {
      return fromEnv as LogLevel;
    } else {
      return "debug";
    }
  }

  public get httpHost(): string {
    return this.overridesMap.httpHost ?? process.env["HOST"] ?? "0.0.0.0";
  }

  public get httpPort(): string {
    return this.overridesMap.httpPort ?? process.env["PORT"] ?? "8080";
  }
}
