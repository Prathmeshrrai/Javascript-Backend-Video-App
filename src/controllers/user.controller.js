import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" 
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req, res)=>{
    const {fullName,email,username,password} = req.body
    console.log("email: " , email);

    // if(fullName===""){
    //     throw new ApiError(400, "fullname is required")
    // }


    //arrow function { } not used because we will have to return it explicitely
    //can be done with map too
    //string method which can check if the is a @ in the string--validation file 
    if(
        [fullName,email, username, password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with Username or email already exists")
    }

//multer gives files from middleware previosly it was body by express. The field has many properties file, png,jpg
    const avatarLocalPath = req.files?.avatar[0]?.path;
    //0 i.e. first property gives a object, multer takes the files when submitted to his server and then gives the original name
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }

    const user= await User.create({
        fullName,
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
        throw new ApiError(500, "Something went wrong while registering user")
    }
// json({createdUser})
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} )

// res.status(200).json({
//     message:"ok"
// })

export {registerUser}