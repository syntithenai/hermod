from flask import Flask, redirect, url_for, cli, redirect, render_template, flash, session, current_app
from flask_dance.contrib.google import make_google_blueprint, google
from flask_dance.contrib.github import make_github_blueprint, github
from subprocess import call
import string
import os, json, random, sys
import hashlib
import yaml, time
import oauthlib
from oauthlib.oauth2.rfc6749.errors import InvalidClientIdError, TokenExpiredError

    


# start login server
app = Flask(__name__,root_path='/app/www',static_url_path="")

# disable caching for dev
app.jinja_env.auto_reload = True
app.config['TEMPLATES_AUTO_RELOAD'] = True


def get_password(stringLength=10):
    """Generate a random string of fixed length """
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for i in range(stringLength))

# mosquitto_passwd -b passwordfile username password
def get_mosquitto_user(email):
    # Assumes the default UTF-8
    # hash_object = hashlib.md5(email.encode())
    # email_clean = hash_object.hexdigest()
    # letters = string.ascii_lowercase
    # randomtag =  ''.join(random.choice(letters) for i in range(stringLength))
    randomtag = get_password(4)
    email_clean = email.replace("@",'__')
    email_clean = email_clean.replace(".",'_') + '_' + randomtag
    print(email_clean)
    print('get mosq user')
    password = get_password()
    cmd = ['/usr/bin/mosquitto_passwd','-b','/etc/mosquitto/password',email_clean,password] 
    p = call(cmd)
    time.sleep(0.5)
    return {"email":email,"email_clean":email_clean,"password":password}


app.secret_key = os.environ.get("FLASK_SECRET_KEY", "supersekrithermod")
app.config["GOOGLE_OAUTH_CLIENT_ID"] = os.environ.get("GOOGLE_OAUTH_CLIENT_ID")
app.config["GOOGLE_OAUTH_CLIENT_SECRET"] = os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")
google_bp = make_google_blueprint(scope=["https://www.googleapis.com/auth/userinfo.email","openid","https://www.googleapis.com/auth/userinfo.profile"])
app.register_blueprint(google_bp, url_prefix="/login")
app.config["GITHUB_OAUTH_CLIENT_ID"] = os.environ.get("GITHUB_OAUTH_CLIENT_ID")
app.config["GITHUB_OAUTH_CLIENT_SECRET"] = os.environ.get("GITHUB_OAUTH_CLIENT_SECRET")
github_bp = make_github_blueprint()
app.register_blueprint(github_bp, url_prefix="/login")

print('START WEB')


# @app.route('/logout', methods=['GET'])
# def logout():
    # """
    # This endpoint tries to revoke the token
    # and then it clears the session
    # """
    # if google.authorized:
        # try:
            # google.get(
                # 'https://accounts.google.com/o/oauth2/revoke',
                # params={
                    # 'token':
                        # current_app.blueprints['google'].token['access_token']},
            # )
        # except TokenExpiredError:
            # pass
        # except InvalidClientIdError:
            # # Our OAuth session apparently expired. We could renew the token
            # # and logout again but that seems a bit silly, so for now fake
            # # it.
            # pass
    # _empty_session()
    # return redirect(url_for('app.index'))


def _empty_session():
    """
    Deletes the google token and clears the session
    """
    try:
        if 'google' in current_app.blueprints and hasattr(current_app.blueprints['google'], 'token'):
            del current_app.blueprints['google'].token
        if 'github' in current_app.blueprints and hasattr(current_app.blueprints['github'], 'token'):
            del current_app.blueprints['github'].token
        session.clear()
    except Exception as e:
        pass

@app.errorhandler(oauthlib.oauth2.rfc6749.errors.TokenExpiredError)
@app.errorhandler(oauthlib.oauth2.rfc6749.errors.InvalidClientIdError)
@app.errorhandler(oauthlib.oauth2.rfc6749.errors.InvalidClientError)
def token_expired(_):
    print('TOKEN EXP')
    _empty_session()
    #return redirect(url_for("google.login"))
    return redirect("/")
    #return render_template('index.html', url=url_for('index'))
    #return redirect(url_for('app.index'))
    
    
# @app.errorhandler(InvalidClientIdError)
# def handle_error(e):
    # print('ERR ')
    # print(e)    
    # # session.clear()
    # # return redirect(url_for("google.login"))
    # #return render_template('redirect.html', url=url_for('index'))


def logme(msg):
    print(msg)
    sys.stdout.flush()

if True:
    @app.route("/")
    def index():
        try:
            if os.environ.get("GOOGLE_OAUTH_CLIENT_ID") and os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET") and len(os.environ.get("GOOGLE_OAUTH_CLIENT_ID")) > 0 and len(os.environ.get("GOOGLE_OAUTH_CLIENT_SECRET")) > 0:
                if not google.authorized:
                    return redirect(url_for("google.login"))
                try:
                    resp = google.get("/oauth2/v1/userinfo")
                    assert resp.ok, resp.text
                    return render_template('index.html',data=get_mosquitto_user(resp.json()["email"]))
                except Exception as e:
                    _empty_session()
                    return redirect(url_for("google.login"))
            elif os.environ.get("GITHUB_OAUTH_CLIENT_ID") and os.environ.get("GITHUB_OAUTH_CLIENT_SECRET") and len(os.environ.get("GITHUB_OAUTH_CLIENT_ID")) > 0 and len(os.environ.get("GITHUB_OAUTH_CLIENT_SECRET")) > 0:
                if not github.authorized:
                    return redirect(url_for("github.login"))
                try:
                    resp = github.get("/user")
                    assert resp.ok, resp.text
                    return render_template('index.html',data=get_mosquitto_user('github_'+resp.json().get("login",'no_user_login')));
                except Exception as e:
                    _empty_session()
                    return redirect(url_for("github.login"))
            else:
                return render_template('index.html',data=get_mosquitto_user('no_user_login')) 
        except Exception as e:
            print(e)


# @app.route("/")
# def index():
    # if not github.authorized:
        # return redirect(url_for("github.login"))
    # resp = github.get("/user")
    # assert resp.ok
    # return "You are @{login} on GitHub".format(login=resp.json()["login"])



def start_server(config , run_event):
    # print(config)
    # print(os.environ.get('SSL_CERTIFICATES_FOLDER'))
    # print(os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem')) )
    # print(os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')))
    # print(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem')) 
    # print(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem'))
    
    if os.environ.get('SSL_CERTIFICATES_FOLDER'):
        if os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem')) and os.path.isfile(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')):
            print('START SSL WEB SERVER')
            app.run(host='0.0.0.0',ssl_context=(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem'), os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')), port=443, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
        else:
            print('START WEB SERVER')
            app.run(host='0.0.0.0', port=80, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    
    else:
        print('START WEB SERVER')
        app.run(host='0.0.0.0', port=80, extra_files=[os.path.join(os.path.dirname(__file__),"index.html")])
    
    
@app.after_request
def apply_caching(response):
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response   
