import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import servicesRouter from "./services";
import timeslotsRouter from "./timeslots";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/services", servicesRouter);
router.use("/timeslots", timeslotsRouter);
router.use("/stats", timeslotsRouter);

export default router;
