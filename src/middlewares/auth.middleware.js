import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,_,next) => {
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","" )
 
    if(!token){
     throw new ApiError(401,"Unauthorized request")
    }
 
   const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
   const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
   if(!user){
     //TODO: discuss about frontend
     throw new ApiError(401,"invalid access Token")
   }
 
   req.user = user;
   next()
   } catch (error) {
    throw new ApiError(401,error?.message || "invalid access token")
   }

})
//yhan par req.header isliye use kiya hai kyonki ho saka hai ki user mobile app se daal raha ho ya postman se aise Authorization me Bearer <Token> karke daal rha ho