require("dotenv").config();
const mongodb = process.env.mongodbURL;
const mongoose = require("mongoose");
module.exports = async (client) => {
        if (!mongodb) return;
        try {
            await mongoose.connect(mongodb);
        if (mongoose.connect) {
            console.log("DataBase Connected Successfully!!");
        }
            
        } catch (error) {
            console.log(error);
        }
    }