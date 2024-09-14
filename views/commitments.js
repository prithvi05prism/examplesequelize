const { Commitment } = require("../models/commitment");
const { User } = require("../models/user");
const { Op } = require("sequelize");
const { postgresClient } = require("../db/postgres");
const Filter = require("bad-words");
const words = require("../bad-words.json");
const { request } = require("express");


const allCommitments = async (req, res) => {
    try {
        const commitments = await Commitment.findAll({
            attributes: ['commitment_id', 'commitment_name'],
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

        user.set('commitments', commitments);
        user.changed('commitments', true);
        await user.save();

        res.status(200).send({
            status: "success",
            message: "commitments for the user have been updated."
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

    const required_users = [];

    try {
        const users = await User.findAll();
        console.log("These are quite literall all the users: ", users);
        for (const user of users){
            for(const commitment of user.commitments){
                if(commitment.commitment_id == commitment_id){
                    required_users.push(user);
                }
            }
        }

        console.log("users is: ", required_users);

        return res.status(200).json(required_users);

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

    const check = await Commitment.findOne({ where: { commitment_name: commitment } });

    if (check) {
        console.log(check);
        res.status(400).send({
            message: "Commitment already exists"
        })
    } else {
        const newCommitment = await Commitment.create({
            commitment_name: commitment,
            commitment_imageUrl: imgUrl
        })

        res.status(500).send({
            status: "success",
            commitment: newCommitment
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
            commitment.set('commitment_name', commitment.commitment_name);
            commitment.changed('commitment_name', true);
            await commitment.save();
        }

        if (updated_imgUrl) {
            commitment.commitment_imageUrl = updated_imgUrl;
            commitment.set('commitment_imageUrl', commitment.commitment_imageUrl);
            commitment.changed('commitment_name', true);
            await commitment.save();
        }

        console.log(commitment);
        res.status(500).send({
            status: "success",
            message: "successfully updated commitment",
            commitment
        })
    } catch (err) {
        console.log("This is editCommitmment Route: ", err);
        res.status(400).send({
            status: "failure",
            message: "some error occurred",
            err
        })
    }
}

const deleteCommitment = async (req, res) => {
    try {
        const commitment = await Commitment.findOne({ where: { commitment_name: req.body.name } });

        if (commitment) {
            const users = await User.findAll();

            if (users) {
                for (user of users) {
                    user.commitments = user.commitments.filter(value => value.commitment_id != commitment.commitment_id)
                    user.set('commitments', user.commitments);
                    user.changed('commitments', true);
                    await user.save();
                }
            }

            await Commitment.destroy({ where: { commitment_name: req.body.name } });

            res.status(500).send({
                status: "success",
                message: "Deleted the commitment succesfully"
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
