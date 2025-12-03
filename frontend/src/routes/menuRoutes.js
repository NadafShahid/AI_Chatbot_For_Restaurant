const express = require("express");
const router = express.Router();
const MenuController = require("../controllers/menuController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Make sure public/images exists
const imageDir = path.join(__dirname, "../public/images");
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Routes
router.post("/", upload.single("image"), MenuController.createMenuItem);
router.put("/:id", upload.single("image"), MenuController.updateMenuItem);
router.get("/", MenuController.getAllMenuItems);
router.get("/:id", MenuController.getMenuItemById);
router.delete("/:id", MenuController.deleteMenuItem);

module.exports = router;
