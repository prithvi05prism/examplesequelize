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

const sendRequest = async (req, res) => {
  try {
    // const senderId = req.user.id;
    const senderID = req.body.id;
    const targetID = req.body.targetId;

    var caption = req.body.caption;

    if (senderID == targetID) {
        return res.status(403).send({
            status: "failure", 
            message: "You can't write for yourself",
        });
    }

    if(caption==null){
        console.log("[sendRequest Route] There is no caption sent");
        return res.status(400).send({
            status: "failure",
            message: "Please enter a caption",
      })
    }

    const sender = await User.findByPk(senderID);
    const target = await User.findByPk(targetID);

    if(!target){
        console.log("The target user doesn't exist");
        return res.status(400).send({
            status: "failure",
            message: "The target User doesn't exist"
        })
    }

    const filter = new Filter({ placeHolder: "x" });
    filter.addWords(...words);
    caption = filter.clean(caption);

    const caption_record = await Caption.findOne({where: {
        [Op.and]: [
            {writerID: senderID},
            {targetID: targetID}
        ]
    }})

    if (caption_record) {
        if(caption_record.caption !== caption){
            caption_record.caption = caption;
            await caption_record.save();
        }
      console.log("[sendRequest Route] Request has already been sent by " + sender.name + " to " + target.name);
      console.log(caption_record.toJSON())
      return res.status(500).send({
        status: "failure",
        message: "You have already sent a request to this user",
      });
    }else{
        const new_caption = await Caption.create({
            writerID: senderID,
            targetID: targetID,
            caption: caption,
            status: 0
        });

        console.log("[sendRequest Route] Request sent succesfully: ", new_caption.toJSON());

        return res.send({
          status: "success",
          message: "Request sent successfully!",
        });
    }
  } catch (err) {
    console.log("[sendRequest Route] There was an erorr: ", err);

    return res.status(500).send({
      status: "failure",
      message: "There was an error, Please try after some time",
      error: err
    });
  }
};

const allRequests = async (req, res) => {
  try {
    // const senderID = req.user.id;
    const senderID = req.body.id;

    const requests = await Caption.findAll({
        where: {
            [Op.and]: [
                {targetID: senderID},
                {status: 0}
            ]
        },
        include: {
            model: User,
            as: 'writer',
            attributes: ['name', 'bitsId', 'imageUrl', 'quote']
        }
    });

    const declined_requests = await Caption.findAll({where: {
        [Op.and]: [
            {targetID: senderID},
            {status: -1}
        ]
    }});

    console.log("The requests are: ", requests);
    console.log("The declined_requests are: ", declined_requests);

    return res.status(200).send({
      status: "success",
      requests: requests,
      declined_requests: declined_requests,
    });
  } catch (err) {
    console.log("[allRequests Route] There was an error: ", err);
    return res.status(500).send({
      status: "failure",
      message: "There was an error, Please try after some time",
      error: err
    });
  }
};

const nominateUser = async (req, res) => {
  try {
    // const senderID = req.user.id;
    const senderID = req.body.id;
    const receiverID = req.body.receiverId;

    const target = await User.findByPk(receiverID);

    if(!target){
        console.log("The target user doesn't exist");
        res.status(403).send({
            status: "failure",
            message: "The target user doesn't exist"
        })
    }

    const nomination = await Nomination.findOne({where: {
        [Op.and]: [
            {nominatorID: senderID},
            {targetID: receiverID}
        ]
    }})

    if (nomination){
        console.log("Target has already been nominated!!");
        return res.status(403).send({
            status: "failure",
            message: "User has already been nominated!",
         });
    }

    if (receiverID == senderID) {
        console.log("[nominateUser Route] You can't nominate yourself!!!");
        return res.status(403).send({
            status: "failure",
            message: "You can't nominate yourself",
        });
    }

    const new_nomination = await Nomination.create({
        nominatorID: senderID,
        targetID: receiverID
    });

    console.log("New nomination has been created: ", new_nomination);

    // Handling the cases where request was already sent by the targetUser: 

    const request = await Caption.findOne({where: {
        [Op.and]: [
            {writerID: receiverID},
            {targetID: senderID}
        ]
    }});

    if(request){
        request.status = 1;
        await request.save();
        console.log("Caption updated to approved status.");
        return res.status(200).send({
            status: "success",
            message: "Target has been nominated and Caption approved"
        });
    }else{
        return res.status(200).send({
            status: "success",
            message: "Target has been nominated"
        })
    }
  } catch (err) {
    console.log("[nominateUser Route] An error occurred: ", err);
    return res.status(400).send({
      status: "failure",
      message: "There was an error, please try again after sometime",
      error: err
    });
  }
};

const declineRequest = async (req, res) => {
  try {
    // senderId = req.user.id;
    const senderID = req.body.id;
    const receiverID = req.body.receiverId;

    const nomination = await Nomination.findOne({where: {
        [Op.and]: [
            {nominatorID: senderID},
            {targetID: receiverID}
        ]
    }});

    if(nomination){
        await Nomination.destroy({where: {
            [Op.and]: [
                {nominatorID: senderID},
                {targetID: receiverID}
            ]
        }});

        console.log("[declineRequest Route] The Nomination has been removed successfully");
    }

    const caption = await Caption.findOne({where: {
        [Op.and]: [
            {writerID: receiverID},
            {targetID: senderID}
        ]
    }});

    if(!caption){
        console.log("[declineRequest Route] The request or user doesn't exist anymore");
        return res.status(403).send({
            status: "failure",
            message: "The user or the request doesn't exist anymore"
        });
    }else{
        caption.status = -1;
        await caption.save();

        return res.status(200).send({
            status: "success",
            message: "The request was declined successfully"
        })
    }
  }catch(err){
    console.log("[declineRequest Route] There was an error: ", err);
    return res.status(400).send({
      status: "failure",
      message: "There was an error, Please try after some time",
      error: err
    });
  }
};

module.exports = { allRequests, nominateUser, declineRequest, sendRequest };
