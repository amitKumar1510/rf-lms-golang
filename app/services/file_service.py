import os
import shutil
from app.core.utils_functions import generate_doc_id
UPLOAD_BASE = "uploads"

class FileUploadService:

    def __init__(self, id: str):
        self.id = id   # it might be school_id

    def create_folder(self, folder_name: str):

        path = os.path.join(UPLOAD_BASE, self.id, folder_name)
        os.makedirs(path, exist_ok=True)

        return path

    def delete_file(self, file_path: str) -> bool:
        """
        Deletes a single file safely.
        Returns True if deleted or file doesn't exist.
        """
        try:
            # File exists?
            if file_path and os.path.isfile(file_path):
                os.remove(file_path)
                return True

            # File does not exist — treat as "successful delete"
            return True

        except Exception as e:
            print(f"[ERROR] Failed to delete file: {file_path}. Error: {e}")
            return False
    
    def delete_folder(self, folder_path: str) -> bool:
        """
        Deletes the entire folder safely.
        Returns True if deleted or folder doesn't exist.
        """
        try:
            # Folder exists?
            if folder_path and os.path.exists(folder_path):
                shutil.rmtree(folder_path, ignore_errors=True)
                return True

            # Folder does not exist — treat as "successful delete"
            return True

        except Exception as e:
            print(f"[ERROR] Failed to delete folder: {folder_path}. Error: {e}")
            return False


    async def upload_file(self, file, folder: str):

        # Folder path
        folder_path = os.path.join(UPLOAD_BASE, self.id, folder)
        os.makedirs(folder_path, exist_ok=True)

        # Unique filename
        ext = file.filename.split(".")[-1]
        unique_name = f"{generate_doc_id()}.{ext}"
        final_path = os.path.join(folder_path, unique_name)
        folder_path = os.path.join(folder_path)
        # Save file
        with open(final_path, "wb") as buffer:
            buffer.write(await file.read())

        # return metadata
        return {
            # "original_name": file.filename,
            # "saved_as": unique_name,
            # "folder": folder,
            "filepath": final_path,
            "folder_path":folder_path
        }






# # code to upload the files and images on aws s3 bucket ------------------------------ (please set the original aws credential in .env files)

# import os
# import boto3
# import shutil
# from fastapi import HTTPException
# from app.core.utils_functions import generate_image_id

# AWS_BUCKET = os.getenv("AWS_S3_BUCKET")
# AWS_REGION = os.getenv("AWS_REGION")

# s3_client = boto3.client(
#     "s3",
#     aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
#     aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
#     region_name=AWS_REGION
# )

# class FileUploadService:

#     def __init__(self, id: str):
#         self.id = id


#     async def upload_file(self, file, folder: str):
#         """
#         Upload file to AWS S3 under:
#         uploads/{id}/{folder}/{unique_filename}
#         """

#         ext = file.filename.split(".")[-1]
#         unique_name = f"{generate_image_id()}.{ext}"

#         # S3 path (key)
#         s3_key = f"uploads/{self.id}/{folder}/{unique_name}"

#         # Read file bytes
#         file_bytes = await file.read()

#         try:
#             s3_client.put_object(
#                 Bucket=AWS_BUCKET,
#                 Key=s3_key,
#                 Body=file_bytes,
#                 ContentType=file.content_type
#             )
#         except Exception as e:
#             print("S3 Upload Failed:", e)
#             raise HTTPException(status_code=500, detail="File upload to S3 failed")

#         # Public URL
#         file_url = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{s3_key}"

#         return {
#             "filepath": file_url,
#             "folder_path": f"uploads/{self.id}/{folder}"  # virtual path
#         }


#     def delete_folder(self, folder_path: str) -> bool:
#         """
#         Delete entire folder from S3
#         folder_path = uploads/admin_id/profile
#         """

#         try:
#             objects = s3_client.list_objects_v2(
#                 Bucket=AWS_BUCKET,
#                 Prefix=folder_path
#             )

#             if "Contents" not in objects:
#                 return True

#             delete_list = [{"Key": obj["Key"]} for obj in objects["Contents"]]

#             s3_client.delete_objects(
#                 Bucket=AWS_BUCKET,
#                 Delete={"Objects": delete_list}
#             )

#             return True

#         except Exception as e:
#             print("[ERROR] S3 FOLDER DELETE FAILED:", e)
#             return False



    # def getRestroProfileImages(folder_path ):

    #     all_urls = []

    #     if folder_path:
    #         try:
    #             response = s3_client.list_objects_v2(
    #                 Bucket=AWS_BUCKET,
    #                 Prefix=folder_path
    #             )

    #             if "Contents" in response:
    #                 for obj in response["Contents"]:
    #                     key = obj["Key"]

    #                     # skip folder key-like entries
    #                     if key.endswith("/"):
    #                         continue

    #                     file_url = f"https://{AWS_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{key}"
    #                     all_urls.append(file_url)

    #         except Exception as e:
    #             print("S3 LIST ERROR:", e)
    #             raise HTTPException(500, "Unable to read folder from S3")

    #         return {"restro_image": all_urls}
    #     else: 
    #         raise HTTPException(404, "folder path is not available")
        





