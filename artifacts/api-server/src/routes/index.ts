import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import servicesRouter from "./services";
import timeslotsRouter from "./timeslots";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/services", servicesRouter);
router.use("/timeslots", timeslotsRouter);
router.use("/stats", statsRouter);

export default router;
