import { Router } from "express";
import { createAlbum,createSong,deleteAlbum,deleteSong } from "../controller/admin.controller.js";
import {protectRoute,requireAdmin} from "../../middleware/auth.middleware.js"
import { checkAdmin } from "../controller/admin.controller.js";

const router = Router();

router.use(protectRoute,requireAdmin);

router.get("/check",checkAdmin);

router.post("/songs",createSong);
router.delete("/songs/:id",deleteSong);

router.post("/albums",createAlbum);
router.delete("/albums/:id",deleteAlbum);

export default router; 