const { alterSync } = require('../db/sync');
const { postgresClient } = require("../db/postgres");
const { Op, Model } = require("sequelize");

const {User} = require('../models/user');
const {Caption} = require('../models/caption');
const {Commitment} = require('../models/commitment');
const {Nomination} = require('../models/nomination');
const {Poll} = require('../models/poll');
const {Vote} = require('../models/vote');

const jwt = require("jsonwebtoken");
const Filter = require("bad-words");
const words = require("../bad-words.json");

const allPolls = async (req, res) => {

  const polls = await Poll.findAll()
  
  return res.status(200).json({ polls });
};

const getPoll = async (req, res) => {
  try {
    const pollID = req.params.id;

    const poll = await Poll.findByPk(pollID)

    if (!poll) {
      console.log("No found with the given ID: ", pollID)
      return res.status(404).json({ message: `No poll found by the ID ${pollID}` });
    }

    console.log("Poll found: ", poll)
    res.status(200).json({ poll });
  } catch (error) {
    console.log("[getPoll Route] There was an error: ", error);
    res.status(500).json({
      status: "failure",
      message: "There was an error, please try after some time",
      error: error
    });
  }
};

const createPoll = async (req, res) => {
  try {
    const ques = req.body.question;
    const commitmentID = req.body.commitmentID;

    const poll = await Poll.create({
      question: ques,
      commitmentID: commitmentID,
    });

    res.status(201).json({ poll });
  }catch(error){
    res.status(400).json({
      status: "failure",
      message: "There was an error, please try after sometime",
      error: error
    });
  }
};

const updatePoll = async (req, res) => {
  try {
    const pollID = req.params.id;
    const question = req.body.question;

    const poll = await Poll.findByPk(pollID);

    if (!poll) {
      console.log("Poll with given ID not found: ", pollID);
      return res.status(404).json({
        status: "failure",
        message: `No poll found with ID ${pollID}` ,
      });
    }

    poll.question = question;
    await poll.save();
    res.status(200).json({
      status: "success",
      message: "Poll updated successfully",
      poll: poll
    });
  }catch(error){
    console.log("[updatePoll Route] There was an error");
    res.status(400).json({
      status: "failure",
      message: "There was an error, please try after sometime",
      error: error
    });
  }
};

const deletePoll = async (req, res) => {
  try {
    const pollID = req.params.id;

    const poll = await Poll.findByPk(pollID);

    if (!poll) {
      return res.status(404).json({
        status: "failure",
        message: `No poll found with the ID:  ${pollID}`
      });
    }

    await Poll.destroy({where: {pollID: pollID}});

    console.log("Poll with given ID was successfully deleted");
    res.status(200).json({
      msg: `Poll with ID ${pollID} was deleted`});
  } catch (error) {
    console.log("[deletePoll Route] There was an error: ", error);
    res.status(500).json({
      status: "failure",
      message: "something went wrong",
      error: error
    });
  }
};

const votePoll = async (req, res) => {
  try {
    const voterID = req.user.id;
    const targetID = req.body.targetId;
    const pollID = req.params.id;

    const poll = await Poll.findByPk(pollID);

    if (!poll)
      return res
        .status(404)
        .json({
          status: "failure",
          message: `Cannot find a poll with the ID: ${pollID}`
        });

    if (!voterID || !targetID){
      console.log("[votePoll Route] Target ID not present")
      return res.status(400).json({
          status: "failure",
          message: "Send the target id"
      });
    }

    if (voterID == targetID) {
      console.log("TargetID same as UserID");
      return res.status(400).json({
        status: "failure",
        message: "You cannot vote for yourself"
      });
    }

    const targetUser = await User.findByPk(targetID)

    if (!targetUser) {
      console.log("Target User doesn't exist");
      return res.status(500).json({
        status: "failure",
        message: "Target User not found"
      });
    }

    poll.totalCount = poll.totalCount + 1;
    
    targetUser.count = targetUser.count + 1;
    voterUser.hasVoted = true;

    poll.set('votes', poll.votes); // setting the column 'votes' manually to our local variable poll.votes
    poll.changed('votes', true); // telling sequelize manually that this column has changed and needs updating.

    poll.save();

    return res.status(200).json({ msg: "voted for user", poll: poll });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "somethong went wrong" });
  }
};

const leaderboard = async (req, res) => {
  try {
    const response = [];

    const polls = await Poll.findAll({
      where: {
        totalCount:{
          [Op.gte]: 1,  
        }
      }
    });

    for (var j = 0; j < polls.length; j++) {
      var votes = polls[j].votes;

      var maximumValue = votes[0].count;
      var maxIndex = 0;

      for (var i = 1; i < votes.length; i++) {
        if (votes[i].count > maximumValue) {
          maxIndex = i;
          maximumValue = votes[i].count;
        }
      }

      let user = await User.findByPk(votes[maxIndex].user);

      response.push({ id: user.id, name: user.name, votes: maximumValue, imageUrl: user.imageUrl, bitsId: user.bitsId, pollQuestion: polls[j].question });
    }

    return res.status(200).json({ response });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Something went wrong" });
  }
};

module.exports = {
  allPolls,
  getPoll,
  createPoll,
  updatePoll,
  deletePoll,
  votePoll,
  leaderboard,
};
