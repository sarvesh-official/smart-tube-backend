import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name : {type : String, required: true},
    email : {type : String, required: true, unique : true},
    image: {type : String, required : true},
    createdAt : {type : Date, default : Date.now()},
    updatedAt : {type : Date, default : Date.now()}
})

const User = mongoose.model("user", userSchema);

export default User;