const router = require("express").Router();

const {
  allPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  leaderboard,
} = require("../views/polls");

router.get("/leaderboard", leaderboard);
router.get("/", allPolls);
router.get("/:id", getPoll);
router.post("/", createPoll);
router.patch("/:id", updatePoll);
router.delete("/:id", deletePoll);
router.put("/:id/vote", votePoll);

module.exports = router;
