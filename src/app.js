const express=require("express");
const helmet=require("helmet");
const cookieParser=require("cookie-parser");
const mongoose=require("mongoose");
const {rateLimit}=require("express-rate-limit");
const path=require("node:path");
const env=require("./config/env");
const requireAuth=require("./middleware/requireAuth");
const imageController=require("./controllers/imageController");
const app=express();
app.disable("x-powered-by");
if(env.TRUST_PROXY>0)app.set("trust proxy",env.TRUST_PROXY);
app.use(helmet({contentSecurityPolicy:{directives:{
defaultSrc:["'self'"],scriptSrc:["'self'"],styleSrc:["'self'","'unsafe-inline'","https://fonts.googleapis.com"],
fontSrc:["'self'","https://fonts.gstatic.com"],imgSrc:["'self'","data:","https://res.cloudinary.com","https://images.unsplash.com"],
connectSrc:["'self'"],objectSrc:["'none'"],baseUri:["'self'"],formAction:["'self'"],frameAncestors:["'none'"]
}}}));
app.use("/api",(req,res,next)=>{
if(["GET","HEAD","OPTIONS"].includes(req.method))return next();
const origin=req.get("origin"),expected=env.APP_ORIGIN||(req.protocol+"://"+req.get("host"));
if(!origin||origin!==expected)return res.status(403).json({success:false,message:"Request origin is not allowed."});
next();
});
const imageLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many image uploads. Please try again later."}});
app.post("/api/products/image",imageLimiter,requireAuth,express.raw({type:["image/jpeg","image/png","image/webp"],limit:"5mb"}),imageController.upload);
app.use(express.json({limit:"20kb"}));
app.use(express.urlencoded({extended:false,limit:"20kb"}));
app.use(cookieParser());
const apiLimiter=rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many requests. Please try again later."}});
const authLimiter=rateLimit({windowMs:15*60*1000,limit:20,standardHeaders:"draft-8",legacyHeaders:false,message:{success:false,message:"Too many login or registration attempts. Try again later."}});
app.use("/api",apiLimiter);app.use("/api/auth/login",authLimiter);app.use("/api/auth/register",authLimiter);
app.get("/api/health",(_req,res)=>{const ok=mongoose.connection.readyState===1;res.status(ok?200:503).json({success:ok,database:ok?"connected":"disconnected"});});
app.use("/api/auth",require("./routes/authRoutes"));app.use("/api/products",require("./routes/productRoutes"));
app.use(express.static(path.join(__dirname,"..","public")));
app.use("/api",(_req,res)=>res.status(404).json({success:false,message:"API route not found."}));
app.use((_req,res)=>res.status(404).sendFile(path.join(__dirname,"..","public","404.html")));
app.use((err,_req,res,_next)=>{
if(err.code===11000)return res.status(409).json({success:false,message:"A record with these details already exists."});
if(err.name==="ValidationError"||err.name==="CastError")return res.status(400).json({success:false,message:"The submitted data is invalid."});
if(err.type==="entity.parse.failed")return res.status(400).json({success:false,message:"Invalid JSON request body."});
if(err.type==="entity.too.large")return res.status(413).json({success:false,message:"Uploaded content is too large."});
console.error("Request error:",err);res.status(500).json({success:false,message:"An unexpected error occurred."});
});
module.exports=app;