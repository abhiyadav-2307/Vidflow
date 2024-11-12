import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userID) => {
  try {
    const user = await User.findById(userID);
    const accessToken = user.generateAccessToken();
    const refresToken = user.generateRefreshToken();
    user.refresToken = refresToken;

    await user.save({ validateBeforeSave: false });
    return { accessToken, refresToken };
  } catch (error) {
    throw new ApiError(500, "Tocken generation failed");
  }
};

//register user->
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
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  //upload them to cloudinary and check for successful upload
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(502, "Failed to upload avatar to Cloudinary");
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

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//login user->
const loginUser = asyncHandler(async (req, res) => {
  //get data from req.body
  //username or email
  //find the user based on username or email
  //check password
  //generate access and refresh token
  //send tokens in cookies
  //send response

  // Get data from req.body
  const { email, username, password } = req.body;

  // Check if either username or email is provided
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  // Find the user based on username or email
  const user = await User.findOne({
    $or: [{ email }, { username }],
  }).select("-password -refreshToken");

  // Check if user exists
  if (!user) {
    throw new ApiError(400, "This username or email is not registered");
  }

  // Check if both username and email are provided, and they must match
  if (username && email) {
    if (user.username !== username || user.email !== email) {
      throw new ApiError(400, "Username and email do not match");
    }
  }

  //check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  //generate access and refresh token
  const { accessToken, refresToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  //send tokens in cookies
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refresToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
          refresToken,
        },
        "User logged In successfully!"
      )
    );
});

//logout user->
const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully."));
});

export { registerUser, loginUser, logoutUser };
