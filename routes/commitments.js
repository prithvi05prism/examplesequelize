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
router.post("/user", updateUserCommitments);
router.delete("/:id", deleteCommitment);
router.get("/:id", searchByCommitment);
router.put("/", editCommitment);

module.exports = router;