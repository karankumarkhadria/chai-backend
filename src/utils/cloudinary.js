import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
      const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary",response.url);
        // console.log("file is uploaded on cloudinary",response);
        //below is the result of this

//         file is uploaded on cloudinary {
//   asset_id: 'a5d497fcf5a5f8ce054280dcdfbb7f07',
//   public_id: 'zqhosfcodht7avytrxde',
//   version: 1750245012,
//   version_id: 'd1bd25dd0b0e726c20220d32d16dffaa',
//   signature: 'ec5c602f6bcfcd1e8a2ff78691bb9924f94d78d9',      
//   width: 1258,
//   height: 2620,
//   format: 'jpg',
//   resource_type: 'image',
//   created_at: '2025-06-18T11:10:12Z',
//   tags: [],
//   bytes: 474374,
//   type: 'upload',
//   etag: '7c760d0cd5dff43643a18c5876326518',
//   placeholder: false,
//   url: 'http://res.cloudinary.com/do6bdzsj9/image/upload/v1750245012/zqhosfcodht7avytrxde.jpg',
//   secure_url: 'https://res.cloudinary.com/do6bdzsj9/image/upload/v1750245012/zqhosfcodht7avytrxde.jpg',
//   asset_folder: '',
//   display_name: 'zqhosfcodht7avytrxde',
//   original_filename: 'monkey_d_luffy',
//   api_key: '325398989149446'
// }


        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        //abb agar file cloudinary par upload nhi hoti to atleast ham iss file ko apne local server se to hataye varna bahhot saari corrupted files server pe bhar jaegi
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary}


 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });