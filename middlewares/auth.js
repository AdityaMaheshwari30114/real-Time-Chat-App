//middleware function
const {getUser} = require("../service/auth");
async function restrictToLoggedInUsersOnly(req, res, next) {
    const userUid = req.cookies.uid;       // name uid used in auth .js service
    console.log("Middleware Hit. UID:", userUid);
    if(!userUid){
        console.log("No cookie found.");
        return res.redirect("/login");}  // No uid found
    const user = getUser(userUid);
    if(!user){ 
        console.log("No session found.");
        return res.redirect("/login")};     // No user found with uid
    req.user = user;
    next();
}

async function checkAuth(req, res, next) {  //similar to above fn without conditions
    const userUid = req.cookies.uid;
    const user = getUser(userUid);       
    req.user = user;
    next();
}
module.exports = {
    restrictToLoggedInUsersOnly,
    checkAuth,
}
