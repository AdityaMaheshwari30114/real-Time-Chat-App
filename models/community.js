const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },

    description: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,

    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }],
}, { timestamps: true });

const Community = mongoose.model("community", communitySchema);

module.exports = Community;