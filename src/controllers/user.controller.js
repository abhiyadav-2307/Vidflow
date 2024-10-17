import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation of input data - not empty and all that
  //check if user already exists: check username or enail
  //check for images, and avatar
  //upload them to cloudinary and check for successful upload
  //create user object - create entry in db
  //remove passwword and refresh token field from response
  //check for user creation
  //return response

  //get user details from frontend
  const { fullname, email, username, password } = req.body;
  console.log("email: ", email);

  //validation of input data - not empty and all that
  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //check if user already exists?
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiError(409, "This usernaame or email already exists");
  }

  //check for images, and avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
      coverImageLocalPath = req.files.coverImage[0].path;
  }
  


  //upload them to cloudinary and check for successful upload
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object - create entry in db
  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });

  //check for user creation
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "something went wrong while registering user");
  }

  return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
  )
  
});

export { registerUser };
