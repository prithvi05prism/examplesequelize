const router = require("express").Router();

const { 
    allCommitments,  
    searchByCommitment, 
    updateUserCommitments,
    addCommitment, 
    bulkAddCommitments,
    editCommitment, 
    deleteCommitment
} = require("../views/commitments");

router.post("/", addCommitment);
router.post("/bulk", bulkAddCommitments);
router.get("/", allCommitments);
router.post("/user", updateUserCommitments);
router.delete("/:id", deleteCommitment);
router.get("/search", searchByCommitment);
router.put("/", editCommitment);

module.exports = router;