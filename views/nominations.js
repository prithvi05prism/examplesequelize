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
      console.log("[sendRequest Route] Request has already been sent by" + sender.name + " to " + target.name);
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

    const receiver = await User.findByPk(receiverID);
    const sender = await User.findByPk(senderID);

    const senderName = sender.name;

    if (receiver.nominatedby!==null && receiver.nominatedby.find((obj) => obj.user.user_id == senderId)) {
      return res.send({
        status: "failure",
        msg: "User has already been nominated!",
      });
    }

    if (receiverID == senderID) {
        console.log("[nominateUser Route] You can't nominate yourself !!!");
        return res.status(403).send({
            status: "failure",
            message: "You can't nominate yourself",
        });
    }

    // Handling the cases where request was already sent by the targetUser: 

    if (sender.requests!==null && sender.requests.find((o) => o.user.user_id == receiverId)) {
      const requests = sender.requests;
      let newCap;
      for (let i = 0; i < requests.length; i++) {
        if (requests[i].user.user_id == receiverId) {
          newCap = requests[i].caption;

          const filter = new Filter({ placeHolder: "x" });
          filter.addWords(...words);
          newCap = filter.clean(newCap);

          requests.splice(i, 1);
        }
      }
      try{

        sender.captions.push({"user": receiver, "caption": newCap});
        sender.requests = requests;

        sender.set('captions', sender.captions);
        sender.changed('captions', true);
        sender.set('requests', sender.requests);
        sender.changed('requests', true);
  

        await sender.save();

      }catch(err){
        console.log("[nominateUser Route] Some error occured: ", err);
        return res.status(500).send({
          status: "failure",
          message: "An error occured",
          error: err
        });
      }
    }
    
    
    else if (sender.declined_requests!==null && sender.declined_requests.find((o) => o.user.user_id == receiverId)) {
      const declined_requests = sender.declined_requests;
      let newCap;
      for (let i = 0; i < declined_requests.length; i++) {
        if (declined_requests[i].user === receiverId) {
          newCap = declined_requests[i].caption;

          const filter = new Filter({ placeHolder: "x" });
          filter.addWords(...words);
          newCap = filter.clean(newCap);
          
          declined_requests.splice(i, 1);
        }
      }
      
      sender.captions.push({"user": receiver, "caption": newCap});
      sender.declined_requests = declined_requests;
    
      sender.set('captions', sender.captions);
      sender.changed('captions', true);
      sender.set('declined_requests', sender.declined_requests);
      sender.changed('declined_requests', true);

      await sender.save();

    }

    receiver.nominatedby.push({"user": sender, "name": senderName, "id": senderId});
    receiver.set('nominatedby', receiver.nominatedby);
    receiver.changed('nominatedby', true);
    await receiver.save();

    return res.send({
      status: "success",
      msg: "Friend nominated successfully!",
    });
  } catch (err) {
    return res.send({
      status: "failure",
      msg: err.message,
    });
  }
};

const declineRequest = async (req, res) => {
  try {
    // senderId = req.user.id;
    const senderId = req.body.id;
    const receiverId = req.body.receiverId;

    const sender = await User.findByPk(senderId);

    const requests = sender.requests;
    let newCap;

    for (let i = 0; i < requests.length; i++) {
      if (requests[i].user === receiverId) {
        newCap = requests[i].caption;
        requests.splice(i, 1);
      }
    }
    
    sender.declined_requests.push({"user": receiverId, "caption": newCap});
    sender.requests = requests;

    sender.set('declined_requests', sender.declined_requests);
    sender.set('requests', sender.requests);
  
    sender.changed('requests', true);
    sender.changed('declined_requests', true);

    await sender.save();

    return res.send({
      success: "Succesfully declined",
    });
  } catch (err) {
    throw(err);
    return res.send({
      status: "failure",
      msg: "There was an error, Please try after some time",
    });
  }
};


// module.exports = { allRequests, nominateUser, declineRequest, sendRequest };
module.exports = {sendRequest, allRequests}
