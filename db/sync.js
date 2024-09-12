const alterSync = (postgresClient) => {
    postgresClient.sync({alter: true});
}

const forceSync = (postgresClient) => {
    postgresClient.sync({force: true});
}


module.exports = {alterSync, forceSync};