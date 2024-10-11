//using promises
const asyncHandler = (reqHandler) => {
  (req, res, next) => {
    Promise.resolve(reqHandler(req,res,next)).catch((error) => next(error));
  };
};

/*
using try catch

//const asyncHandler=()=>{}
//const asyncHandler=(fn)=>{()=>{}}
//const asyncHandler=(fn)=>()=>{}

const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    res.status(err.code || 5000).json({
      success: false,
      message: err.message,
    });
  }
};*/

export { asyncHandler };
