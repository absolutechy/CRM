import winston from "winston"

import { env, isDev } from "@/config/env"

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const extra = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ""
    return `${String(timestamp)} ${level} ${String(message)}${extra}`
  })
)

/** JSON in production so a log aggregator can parse it; readable in dev. */
export const logger = winston.createLogger({
  level: isDev ? "debug" : "info",
  format: isDev
    ? devFormat
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
  defaultMeta: { service: "crm-api", env: env.NODE_ENV },
  transports: [new winston.transports.Console()],
})
