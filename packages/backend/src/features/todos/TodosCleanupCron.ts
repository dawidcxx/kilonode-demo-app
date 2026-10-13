import { inject, injectable } from "@needle-di/core";
import { CronService } from "../../lib/CronService";
import { Logger } from "../../lib/Logger";
import type { OnDeinit } from "../../shared/OnDeinit";
import type { OnInit } from "../../shared/OnInit";
import { TodosService } from "./TodosService";

@injectable()
export class TodosCleanupCron implements OnInit, OnDeinit {
  private stop: (() => void) | null = null;

  constructor(
    private readonly cron = inject(CronService),
    private readonly todosService = inject(TodosService),
  ) {}

  async init() {
    this.stop = this.cron.registerDaily("todos.cleanup", { hour: 1 }, async () => {
      const deleted = await this.todosService.deleteAll();
      logger.info("Cleaned up todos", { deleted });
    });
  }

  async deinit() {
    this.stop?.();
    this.stop = null;
  }
}

const logger = Logger.for(TodosCleanupCron);
