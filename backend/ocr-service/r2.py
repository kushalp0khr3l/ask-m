import boto3
from botocore.config import Config
import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
ACCESS_KEY = os.getenv("R2_ACCESS_KEY")
SECRET_KEY = os.getenv("R2_SECRET_KEY")

if not all([ACCOUNT_ID, ACCESS_KEY, SECRET_KEY]):
    raise RuntimeError("Missing R2 environment variables")

s3 = boto3.client(
    "s3",
    endpoint_url=f"https://{ACCOUNT_ID}.r2.cloudflarestorage.com",
    aws_access_key_id=ACCESS_KEY,
    aws_secret_access_key=SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto"
)

def download_from_r2(bucket_name: str, file_key: str) -> bytes:
    response = s3.get_object(
        Bucket=bucket_name,
        Key=file_key
    )
    return response["Body"].read()
