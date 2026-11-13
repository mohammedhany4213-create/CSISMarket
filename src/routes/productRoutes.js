const router = require("express").Router();
const { rateLimit } = require("express-rate-limit");
const auth = require("../middleware/requireAuth");
const controller = require("../controllers/productController");

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many contact requests. Please try again later." }
});

router.get("/", controller.list);
router.get("/mine", auth, controller.mine);
router.get("/:id/contact", auth, contactLimiter, controller.contact);
router.get("/:id", controller.getOne);
router.post("/", auth, controller.create);
router.patch("/:id", auth, controller.update);
router.patch("/:id/availability", auth, controller.setAvailability);
router.delete("/:id", auth, controller.remove);

module.exports = router;
