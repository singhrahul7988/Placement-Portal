import express from "express";
import multer from "multer";
import authMiddleware from "../middleware/authMiddleware";
import {
  getPlacementCompanies,
  getPlacementFilters,
  getPlacementRecords,
  getPlacementStats,
  uploadPlacementRecords,
} from "../controllers/placementController";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/filters", authMiddleware, getPlacementFilters);
router.get("/records", authMiddleware, getPlacementRecords);
router.get("/stats", authMiddleware, getPlacementStats);
router.get("/companies", authMiddleware, getPlacementCompanies);
router.post("/upload", authMiddleware, upload.single("file"), uploadPlacementRecords);

export default router;
