const express = require("express");
const router = express.Router();

const {getUser} = require('../service/auth');

const {handleUserSignup,handleUserLogin} = require("../controllers/user");

router.post("/", handleUserSignup);
router.post("/login", handleUserLogin);
router.get("/me", (req, res) => {
    const userUid = req.cookies?.uid;
    const user = getUser(userUid);
    
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    res.json(user);
});


module.exports = router;