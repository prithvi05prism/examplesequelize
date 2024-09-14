const express = require("express");
const router = express.Router();
const Poll = require("../models/poll");
const { User } = require("../models/user");

const {
  allPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  leaderboard,
} = require("../views/polls");

// const { isAdmin } = require("../middleware/auth");

router.get("/leaderboard", leaderboard);
router.get("/", allPolls);
router.get("/:id", getPoll);
router.post("/", createPoll);
router.patch("/:id", updatePoll);
router.delete("/:id", deletePoll);
router.put("/:id/vote", votePoll);

module.exports = router;
