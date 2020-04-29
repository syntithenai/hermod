from flask import Flask, redirect, url_for, cli, redirect, render_template
from flask_dance.contrib.google import make_google_blueprint, google
from subprocess import call
import string
import os, json, random
import hashlib
import yaml, time

# start login server
app = Flask(__name__,root_path='/app/www',static_url_path="")

# disable caching for dev
app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True
    
F = open(os.path.join(os.path.dirname(__file__), 'secrets.yaml'), "r")
secrets = yaml.load(F.read(), Loader=yaml.FullLoader)
if not secrets: secrets = {}


def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
def get_mosquitto_user(email):
    # Assumes the default UTF-8
    # hash_object = hashlib.md5(email.encode())
    # email_clean = hash_object.hexdigest()
    email_clean = email.replace("@",'__')
    email_clean = email_clean.replace(".",'_')
    print(email_clean)
    print('get mosq user')
    password = get_password()
    cmd = ['/usr/bin/mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    time.sleep(0.5)
    return {"email":email,"email_clean":email_clean,"password":password}


app.secret_key = os.environ.get("FLASK_SECRET_KEY", "supersekrithermod")
app.config["GOOGLE_OAUTH_CLIENT_ID"] = secrets.get("GOOGLE_OAUTH_CLIENT_ID")
app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = secrets.get("GOOGLE_OAUTH_CLIENT_SECRET")
google_bp = make_google_blueprint(scope=["https://www.googleapis.com/auth/userinfo.email","openid","https://www.googleapis.com/auth/userinfo.profile"])
app.register_blueprint(google_bp, url_prefix="/login")

if True:
    @app.route("/")
    def index():
        try:
            if secrets.get("GOOGLE_OAUTH_CLIENT_ID") and secrets.get("GOOGLE_OAUTH_CLIENT_SECRET"):
                if not google.authorized:
                    return redirect(url_for("google.login"))
                resp = google.get("/oauth2/v1/userinfo")
                assert resp.ok, resp.text
                return render_template('index.html',data=get_mosquitto_user(resp.json()["email"]));
            else:
                return render_template('index.html',data=get_mosquitto_user('no_user_login')) 

            # where auth service is external
            # return render_template('logincomplete.html',website_url = CONFIG['website_url'],  user_data=get_mosquitto_user(resp.json()["email"]))
            # or
            #return json.dumps(get_mosquitto_user(resp.json()["email"]))
            # return redirect('http://localhost/'+urllib.urlencode(get_mosquitto_user(resp.json()["email"])))
            #return "You are {email} on Google".format(email=resp.json()["email"])
        except Exception as e:
            print(e)
            # return str(e)
            # return redirect(url_for("google.login"))

def start_server(config , run_event):
   # print(config)
    if secrets.get('SSL_CERTIFICATES_FOLDER') and os.path.isfile(os.path.join(secrets.get('SSL_CERTIFICATES_FOLDER'),'cert.pem')) and os.path.isfile(os.path.join(secrets.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')):
        print('START SSL WEB SERVER')
        app.run(host='0.0.0.0',ssl_context=(os.path.join(secrets.get('SSL_CERTIFICATES_FOLDER'),'cert.pem'), os.path.join(secrets.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')), port=443, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    else:
        print('START WEB SERVER')
        app.run(host='0.0.0.0', port=80, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    
    
@app.after_request
def apply_caching(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response   
