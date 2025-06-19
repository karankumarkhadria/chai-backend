import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "something went wrong while generrating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    // get user details from frontend
    // validation - not empty (can check for more)
    // check if user already exist: username , email
    // check for images check for avatar
    // upload them to cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from response 
    // check for user creation
    // return response

    const { fullname, email, username, password } = req.body
    //    console.log("email: ",email);

    // console.log(req.body) ye niche iska result 
    // [Object: null prototype] {
    //   fullname: 'Monkey D Lufy',
    //   email: 'lufy@luffy.com',
    //   password: '12345678',
    //   username: 'piratking'
    // }



    if (
        [username, fullname, password, email].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are compulsory")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "user with email or username already exists")
    }
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //   const coverImageLocalPath = req.files?.coverImage[0].path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
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


    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
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

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {

    //req body -> data
    //username or email
    //find the user 
    //password check
    //access toke and refresh token
    //send cookies
    //send response

    const { email, username, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "username or email is required")
    } //user can give either email or username

    const user = await User.findOne({
        $or: [{ username }, { email }]
    }); // ye to user username ke basis pe miljaye ya email ke base pe mil jaye

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "invalid user credentials")
    }

   const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

 const options = {
    httpOnly: true,
    secure: true
 }

 return res
 .status(200)
 .cookie("accessToken", accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser,accessToken,refreshToken
        },
        "User logged In Successfully"
    )
 )
})

const logoutUser = asyncHandler(async(req,res) => {
   await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )

    const options = {
        httpOnly:true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandler(async (req,res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
   const user = await User.findById(decodedToken?._id)
  
   if(!user){
      throw new ApiError(401,"invalid refresh token")
   }
  
   if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(402,"Refresh token is expired or used")
   }
  
  const {accessToken,newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
  
   const options = {
      httpOnly: true,
      secure: true
   }
  
   return res
   .status(200)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",newrefreshToken,options)
   .json(
      new ApiResponse(
          200,
          {accessToken,refreshToken: newrefreshToken},
          "access token refreshed"
      )
   )
  } catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
  }


})



export { registerUser, loginUser ,logoutUser,refreshAccessToken}