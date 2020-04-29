from flask import Flask, redirect, url_for, cli, redirect, render_template
from flask_dance.contrib.google import make_google_blueprint, google
from subprocess import call
import string
import os, json, random
import hashlib
import yaml

# start login server
cli.load_dotenv(path=os.path.dirname(__file__))
app = Flask(__name__)

F = open(os.path.join(os.path.dirname(__file__), 'config-all.yaml'), "r")
CONFIG = yaml.load(F.read(), Loader=yaml.FullLoader)

def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
def get_mosquitto_user(email):
    # email_clean = email.replace("@","___")
    # email_clean = email_clean.replace(".","__")
    # Assumes the default UTF-8
    hash_object = hashlib.md5(email.encode())
    email_clean = hash_object.hexdigest()
    print(email_clean)
    print('START RASA ACTIONS SERVER')
    password = get_password()
    cmd = ['mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    # reload mosq passwords - no longer need as mosquitto server watches pw file
    # cmd = [os.path.join(os.path.dirname(__file__),'mosquitto_hup.sh')]
    # call(cmd, shell=True)
    return {"email":email,"email_clean":email_clean,"password":password}



print(os.environ.get("GOOGLE_OAUTH_CLIENT_ID"))
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "supersekrithermod")
app.config["GOOGLE_OAUTH_CLIENT_ID"] = "589552091078-d4ept8hv8sv10mip9fv0nt9nrkqt9pbq.apps.googleusercontent.com" #os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = "oSkWuVebQDU9BRgMWcT1Fltu" #os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
#google_bp = make_google_blueprint(scope=["profile", "email"])
google_bp = make_google_blueprint(scope=["https://www.googleapis.com/auth/userinfo.email","openid","https://www.googleapis.com/auth/userinfo.profile"])
app.register_blueprint(google_bp, url_prefix="/login")

if True:
    @app.route("/")
    def index():
        try:
            if not google.authorized:
                return redirect(url_for("google.login"))
            resp = google.get("/oauth2/v1/userinfo")
            assert resp.ok, resp.text
            return render_template('web/index.html',website_url = CONFIG['website_url'],  user_data=get_mosquitto_user(resp.json()["email"]))
            
            # where auth service is external
            # return render_template('logincomplete.html',website_url = CONFIG['website_url'],  user_data=get_mosquitto_user(resp.json()["email"]))
            
            #return json.dumps(get_mosquitto_user(resp.json()["email"]))
            # return redirect('http://localhost/'+urllib.urlencode(get_mosquitto_user(resp.json()["email"])))
            #return "You are {email} on Google".format(email=resp.json()["email"])
        except Exception as e:
            print(e)
            return redirect(url_for("google.login"))

def start_rasa_auth_server(run_event):
    print('START AUTH SERVER')
    #app.run('0.0.0.0', debug=True, port=5000, ssl_context='adhoc')
    #context = ('cert.pem', 'key.pem')#certificate and key files
    #app.run(host='0.0.0.0', debug=True, ssl_context=context)
    #app.run(host='0.0.0.0')
    cert_path=CONFIG['certs_folder'] #'/etc/certs/'
    app.run(host='0.0.0.0',ssl_context=(cert_path+'cert.pem', cert_path+'privkey.pem'), port=5000)
    
   
