const dotenv=require("dotenv");
const {z}=require("zod");
dotenv.config();
const schema=z.object({
NODE_ENV:z.enum(["development","test","production"]).default("development"),
PORT:z.coerce.number().int().positive().default(3000),
MONGODB_URI:z.string().min(1,"MONGODB_URI is required"),
JWT_SECRET:z.string().min(32,"JWT_SECRET must contain at least 32 characters"),
JWT_EXPIRES_IN:z.string().default("1d"),
APP_ORIGIN:z.string().url().transform(value=>new URL(value).origin).optional(),
TRUST_PROXY:z.coerce.number().int().min(0).default(0),
CLOUDINARY_CLOUD_NAME:z.string().trim().optional(),
CLOUDINARY_API_KEY:z.string().trim().optional(),
CLOUDINARY_API_SECRET:z.string().trim().optional()
});
const parsed=schema.safeParse(process.env);
if(!parsed.success){console.error("Invalid environment configuration:");console.error(parsed.error.flatten().fieldErrors);process.exit(1);}
const cloud=[parsed.data.CLOUDINARY_CLOUD_NAME,parsed.data.CLOUDINARY_API_KEY,parsed.data.CLOUDINARY_API_SECRET];
if(cloud.some(Boolean)&&!cloud.every(Boolean)){console.error("Configure all three Cloudinary variables or leave all empty.");process.exit(1);}
if(parsed.data.NODE_ENV==="production"){
if(!parsed.data.APP_ORIGIN||new URL(parsed.data.APP_ORIGIN).protocol!=="https:"){console.error("Production requires APP_ORIGIN to be a valid HTTPS URL.");process.exit(1);}
if(parsed.data.JWT_SECRET.length<48||/replace-with|change-me|your-secret/i.test(parsed.data.JWT_SECRET)){console.error("Production requires a unique JWT_SECRET of at least 48 characters.");process.exit(1);}
}
module.exports=parsed.data;