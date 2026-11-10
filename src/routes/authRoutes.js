const router = require("express").Router();
const auth = require("../middleware/requireAuth");
const asyncHandler = require("../utils/asyncHandler");
const controller = require("../controllers/authController");
router.post("/register", asyncHandler(controller.register));
router.post("/login", asyncHandler(controller.login));
router.post("/logout", controller.logout);
router.get("/me", auth, controller.me);
module.exports = router;
