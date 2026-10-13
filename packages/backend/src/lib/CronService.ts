import { serializeError } from "serialize-error";
import { Logger } from "@/lib/Logger";

export class CronService {
  constructor(private readonly config: CronServiceConfig = { isEnabled: false }) {}

  register(jobId: string, everyMs: number, job: () => Promise<void>): () => void {
    let isFirstRun = true;
    return this.schedule(
      jobId,
      () => {
        if (isFirstRun) {
          isFirstRun = false;
          return 1000;
        }
        return everyMs;
      },
      job,
    );
  }

  registerDaily(
    jobId: string,
    timeOfDay: { hour: number; minute?: number },
    job: () => Promise<void>,
  ): () => void {
    return this.schedule(jobId, () => msUntilNext(timeOfDay), job);
  }

  private schedule(
    jobId: string,
    getNextDelayMs: () => number,
    job: () => Promise<void>,
  ): () => void {
    if (!this.config.isEnabled) {
      logger.info(`Cron job ${jobId} skipped: cron is disabled`);
      return () => {};
    }

    let isRunning = false;
    let isStopped = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (isRunning) {
        logger.warn(`Skipping cron job ${jobId}: previous invocation is still running`);
        return;
      }

      isRunning = true;
      const startedAt = Date.now();
      const slowJobWarningTimeout = setTimeout(() => {
        logger.warn(`Cron job ${jobId} has been running for more than 1000ms`);
      }, 1000);

      job()
        .catch((err) => {
          logger.error(`Error in cron job ${jobId}`, { error: serializeError(err) });
        })
        .finally(() => {
          clearTimeout(slowJobWarningTimeout);
          isRunning = false;
          const durationMs = Date.now() - startedAt;
          if (durationMs > 1000) {
            logger.warn(`Cron job ${jobId} completed in ${durationMs}ms`);
          }
        });
    };

    const scheduleNextRun = (): number => {
      const delayMs = getNextDelayMs();
      timeout = setTimeout(() => {
        run();
        if (!isStopped) {
          scheduleNextRun();
        }
      }, delayMs);
      return delayMs;
    };

    const firstRunInMs = scheduleNextRun();

    logger.info(`Registered CronJob: '${jobId}'`, { jobId, firstRunInMs });

    return () => {
      isStopped = true;
      if (timeout !== null) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
  }
}

export type CronServiceConfig = {
  isEnabled: boolean;
};

function msUntilNext({ hour, minute = 0 }: { hour: number; minute?: number }): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

const logger = Logger.for(CronService);
