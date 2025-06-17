import http.server
import socketserver
import json
import subprocess
import os
import socket
import random
import string
import mysql.connector

PORT = 3001  # Server port
SHARED_DIR = "/var/lib/docker/volumes/comfyui-data/_data"  # Shared dir for models
BASE_PORT = 8100  # Start from 8100 for new containers
MAX_PORT = 8199  # Range ends at 8199
VM_IP = "35.216.42.8"  # Current IP address
NGINX_CONTAINER = "nginx-base"  # Nginx container name
NGINX_CONFIG_DIR = "/home/ubuntu/nginx/conf.d"  # Local config directory

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def _set_headers(self, method_ok=True):
        print(f"DEBUG: _set_headers called with method_ok={method_ok}")
        self.send_response(200 if method_ok else 405)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        print("DEBUG: do_OPTIONS called")
        self._set_headers()
        self.wfile.write(b'{}')

    def _authenticate(self, user_id, password):
        print(f"DEBUG: _authenticate called with user_id={user_id}, password={password}")
        conn = None
        try:
            conn = mysql.connector.connect(
                host="127.0.0.1",
                user="root",
                password="securepass123",
                database="comfyui_db"
            )
            cursor = conn.cursor()
            cursor.execute("SELECT password FROM users WHERE user = %s", (user_id,))
            result = cursor.fetchone()
            if result and result[0] == password:
                print(f"DEBUG: Authentication successful for user={user_id}")
                return True
            print(f"DEBUG: Authentication failed for user={user_id}")
            return False
        except mysql.connector.Error as err:
            print(f"DEBUG: Authentication error: {err}")
            return False
        finally:
            if conn is not None and conn.is_connected():
                cursor.close()
                conn.close()

    def Query(self, user, password, app, app_url, port_no):
        print(f"DEBUG: Query called with user={user}, password={password}, app={app}, app_url={app_url}, port_no={port_no}")
        conn = None
        try:
            conn = mysql.connector.connect(
                host="127.0.0.1",
                user="root",
                password="securepass123",
                database="comfyui_db"
            )
            cursor = conn.cursor()
            cursor.execute("SELECT password FROM users WHERE user = %s", (user,))
            result = cursor.fetchone()
            if result:
                stored_password = result[0]
                if stored_password != password:
                    return {"error": "Invalid password"}
            else:
                cursor.execute("INSERT INTO users (user, password) VALUES (%s, %s)", (user, password))
                conn.commit()

            cursor.execute("""
                UPDATE users 
                SET app = %s, app_url = %s, port_no = %s 
                WHERE user = %s
            """, (app, app_url, port_no, user))
            conn.commit()
            return {"success": True}
        except mysql.connector.Error as err:
            return {"error": str(err)}
        finally:
            if conn is not None and conn.is_connected():
                cursor.close()
                conn.close()

    def update_nginx_config(self, app_url, port_no, user_id):
        print(f"DEBUG: update_nginx_config called with app_url={app_url}, port_no={port_no}, user_id={user_id}")
        random_str = app_url.split('/')[-2] if len(app_url.split('/')) > 4 else ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        path = f"/{user_id}/ComfyUI/{random_str}/"
        config_block = f"""location {path} {{
            proxy_pass http://{VM_IP}:{port_no}/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }}"""
        try:
            cmd = ['docker', 'ps', '-q', '-f', f'name={NGINX_CONTAINER}']
            container_id = subprocess.run(cmd, capture_output=True, text=True).stdout.strip()
            if not container_id:
                return {"error": f"Nginx container {NGINX_CONTAINER} not found or not running"}

            cmd = ['docker', 'exec', NGINX_CONTAINER, 'cat', '/etc/nginx/conf.d/default.conf']
            result = subprocess.run(cmd, capture_output=True, text=True)
            current_config = result.stdout

            if f"location {path}" in current_config:
                return {"success": True}

            server_block_start = current_config.find("server {")
            if server_block_start == -1:
                updated_config = f"""server {{
                    listen 80;
                    {config_block}
                }}"""
            else:
                updated_config = current_config[:server_block_start + len("server {")] + "\n" + config_block + "\n" + current_config[server_block_start + len("server {"):]

            temp_file = "/tmp/default.conf"
            with open(temp_file, "w") as f:
                f.write(updated_config)
            cmd = ['docker', 'cp', temp_file, f"{NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf"]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            os.remove(temp_file)

            cmd = ['docker', 'exec', NGINX_CONTAINER, 'nginx', '-t']
            test_result = subprocess.run(cmd, capture_output=True, text=True)
            if test_result.returncode != 0:
                return {"error": f"Nginx syntax error: {test_result.stderr}"}

            cmd = ['docker', 'exec', NGINX_CONTAINER, 'nginx', '-s', 'reload']
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as err:
            return {"error": f"Failed to update Nginx: {err.stderr}"}
        return {"success": True}

    def remove_nginx_config(self, user_id, random_str):
        print(f"DEBUG: remove_nginx_config called with user_id={user_id}, random_str={random_str}")
        path = f"/{user_id}/ComfyUI/{random_str}/"
        config_block = f"location {path} {{ }}"
        try:
            cmd = ['docker', 'exec', NGINX_CONTAINER, 'cat', '/etc/nginx/conf.d/default.conf']
            result = subprocess.run(cmd, capture_output=True, text=True)
            current_config = result.stdout

            if f"location {path}" not in current_config:
                return {"success": True}

            server_block_start = current_config.find("server {")
            server_block_end = current_config.find("}", server_block_start) + 1
            server_block = current_config[server_block_start:server_block_end]
            updated_config = current_config.replace(f"\n{config_block}\n", "") if config_block in server_block else current_config

            temp_file = "/tmp/default.conf"
            with open(temp_file, "w") as f:
                f.write(updated_config)
            cmd = ['docker', 'cp', temp_file, f"{NGINX_CONTAINER}:/etc/nginx/conf.d/default.conf"]
            subprocess.run(cmd, check=True, capture_output=True, text=True)
            os.remove(temp_file)

            cmd = ['docker', 'exec', NGINX_CONTAINER, 'nginx', '-t']
            test_result = subprocess.run(cmd, capture_output=True, text=True)
            if test_result.returncode != 0:
                return {"error": f"Nginx syntax error: {test_result.stderr}"}

            cmd = ['docker', 'exec', NGINX_CONTAINER, 'nginx', '-s', 'reload']
            subprocess.run(cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as err:
            return {"error": f"Failed to update Nginx: {err.stderr}"}
        return {"success": True}

    def _get_container_status(self, user_id, random_str):
        print(f"DEBUG: _get_container_status called with user_id={user_id}, random_str={random_str}")
        container_name = f"comfyui-{user_id}-{random_str}"
        cmd = ['docker', 'ps', '-q', '-f', f'name={container_name}']
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            return {"status": "running"}
        cmd = ['docker', 'ps', '-a', '-q', '-f', f'name={container_name}']
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.stdout:
            return {"status": "stopped"}
        return {"status": "not_found"}

    def do_POST(self):
        print(f"DEBUG: do_POST called with path={self.path}")
        if self.path == '/register':
            print("DEBUG: Processing /register request")
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            user_id = data.get('userId')
            password = data.get('password')

            if not user_id or not password:
                self._set_headers()
                self.wfile.write(json.dumps({"error": "userId and password are required"}).encode())
                return

            conn = None
            try:
                conn = mysql.connector.connect(
                    host="127.0.0.1",
                    user="root",
                    password="securepass123",
                    database="comfyui_db"
                )
                cursor = conn.cursor()
                cursor.execute("SELECT user FROM users WHERE user = %s", (user_id,))
                if cursor.fetchone():
                    self._set_headers()
                    self.wfile.write(json.dumps({"error": "User already exists"}).encode())
                    return
                cursor.execute("INSERT INTO users (user, password) VALUES (%s, %s)", (user_id, password))
                conn.commit()
                self._set_headers()
                self.wfile.write(json.dumps({"message": "User registered successfully"}).encode())
            except mysql.connector.Error as err:
                self._set_headers()
                self.wfile.write(json.dumps({"error": str(err)}).encode())
            finally:
                if conn is not None and conn.is_connected():
                    cursor.close()
                    conn.close()
        elif self.path == '/spin-container':
            print("DEBUG: Processing /spin-container request")
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            user_id = data.get('userId')
            password = data.get('password')

            if not user_id or not password:
                self._set_headers()
                self.wfile.write(json.dumps({"error": "userId and password are required"}).encode())
                return

            if not self._authenticate(user_id, password):
                self._set_headers()
                self.wfile.write(json.dumps({"error": "Authentication failed"}).encode())
                return

            try:
                conn = None
                conn = mysql.connector.connect(
                    host="127.0.0.1",
                    user="root",
                    password="securepass123",
                    database="comfyui_db"
                )
                cursor = conn.cursor()
                cursor.execute("SELECT port_no FROM users WHERE user = %s AND port_no IS NOT NULL", (user_id,))
                stale_ports = [row[0] for row in cursor.fetchall()]
                conn.commit()
                for port in stale_ports:
                    subprocess.run(['docker', 'rm', '-f', f"comfyui-{user_id}-*"], capture_output=True, text=True)
                cursor.execute("UPDATE users SET port_no = NULL, app_url = NULL, app = NULL WHERE user = %s", (user_id,))
                conn.commit()
            except mysql.connector.Error as err:
                pass
            finally:
                if conn is not None and conn.is_connected():
                    cursor.close()
                    conn.close()

            existing_ports = [8188, 8189, 8190] + list(range(BASE_PORT, MAX_PORT + 1))
            used_ports = []
            for port in existing_ports:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                try:
                    sock.settimeout(1)
                    sock.bind(("", port))
                    sock.close()
                except socket.error:
                    docker_status = subprocess.run(['docker', 'ps', '-q', '-f', f'publish={port}-tcp'], capture_output=True, text=True)
                    lsof_status = subprocess.run(['lsof', '-i', f':{port}'], capture_output=True, text=True)
                    docker_exited = subprocess.run(['docker', 'ps', '-a', '-q', '-f', f'publish={port}-tcp'], capture_output=True, text=True)
                    if docker_status.stdout or lsof_status.stdout or docker_exited.stdout or port in [8188, 8189, 8190]:
                        used_ports.append(port)
                finally:
                    sock.close()

            port_no = None
            max_attempts = 100
            attempt = 0
            while port_no is None and attempt < max_attempts:
                candidate_port = random.randint(BASE_PORT, MAX_PORT)
                if candidate_port not in used_ports:
                    try:
                        test_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        test_sock.settimeout(1)
                        test_sock.bind(("", candidate_port))
                        test_sock.close()
                        port_no = candidate_port
                    except socket.error:
                        used_ports.append(candidate_port)
                attempt += 1

            if port_no is None:
                self._set_headers()
                self.wfile.write(json.dumps({"error": f"No available ports in range {BASE_PORT}-{MAX_PORT} after {max_attempts} attempts"}).encode())
                return

            random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
            container_name = f"comfyui-{user_id}-{random_str}"
            new_url = f"http://{VM_IP}/{random_str}/"
            output_volume = f"comfyui-output-{user_id}-{random_str}"
            if not os.path.exists(f"/var/lib/docker/volumes/{output_volume}"):
                os.makedirs(f"/var/lib/docker/volumes/{output_volume}", exist_ok=True)
                subprocess.run(['docker', 'volume', 'create', output_volume], check=True)

            docker_cmd = [
                'docker', 'run', '-d',
                '--gpus', 'all',
                '--shm-size=8g',
                '--env', 'COMFYUI_ARGS="--fp16 --highvram --multi-gpu"',
                '--env', f'WANTED_UID=1024',
                '--env', f'WANTED_GID=1024',
                '--env', 'BASE_DIRECTORY=/comfy/output',
                '--env', 'SECURITY_LEVEL=normal',
                f'-p', f'0.0.0.0:{port_no}:8188',
                '-v', f'{SHARED_DIR}:/comfy/models',
                '-v', f'/var/lib/docker/volumes/{output_volume}:/comfy/output',
                '--user', '1024:1024',
                '--name', container_name,
                'mmartial/comfyui-nvidia-docker:latest'
            ]

            try:
                result = subprocess.run(docker_cmd, capture_output=True, text=True, check=True)
                status = subprocess.run(['docker', 'ps', '-q', '-f', f'name={container_name}'], capture_output=True, text=True)
                if status.stdout:
                    query_result = self.Query(user_id, password, "ComfyUI", new_url, port_no)
                    if "error" in query_result:
                        self._set_headers()
                        self.wfile.write(json.dumps(query_result).encode())
                        return

                    conn = None
                    try:
                        conn = mysql.connector.connect(
                            host="127.0.0.1",
                            user="root",
                            password="securepass123",
                            database="comfyui_db"
                        )
                        cursor = conn.cursor()
                        cursor.execute("SELECT app_url, port_no FROM users WHERE user = %s", (user_id,))
                        result = cursor.fetchone()
                        if result:
                            db_app_url, db_port_no = result
                            nginx_update = self.update_nginx_config(db_app_url, db_port_no, user_id)
                            if "error" in nginx_update:
                                self._set_headers()
                                self.wfile.write(json.dumps(nginx_update).encode())
                                return
                    except mysql.connector.Error as err:
                        self._set_headers()
                        self.wfile.write(json.dumps({"error": f"Database error: {err}"}).encode())
                        return
                    finally:
                        if conn is not None and conn.is_connected():
                            cursor.close()
                            conn.close()

                    app_url = None
                    conn = None
                    try:
                        conn = mysql.connector.connect(
                            host="127.0.0.1",
                            user="root",
                            password="securepass123",
                            database="comfyui_db"
                        )
                        cursor = conn.cursor()
                        cursor.execute("SELECT app_url FROM users WHERE user = %s", (user_id,))
                        result = cursor.fetchone()
                        if result:
                            old_url = result[0]
                            random_str = old_url.split('/')[-2]
                            app_url = f"http://{VM_IP}/{user_id}/ComfyUI/{random_str}/"
                            cursor.execute("UPDATE users SET app_url = %s WHERE user = %s", (app_url, user_id))
                            conn.commit()
                    except mysql.connector.Error as err:
                        app_url = new_url
                    except TypeError:
                        app_url = new_url
                    finally:
                        if conn is not None and conn.is_connected():
                            cursor.close()
                            conn.close()

                    self._set_headers()
                    self.wfile.write(json.dumps({
                        "message": "Container spun up",
                        "port_no": port_no,
                        "userId": user_id,
                        "ip": VM_IP,
                        "app_url": app_url,
                        "app": "ComfyUI"
                    }).encode())
                else:
                    raise Exception("Container failed to start")
            except subprocess.CalledProcessError as err:
                self._set_headers()
                self.wfile.write(json.dumps({"error": str(err.stderr) or "Docker command failed"}).encode())
                subprocess.run(['docker', 'rm', '-f', container_name], capture_output=True, text=True)
        elif self.path == '/stop-container':
            print("DEBUG: Processing /stop-container request")
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            user_id = data.get('userId')
            password = data.get('password')

            if not user_id or not password:
                self._set_headers()
                self.wfile.write(json.dumps({"error": "userId and password are required"}).encode())
                return

            if not self._authenticate(user_id, password):
                self._set_headers()
                self.wfile.write(json.dumps({"error": "Authentication failed"}).encode())
                return

            conn = None
            try:
                conn = mysql.connector.connect(
                    host="127.0.0.1",
                    user="root",
                    password="securepass123",
                    database="comfyui_db"
                )
                cursor = conn.cursor()
                cursor.execute("SELECT port_no, app_url FROM users WHERE user = %s AND port_no IS NOT NULL", (user_id,))
                result = cursor.fetchone()
                if result:
                    port_no, app_url = result
                    random_str = app_url.split('/')[-2]
                    container_name = f"comfyui-{user_id}-{random_str}"
                    subprocess.run(['docker', 'stop', container_name], capture_output=True, text=True)
                    subprocess.run(['docker', 'rm', container_name], capture_output=True, text=True)
                    cursor.execute("UPDATE users SET port_no = NULL, app_url = NULL, app = NULL WHERE user = %s", (user_id,))
                    conn.commit()
                    nginx_update = self.remove_nginx_config(user_id, random_str)
                    if "error" in nginx_update:
                        self._set_headers()
                        self.wfile.write(json.dumps(nginx_update).encode())
                        return
                    self._set_headers()
                    self.wfile.write(json.dumps({"message": "Container stopped and removed"}).encode())
                else:
                    self._set_headers()
                    self.wfile.write(json.dumps({"error": "No active container found for user"}).encode())
            except mysql.connector.Error as err:
                self._set_headers()
                self.wfile.write(json.dumps({"error": str(err)}).encode())
            finally:
                if conn is not None and conn.is_connected():
                    cursor.close()
                    conn.close()
        elif self.path == '/monitor-container':
            print("DEBUG: Processing /monitor-container request")
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            user_id = data.get('userId')
            password = data.get('password')

            if not user_id or not password:
                self._set_headers()
                self.wfile.write(json.dumps({"error": "userId and password are required"}).encode())
                return

            if not self._authenticate(user_id, password):
                self._set_headers()
                self.wfile.write(json.dumps({"error": "Authentication failed"}).encode())
                return

            conn = None
            try:
                conn = mysql.connector.connect(
                    host="127.0.0.1",
                    user="root",
                    password="securepass123",
                    database="comfyui_db"
                )
                cursor = conn.cursor()
                cursor.execute("SELECT app_url FROM users WHERE user = %s AND app_url IS NOT NULL", (user_id,))
                result = cursor.fetchone()
                if result:
                    app_url = result[0]
                    random_str = app_url.split('/')[-2]
                    status = self._get_container_status(user_id, random_str)
                    self._set_headers()
                    self.wfile.write(json.dumps({"userId": user_id, "status": status["status"]}).encode())
                else:
                    self._set_headers()
                    self.wfile.write(json.dumps({"error": "No container associated with user"}).encode())
            except mysql.connector.Error as err:
                self._set_headers()
                self.wfile.write(json.dumps({"error": str(err)}).encode())
            finally:
                if conn is not None and conn.is_connected():
                    cursor.close()
                    conn.close()
        else:
            self._set_headers(method_ok=False)
            self.wfile.write(json.dumps({"error": "Invalid endpoint"}).encode())

    def _check_container_user(self, container_id, user_id):
        print(f"DEBUG: _check_container_user called with container_id={container_id}, user_id={user_id}")
        inspect = subprocess.run(['docker', 'inspect', container_id], capture_output=True, text=True)
        if inspect.returncode == 0:
            import json
            data = json.loads(inspect.stdout)[0]
            name = data.get('Name', '').replace('/', '')
            return user_id in name
        return False

# Start server
with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
    print(f"DEBUG: Server starting on port {PORT}")
    print(f"Server running on port {PORT}")
    httpd.serve_forever()