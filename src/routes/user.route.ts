import { Router } from "express"
import { createUser, getUser } from "../controllers/user.controller";
const router = Router();

router.post("/createUser", createUser);
router.get("/:email", getUser);

export default router;