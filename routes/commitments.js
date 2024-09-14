const router = require("express").Router();
const { 
    allCommitments, 
    updateUserCommitments, 
    searchByCommitment, 
    addCommitment, 
    editCommitment, 
    deleteCommitment
} = require("../views/commitments");

router.post("/", addCommitment);
router.get("/", allCommitments);
router.get("/:id", searchByCommitment);
router.post("/user", updateUserCommitments);
router.delete("/", deleteCommitment);
router.put("/", editCommitment);

module.exports = router;