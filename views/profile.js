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
      });

      // Creating a JWT token for the created user:

      const token = jwt.sign({ 
        id: user.userID, 
        bitsID: user.bitsId, 
        email: user.email, 
        branchCode: user.branchCode 
      },
        process.env.TOKEN_KEY,
        { 
          expiresIn: "180d" 
        }
      );

      // Dev Testing: 

      console.log("The user is created: ", user.toJSON());
      console.log("The JWT token is: ", token);

      return res.send({
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
    // const userID = req.user.id;
    const userID = req.body.id; // for POSTMAN testing
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
        Model: Caption,
        as: 'captions',
        include: [{
          Model: User,
          as: 'writer'
        }]
      }]
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
      attributes: ['user_id', 'name', 'bitsId'],
      where: {
        userID: {
          [Op.not]: req.body.id // req.user.id for production and req.body.id for testing
        },
        name: {
          [Op.like]: search_value
        }
      }
    })

    console.log("These are the results: ", results.toJSON());

    return res.status(200).send(results.toJSON());

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

    // const writerId = req.user.id;
    const writerId = req.body.id;
    
    const targetId = req.params.id;
    
    if (writerId == targetId) {
      return res.send({
        status: "failure",
        msg: "You can't write for yourself",
      });
    }

    const filter = new Filter({ placeHolder: "x" });
    filter.addWords(...words);
    caption = filter.clean(caption);

    const writer = await User.findByPk(writerId);

    // Creating a temporary array to copy the ID's from Nominated JSON Array, and checking if Writer is Nominated.
    let temp = [];
    writer.nominatedby.forEach((x) => temp.push(x.user.user_id));

    if (!temp.includes(targetId)) {
      return res.status(403).send({
        error: "You're not nominated to write the caption!",
      });
    }

    if (caption === "") {
      return res.status(500).send({
        error: "Please enter a valid caption!",
      });
    } else {
      
      const writer = await User.findByPk(writerId);
      const receiver = await User.findByPk(targetId);

      const captions = receiver.captions;

      //checking if a caption has already been written or not, then we'll update otherwise push a new one

      // Case where the caption already exists, and we have to replace it:
      if (captions.find((o) => o.user.user_id == writer.user_id)) {
        for (let i = 0; i < captions.length; i++) {
          if (captions[i].user.user_id == writer.user_id) {
            captions[i].caption = caption;
            // If user.update command below doesn't work, alternatively we might have to do this:
            //await receiver.save({transaction: session});
          }
        }
        
        // Passing the created captions object as the new entry.
        receiver.set('captions', captions);
        receiver.changed('captions', true);
        await receiver.save();

        return res.send({ success: "Succesfully Updated" });

      } else {

        // Case where the caption did not exist and we have to push a new element into the captions array
        receiver.captions.push({"user": writer, "caption": caption});
        receiver.set('captions', receiver.captions);
        receiver.changed('captions', true);
        await receiver.save();

        console.log("succesfully added the caption", receiver.captions)
        return res.send({success: "Succesfully Added"});
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

// module.exports = {
//   editProfile,
//   writeCaption,
//   addProfile,
//   searchUsers,
//   getProfile,
//   deleteProfile,
// };

module.exports = {addProfile, editProfile}
