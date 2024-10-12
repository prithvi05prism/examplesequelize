const {Sequelize} = require("sequelize");

const postgresClient = new Sequelize('database_name', 'postgres', 'postgres', {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
});

module.exports = {postgresClient};