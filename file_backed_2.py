import os
import time
import hashlib
from google.cloud import storage
import mysql.connector
from pathlib import Path

# Configuration from environment variables with defaults
BUCKET_NAME = os.getenv("BUCKET_NAME", "invokeai-mrcool-20250426")
LOCAL_DIR = os.getenv("LOCAL_DIR", str(Path.home() / "testfolder"))
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "1"))  # Check every 1 second
ERROR_LOG_PATH = os.getenv("ERROR_LOG_PATH", str(Path.home() / "sync_errors.txt"))

# MySQL configuration
DB_CONFIG = {
    'host': os.getenv("MYSQL_HOST", "localhost"),
    'user': os.getenv("MYSQL_USER", "root"),
    'password': os.getenv("MYSQL_PASSWORD", ""),  # Must be set in environment
    'database': os.getenv("MYSQL_DATABASE", "file_sync")
}

# Validate required environment variables
if not DB_CONFIG['password']:
    raise ValueError("MYSQL_PASSWORD environment variable must be set")

# Ensure local directory exists
os.makedirs(LOCAL_DIR, exist_ok=True)

# Initialize storage client
try:
    storage_client = storage.Client()
    bucket = storage_client.bucket(BUCKET_NAME)
except Exception as e:
    raise RuntimeError(f"Failed to initialize Google Cloud Storage client: {str(e)}")

def get_db_connection():
    return mysql.connector.connect(**DB_CONFIG)

def get_file_hash(file_path):
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()

def get_relative_path(file_path):
    """Get the relative path of a file with respect to LOCAL_DIR."""
    return os.path.relpath(file_path, LOCAL_DIR)

def sync_local_to_bucket():
    """Sync local changes (from DB) to bucket, including directories."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT file_name, md5_hash, status 
        FROM files 
        WHERE location='local' AND last_modified > NOW() - INTERVAL 1 MINUTE
    """)
    changes = cursor.fetchall()

    for file_name, md5_hash, status in changes:
        local_file = os.path.join(LOCAL_DIR, file_name)
        if not os.path.exists(local_file):  # File might have been deleted/moved
            continue
        if os.path.isdir(local_file):
            # Skip directories themselves, handle their contents recursively
            continue
        if status == 'active':
            blob = bucket.blob(file_name)
            current_hash = get_file_hash(local_file)
            if md5_hash == current_hash:  # Ensure file wasn't modified locally again
                print(f"Uploading {file_name} to bucket")
                blob.upload_from_filename(local_file)
                # Update bucket record in DB
                cursor.execute("""
                    INSERT INTO files (file_name, location, md5_hash, status) 
                    VALUES (%s, %s, %s, %s) 
                    ON DUPLICATE KEY UPDATE md5_hash=%s, status=%s, last_modified=CURRENT_TIMESTAMP
                """, (file_name, 'bucket', md5_hash, 'active', md5_hash, 'active'))
        elif status == 'deleted':
            blob = bucket.blob(file_name)
            if blob.exists():
                print(f"Deleting {file_name} from bucket")
                blob.delete()
                cursor.execute("""
                    UPDATE files SET status='deleted', last_modified=CURRENT_TIMESTAMP 
                    WHERE file_name=%s AND location='bucket'
                """, (file_name,))
    conn.commit()
    cursor.close()
    conn.close()

def sync_bucket_to_local():
    """Sync bucket changes to local (and update DB), including directories."""
    conn = get_db_connection()
    cursor = conn.cursor()
    blobs = list(bucket.list_blobs())
    current_bucket_files = {blob.name: blob.md5_hash for blob in blobs}

    # Get current bucket state from DB
    cursor.execute("SELECT file_name, md5_hash, status FROM files WHERE location='bucket'")
    db_bucket_files = {row[0]: (row[1], row[2]) for row in cursor.fetchall()}

    # Detect new or modified files
    for file_name, bucket_hash in current_bucket_files.items():
        local_file = os.path.join(LOCAL_DIR, file_name)
        db_hash, db_status = db_bucket_files.get(file_name, (None, None))
        if db_hash != bucket_hash or db_status != 'active':
            print(f"Downloading {file_name} from bucket")
            blob = bucket.blob(file_name)
            os.makedirs(os.path.dirname(local_file), exist_ok=True)
            blob.download_to_filename(local_file)
            cursor.execute("""
                INSERT INTO files (file_name, location, md5_hash, status) 
                VALUES (%s, %s, %s, %s) 
                ON DUPLICATE KEY UPDATE md5_hash=%s, status=%s, last_modified=CURRENT_TIMESTAMP
            """, (file_name, 'bucket', bucket_hash, 'active', bucket_hash, 'active'))
            # Update local record
            cursor.execute("""
                INSERT INTO files (file_name, location, md5_hash, status) 
                VALUES (%s, %s, %s, %s) 
                ON DUPLICATE KEY UPDATE md5_hash=%s, status=%s, last_modified=CURRENT_TIMESTAMP
            """, (file_name, 'local', bucket_hash, 'active', bucket_hash, 'active'))

    # Detect deleted files
    for file_name in db_bucket_files:
        if file_name not in current_bucket_files and db_bucket_files[file_name][1] == 'active':
            local_file = os.path.join(LOCAL_DIR, file_name)
            if os.path.exists(local_file) and not os.path.isdir(local_file):
                print(f"Deleting {local_file} as it was removed from bucket")
                os.remove(local_file)
            cursor.execute("""
                UPDATE files SET status='deleted', last_modified=CURRENT_TIMESTAMP 
                WHERE file_name=%s AND location='bucket'
            """, (file_name,))
            cursor.execute("""
                UPDATE files SET status='deleted', last_modified=CURRENT_TIMESTAMP 
                WHERE file_name=%s AND location='local'
            """, (file_name,))

    conn.commit()
    cursor.close()
    conn.close()

def main():
    print(f"Starting bidirectional sync using MySQL database...")
    print(f"Local directory: {LOCAL_DIR}")
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Poll interval: {POLL_INTERVAL} seconds")
    
    while True:
        try:
            sync_local_to_bucket()
            sync_bucket_to_local()
        except mysql.connector.Error as e:
            print(f"MySQL Error: {str(e)}")
            with open(ERROR_LOG_PATH, "a") as log:
                log.write(f"{time.ctime()}: MySQL Error: {str(e)}\n")
        except storage.exceptions.GoogleCloudError as e:
            print(f"Google Cloud Storage Error: {str(e)}")
            with open(ERROR_LOG_PATH, "a") as log:
                log.write(f"{time.ctime()}: Google Cloud Storage Error: {str(e)}\n")
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            with open(ERROR_LOG_PATH, "a") as log:
                log.write(f"{time.ctime()}: Unexpected error: {str(e)}\n")
        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    main()