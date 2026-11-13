const crypto=require("node:crypto");
const env=require("../config/env");
const types=[
["image/jpeg","jpg",b=>b.length>=3&&b[0]===255&&b[1]===216&&b[2]===255],
["image/png","png",b=>b.length>=8&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))],
["image/webp","webp",b=>b.length>=12&&b.toString("ascii",0,4)==="RIFF"&&b.toString("ascii",8,12)==="WEBP"]
];
exports.upload=async(req,res)=>{
res.set("Cache-Control","no-store");
if(!env.CLOUDINARY_CLOUD_NAME||!env.CLOUDINARY_API_KEY||!env.CLOUDINARY_API_SECRET)return res.status(503).json({success:false,message:"Image uploads are not configured yet."});
const file=req.body;
if(!Buffer.isBuffer(file)||!file.length)return res.status(400).json({success:false,message:"Choose an image to upload."});
if(file.length>5*1024*1024)return res.status(413).json({success:false,message:"Image must be 5 MB or smaller."});
const type=types.find(([, ,check])=>check(file));
if(!type)return res.status(415).json({success:false,message:"Only valid JPG, PNG, and WebP images are supported."});
const timestamp=Math.floor(Date.now()/1000),publicId="listing-"+crypto.randomUUID();
const signature=crypto.createHash("sha1").update("public_id="+publicId+"&timestamp="+timestamp+env.CLOUDINARY_API_SECRET).digest("hex");
const form=new FormData();
form.append("file",new Blob([file],{type:type[0]}),publicId+"."+type[1]);
form.append("api_key",env.CLOUDINARY_API_KEY);form.append("timestamp",String(timestamp));form.append("public_id",publicId);form.append("signature",signature);
let response;
try{response=await fetch("https://api.cloudinary.com/v1_1/"+encodeURIComponent(env.CLOUDINARY_CLOUD_NAME)+"/image/upload",{method:"POST",body:form,signal:AbortSignal.timeout(20000)});}
catch{return res.status(502).json({success:false,message:"Image service is temporarily unavailable."});}
const result=await response.json().catch(()=>({}));
if(!response.ok||typeof result.secure_url!=="string"||!result.secure_url.startsWith("https://res.cloudinary.com/")){
console.error("Cloudinary upload failed:",result.error?.message||response.status);
return res.status(502).json({success:false,message:"Could not upload this image. Please try again."});}
res.status(201).json({success:true,imageUrl:result.secure_url});
};