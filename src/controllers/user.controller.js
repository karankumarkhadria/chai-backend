import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
const registerUser = asyncHandler(async (req,res) => {

    // get user details from frontend
    // validation - not empty (can check for more)
    // check if user already exist: username , email
    // check for images check for avatar
    // upload them to cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return response

   const {fullname,email,username,password} =  req.body
//    console.log("email: ",email);

// console.log(req.body) ye niche iska result 
// [Object: null prototype] {
//   fullname: 'Monkey D Lufy',
//   email: 'lufy@luffy.com',
//   password: '12345678',
//   username: 'piratking'
// }

   

   if(
    [username,fullname,password,email].some((field) => field?.trim() === "")
   ){
    throw new ApiError(400,"All fields are compulsory")
   }

  const existedUser = await User.findOne({
    $or: [{username} , {email}]
   })

   if(existedUser){
    throw new ApiError(409,"user with email or username already exists")
   }

  const avatarLocalPath = req.files?.avatar[0]?.path;
//   const coverImageLocalPath = req.files?.coverImage[0].path;

let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
}


//    console.log(req.files)
//  i want to see what do i get when i console.log this 
// below is the result of above
// [Object: null prototype] {
//   avatar: [
//     {
//       fieldname: 'avatar',
//       originalname: 'monkey_d_luffy.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'monkey_d_luffy.jpg',
//       path: 'public\\temp\\monkey_d_luffy.jpg',
//       size: 474374
//     }
//   ],
//   coverImage: [
//     {
//       fieldname: 'coverImage',
//       originalname: 'luffy.jpg',
//       encoding: '7bit',
//       mimetype: 'image/jpeg',
//       destination: './public/temp',
//       filename: 'luffy.jpg',
//       path: 'public\\temp\\luffy.jpg',
//       size: 639971
//     }
//   ]
// }


if(!avatarLocalPath) {
    throw new ApiError(400,"Avatar file is required")
}

const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avatar file is required")
}

const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase()
})

const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
)

if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
}

return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered Successfully")
)

})

export {registerUser}