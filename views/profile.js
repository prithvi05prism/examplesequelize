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

const addProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (user) {
      console.log("User already exists: ", user.toJSON());
      return res.status(400).send({
        status: "failure",
        message: "User Exists Already",
      });
    } else {

      // Formatting the BITS ID and extracting branches:

      const bitsId = req.body.id;

      const stringyear = bitsId.substring(0,4);
      const year = Number(stringyear);

      let senior = false;

      if(year<=2021){
        senior = true;
      }
      console.log("[addProfile Route] This was the year: ", year);
      console.log("[addProfile Route] This is the senior status: ", senior);

      let branchCode = bitsId.substring(4, bitsId.length - 4);

      if (branchCode.includes("B")) {
        branchCode = [branchCode.substring(0, 2), branchCode.substring(2, 4)];
      } else if ((branchCode[0] = "A")) {
        branchCode = [branchCode.substring(0, 2)];
      } else {
        branchCode = [branchCode];
      }

      // Quote Filtering:

      var quote = req.body.quote;
      const filter = new Filter({ placeHolder: "x" });
      filter.addWords(...words);
      quote = filter.clean(quote);

      // Creating the user:

      const user = await User.create({
        name: `${req.body.firstName} ${req.body.lastName}`,
        email: req.body.email,
        bitsId: bitsId,
        personalEmail: req.body.pEmail,
        phone: req.body.phone,
        quote: quote,
        branchCode: branchCode,
        imageUrl: req.body.imgUrl,
        senior: senior
      });

      // Creating a JWT token for the created user:

      const token = jwt.sign({ 
        id: user.userID, 
        bitsID: user.bitsId, 
        email: user.email, 
        branchCode: user.branchCode,
        senior: senior
      },
        process.env.TOKEN_KEY,
        { 
          expiresIn: "180d" 
        }
      );

      // Dev Testing: 

      console.log("The user is created: ", user.toJSON());
      console.log("The JWT token is: ", token);

      // adding Commitments for the user: 

      const commitments = req.body.commitments;
      if (!commitments) {
          console.log("[addProfile Route] Commitments body data is empty");
      }else{
        await user.setCommitments([]);
        for(const returncommitment of commitments){
          let commitmentID = returncommitment.commitmentID;
          let commitment = await Commitment.findByPk(commitmentID); 
          await user.addCommitment(commitment);
        }

        const updated_user = await User.findByPk(user.userID, {
          include:{
              model: Commitment,
              as: 'commitments'
          }
        });

        console.log("User commitments have been updated: ", updated_user)
      }

      return res.status(200).send({
        message: "Profile created",
        id: user.userID,
        token: token,
      });
    }
  } catch (err) {
    console.log("[addProfile Route] There was an error: ", err);
    return res.status(500).send({
      status: "failure",
      msg: "There was an error, Please try after some time",
      error: err
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const userID = req.user.id;
    // const userID = req.body.id; // for POSTMAN testing
    const user = await User.findByPk(userID);

    if(!user){
      console.log("[editProfile Route] User not found");
      return res.status(400).send({
        status: "failure",
        message: "User not found"
      })
    }
  
    const imgUrl = req.body.imgUrl;
  
    if (imgUrl != "") {
      user.imageUrl = imgUrl;
    }
    
    var quote = req.body.quote;
    const filter = new Filter({ placeHolder: "x" });
    filter.addWords(...words);
    quote = filter.clean(quote);
    
    if (quote != "") {
      user.quote = quote;
    }
  
    await user.save();

    // editing Commitments for the user: 
      
    const commitments = req.body.commitments;
    if (!commitments) {
        console.log("[editProfile Route] Commitments body data is empty");
    }else{
      await user.setCommitments([]);
      for(const returncommitment of commitments){
        let commitmentID = returncommitment.commitmentID;
        let commitment = await Commitment.findByPk(commitmentID); 
        await user.addCommitment(commitment);
      }

      const updated_user = await User.findByPk(user.userID, {
        include:{
            model: Commitment,
            as: 'commitments'
        }
      });

      console.log("User commitments have been updated: ", updated_user)
    }
  
    console.log("User updated succesfully, user: ", user);
    return res.status(200).send({
      status: "success",
      message: "Successfully Updated",
      user: user.toJSON()
    });

  }catch (error) {
    console.log("[editProfile Route] An error has occurred: ", error);
    return res.status(400).send({
      status: "failure",
      message: "[editProfile Route] There was an error, Please try after some time",
      error: error
    });
  };
};

const getProfile = async (req, res) => {
  try {
    const userID = req.params.id
    const user = await User.findByPk(userID, {
      include: [{
        required: false,
        model: Caption,
        as: 'captions',
        where: {
          status: 1,
        },
        include: [{
          model: User,
          as: 'writer'
        }
        ]},
        {
          required: false,
          model: Nomination,
          as: 'nominatedby',
          where: {
            status: 1
          },
          include: [{
            model: User,
            as: 'nominator'
          }]
        },
        {
          model: Commitment,
          as: 'commitments'
        }
      ]
    });

    if (!user) {
      console.log("[getProfile Route] The user doesn't exist");
      return res.status(400).send({
        status: "failure",
        message: "User does not exist"
      });
    }

    console.log("This is the user: ", user.toJSON());

    return res.status(200).send(user.toJSON());
  } catch (err) {
    console.log("There was an error", err);
    return res.send({
      status: "failure",
      msg: "There was an error, Please try after some time",
    });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userID = req.params.id;

    await User.destroy({where: { userID: userID }});

    console.log("Delete Execution Succesful: Profile has been Deleted");

    return res.status(200).send({
      status: "success",
      message: "Profile deleted"
    });

  } catch(err){
    console.log("[deleteProfile Route] There was an error: ", err);
    return res.status(500).send({
      status: "failure",
      message: "There was an error, Please try after some time",
      error: err
    });
  }
};

const searchUsers = async (req, res) => {
  try{
    const search_term = req.query.name;

    if(!search_term){
      res.status(400).send({ message: "search term is required"});
    }

    const search_value = `%${search_term}%`;

    let results = await User.findAll({
      attributes: ['userID', 'name', 'bitsId'],
      where: {
        userID: {
          [Op.not]: req.user.id // req.user.id for production and req.body.id for testing
        },
        [Op.or]: [
          {
            name: {
              [Op.like]: search_value
            }
          },
          {
            bitsId: {
              [Op.like]: search_value
            }
          }
        ]
      }
    })

    console.log("These are the results: ", JSON.stringify(results));

    return res.status(200).send(results);

  }catch(e){
    console.log("[searchUsers Route] There was an error: ", e);
    res.status(500).send({ 
      status: "failure",
      message: "There was an error",
      error: e 
    });
  }
};

const writeCaption = async (req, res) => {
  try {
    var caption = req.body.caption;
    const writerID = req.user.id;
    // const writerID = req.body.id;
    const targetID = req.params.id;
    
    if (writerID == targetID) {
      return res.status(403).send({
        status: "failure",
        message: "You can't write for yourself",
      });
    };

    const filter = new Filter({ placeHolder: "x" });
    filter.addWords(...words);
    caption = filter.clean(caption);

    const nomination = await Nomination.findOne({where: {
      [Op.and]: [
        {targetID: writerID},
        {nominatorID: targetID}
      ]
    }});

    if (!nomination){
      console.log("[writeCaption Route] User not nominated to write for target");
      return res.status(403).send({
        status: "failure",
        message: "You're not nominated to write the caption!"
      });
    };

    if (caption === "") {
      return res.status(500).send({
        error: "Please enter a valid caption!",
      });
    }else{
    
      const receiver = await User.findByPk(targetID);

      if(!receiver){
        console.log("The target doesn't exist");
        return res.status(403).send({
          status: "failure",
          message: "The target user doesn't exist"
        })
      };

      const oldcaption = await Caption.findOne({where: {
        [Op.and]:[
          {writerID: writerID},
          {targetID: targetID}
        ]
      }});

      if(oldcaption){
        oldcaption.caption = caption;
        await oldcaption.save();

        const newcaption = await Caption.findOne({where: {
          [Op.and]:[
            {writerID: writerID},
            {targetID: targetID}
          ]
        }}, 
        {
          include: [
            {
            Model: User,
            as: 'writer'
            },
            {
              Model: User,
              as: 'target'
            }
          ]
        });

        console.log("The caption was updated: ", newcaption);

        return res.status(200).send({
          status: "success",
          message: "Caption was updated succesfully",
          caption: newcaption
        });

      }else {
        const newcaption = await Caption.create({
          writerID: writerID,
          targetID: targetID,
          caption: caption,
          status: 1
        });

        nomination.status = 1;
        await nomination.save();

        console.log("The caption was created: ", newcaption);
        console.log("The nomination now is: ", nomination);

        return res.status(200).send({
          status: "success",
          message: "Caption was created successfully",
          caption: newcaption
        })
      }
    }
  } catch (err) {
    console.log("[writeCaption Route] There was an error: ", err);
    return res.send({
      status: "failure",
      msg: "There was an error, Please try after some time",
      error: err
    });
  }
};


module.exports = {
  editProfile,
  writeCaption,
  addProfile,
  searchUsers,
  getProfile,
  deleteProfile,
};