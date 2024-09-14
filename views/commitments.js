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

const allCommitments = async (req, res) => {
    try {
        const commitments = await Commitment.findAll({
            attributes: ['commitmentID', 'commitment_name'],
        })
        return res.status(200).json(commitments);
    } catch (error) {
        console.log("[allCommitments Route] Error has occurred: ", error);
        return res.status(500).send({
            status: "failure",
            msg: "[allCommitments Route] An error occurred"
        })
    }
}

const updateUserCommitments = async (req, res) => {
    try {
        // const userid = req.user.id;
        const userid = req.body.id;
        const user = await User.findByPk(userid);

        if (!user) {
            console.log("[updateUserCommitments Route] User not found.");
            return res.status(400).send({
                status: "failure",
                message: "[updateUserCommitments Route] User not found"
            })
        }

        const commitments = req.body.commitments;
        if (!commitments) {
            console.log("[updateUserCommitments Route] Commitments body data is empty");
            return res.status(400).send({
                status: "failure",
                message: "[updateUserCommitments Route] Commitments data missing in the request body"
            })
        }

        for(const commitmentID of commitments){
            let commitment = await Commitment.findByPk(commitmentID); 
            await user.addCommitment(commitment);
        }

        const updated_user = await User.findByPk(userid, {
            include:{
                model: Commitment,
                as: 'commitments'
            }
        });

        console.log("User commitments have been updated: ", updated_user)
        res.status(200).send({
            status: "success",
            message: "commitments for the user have been updated.",
            user: updated_user
        })

    } catch (error) {
        console.log("[updateUserCommitments Route] An error has occurred: ", error);
        return res.status(500).send({
            status: "failure",
            msg: "[updateUserCommitments Route] An error has occurred"
        })
    }
}

const searchByCommitment = async (req, res) => {
    const commitment_id = req.params.id;
    console.log("this is the commitment_id: ", commitment_id);

    try {
        const commitment = await Commitment.findByPk(commitment_id, {
            include:{
                model: User,
                as: 'members'
            }
        });

        const members = commitment.members;
        console.log("The members are: ", members);
        return res.status(200).json({ members });

    } catch (err) {
        console.log("[searchByCommitment Route] An error occurred: ", err);
        res.status(500).send({
            status: "failure",
            msg: "Some error occurred",
            error: err
        })
    }
}

const addCommitment = async (req, res) => {
    const commitment = req.body.name;
    const imgUrl = req.body.imgUrl;

    try{
        const check = await Commitment.findOne({ where: { commitment_name: commitment } });

        if (check){
            console.log("The commitment already exists: ", check);
            return res.status(400).send({
                message: "Commitment already exists"
            })
        } else {
            const newCommitment = await Commitment.create({
                commitment_name: commitment,
                commitment_imageUrl: imgUrl
            })

            return res.status(200).send({
                status: "success",
                commitment: newCommitment
            })
        }
    }catch(err){
        console.log("[addCommitment Route] There was an error: ", err);
        return res.status(400).send({
            status: "success",
            message: "There was an error, please try after sometime",
            error: err
        })
    }

}

const editCommitment = async (req, res) => {
    const commitment_name = req.body.name;
    const commitment = await Commitment.findOne({
        where: {
            commitment_name
        }
    });

    const updated_name = req.body.updated_name;
    const updated_imgUrl = req.body.updated_imgUrl;

    console.log("updated_name: ", updated_name, ", updated_imgUrl: ", updated_imgUrl);

    try {
        if (updated_name) {
            commitment.commitment_name = updated_name;
        }

        if (updated_imgUrl) {
            commitment.commitment_imageUrl = updated_imgUrl;
        }

        await commitment.save();
        await commitment.reload();

        console.log("The updated commitment is: ", commitment);

        res.status(500).send({
            status: "success",
            message: "successfully updated commitment",
            commitment: commitment
        })
    } catch (err) {
        console.log("[editCommitment Route] There was an error: ", err);
        res.status(400).send({
            status: "failure",
            message: "some error occurred",
            error: err
        });
    }
}

const deleteCommitment = async (req, res) => {
    try {
        const commitmentID = req.params.id;
        const commitment = await Commitment.findByPk(commitmentID);

        if(commitment){
            await Commitment.destroy({where: {commitmentID: commitmentID}});
            console.log("The commitment was successfully deleted");
            return res.status(200).send({
                status: "success",
                message: "Commitment deleted"
            })
        } else {
            console.log("The commitment doesn't exist");
            res.status(400).send({
                status: "failure",
                message: "commitment doesn't exist"
            })
        }

    } catch (err) {
        console.log("This is deleteCommitment Route: ", err);
        res.status(400).send({
            status: "failure",
            message: "An error occured in deleting",
            error: err
        })
    }
}



module.exports = { allCommitments, updateUserCommitments, searchByCommitment, addCommitment, editCommitment, deleteCommitment };
