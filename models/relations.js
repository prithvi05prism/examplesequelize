const associateModels = async (User, Commitment, Poll, Vote, Nomination, Caption) => {

    // Commitments - Users Associations
    // User has MANY commitments and a Commitment have MANY users

    User.belongsToMany(Commitment, {
        foreignKey: 'userID',
        as: 'commitments',
        through: 'ymemberlist'
    });

    Commitment.belongsToMany(User, {
        foreignKey: 'commitmentID',
        as: 'members',
        through: 'ymemberlist'
    });

    // Users - Captions Associations
    // User has MANY captions and a Caption has ONE writer and ONE target

    User.hasMany(Caption, {
        foreignKey: 'writerID',
        as: 'written_captions'
    });

    User.hasMany(Caption, {
        foreignKey: 'targetID',
        as: 'captions'
    });

    Caption.belongsTo(User, {
        foreignKey: 'writerID',
        as: 'writer'
    });
    
    Caption.belongsTo(User, {
        foreignKey: 'targetID',
        as: 'target'
    });

    // Users - Nominations Associations
    // User has MANY Nominations and a Nomination has ONE nominator and ONE target

    User.hasMany(Nomination, {
        foreignKey: 'nominatorID',
        as: 'nominatedpeople'
    });

    User.hasMany(Nomination, {
        foreignKey: 'targetID',
        as: 'nominatedby'
    });

    Nomination.belongsTo(User, {
        foreignKey: 'nominatorID',
        as: 'nominator'
    });
    
    Nomination.belongsTo(User, {
        foreignKey: 'targetID',
        as: 'target'
    });

    // Users - Votes, Polls - Votes, Polls - Commitments Associations
    // User has MANY Votes and a Vote has ONE voter and ONE target
    // Poll has MANY Votes and a Vote has ONE poll
    // Poll has ONE Commitment and a Commitment has MANY polls

    User.hasMany(Vote, {
        foreignKey: 'voterID',
        as: 'voted'
    });

    User.hasMany(Vote, {
        foreignKey: 'targetID',
        as: 'votes'
    });

    Vote.belongsTo(User, {
        foreignKey: 'voterID',
        as: 'voter'
    });
    
    Vote.belongsTo(User, {
        foreignKey: 'targetID',
        as: 'target'
    });

    Poll.hasMany(Vote, {
        foreignKey: 'pollID',
        as: 'allvotes'
    });

    Vote.belongsTo(Poll, {
        foreignKey: 'pollID',
        as: 'parentpoll'
    });

    Commitment.hasMany(Poll, {
        foreignKey: 'commitmentID',
        as: 'commitmentpolls'
    });

    Poll.belongsTo(Commitment, {
        foreignKey: 'commitmentID',
        as: 'parentcommitment'
    });

    const associatedModels = {User, Commitment, Poll, Vote, Nomination, Caption};

    return associatedModels;
};

module.exports = associateModels;