const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require('dotenv').config({ path: './testing.env'})

const {Sequelize} = require("sequelize");
const {postgresClient} = require("./db/postgres");
const associatedModels = require('./models/index');
const {alterSync, forceSync} = require('./db/sync');

const app = express();
const port = process.env.PORT || 3001;

// Setting Up Database and Models: 

try{
  postgresClient.authenticate();
  console.log("Connection has been established succesfully");
}catch(err){
    console.log("Unable to connect to the database", err);
}

try{
  forceSync(postgresClient);
  console.log("Models have been synced succesfully");
}catch(error){
  console.log("An error occurred while trying to sync models: ", error);
}


// CORS

app.use(cors());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// BODY PARSER

app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// LISTEN

app.listen(port, () => console.log("Listening at port " + port));

// ROUTES
// const nominationRoutes = require("./routes/nominations");
// const pollRoutes = require("./routes/polls");
// const profileRoutes = require("./routes/profile");
// const commitmentRoutes = require("./routes/commitments")

// app.use("/polls", pollRoutes);
// app.use("/nominations", nominationRoutes);
// app.use("/profiles", profileRoutes);
// app.use("/commitments", commitmentRoutes);

app.get("/test", async (req, res) => {
  return res.json({ "Message": "endpoint is working fine." });
});
