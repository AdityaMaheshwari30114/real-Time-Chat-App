const mongoose = require('mongoose');

async function connectToMongoDB(user){
    return mongoose.connect(user)
    .then (()=>console.log("MongoDB Connected"))
    .catch((error)=> console.log("Mongo Error",error)); 
};
//mongodb://localhost:27017/chatApp

module.exports = {
    connectToMongoDB,
}