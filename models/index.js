const { Caption } = require('./caption');
const { Commitment } = require('./commitment');
const { Nomination } = require('./nomination');
const { Poll } = require('./poll');
const associateModels = require('./relations');
const { User } = require('./user');
const { Vote } = require('./vote');

const associatedModels = associateModels(User, Commitment, Poll, Vote, Nomination, Caption);

module.exports = associatedModels;