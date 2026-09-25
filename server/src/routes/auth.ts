import { Router } from "express"
import rateLimit from "express-rate-limit"

import * as controller from "@/controllers/authController"
import { authenticate, authorize } from "@/middleware/auth"

export const authRouter: Router = Router()

// Tight brute-force limiter for credential endpoints only. Other auth routes
// (me/refresh/logout) are protected by the global /api rate limiter.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    message: "Too many authentication attempts, please try again shortly",
  },
})

authRouter.post(
  "/register",
  authLimiter,
  authenticate,
  authorize("admin"),
  controller.register
)
authRouter.post("/login", authLimiter, controller.login)
authRouter.post("/refresh", controller.refresh)
authRouter.post("/logout", controller.logout)
authRouter.get("/me", authenticate, controller.me)
