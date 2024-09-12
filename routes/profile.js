const router = require("express").Router();
// const { isAdmin } = require("../middleware/auth");

const { addProfile, getProfile, editProfile, writeCaption, searchUsers, deleteProfile } = require("../views/profile");


router.get("/search", searchUsers);
router.post("/:id/caption", writeCaption);
router.get("/:id", getProfile);
router.post("/", addProfile);
router.patch("/edit", editProfile);
router.delete("/:id", deleteProfile);

module.exports = router;