from flask import Flask, redirect, url_for
from flask_dance.contrib.google import make_google_blueprint, google
import os
from oauthlib.oauth2.rfc6749.errors import InvalidClientIdError, TokenExpiredError

app = Flask(__name__)
app.secret_key = "supersekrit"
blueprint = make_google_blueprint(
    client_id="589552091078-d4ept8hv8sv10mip9fv0nt9nrkqt9pbq.apps.googleusercontent.com",
    client_secret="QlMfi5gnpHUdITpF70-zVQti",
    scope=["profile", "email"],
    offline=True
)
app.register_blueprint(blueprint, url_prefix="/login")

@app.route("/")
def index():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/plus/v1/people/me")
    assert resp.ok, resp.text
    return "You are {email} on Google".format(email=resp.json()["emails"][0]["value"])

@app.route('/logout', methods=['GET'])
def logout():
    """Revokes token and empties session."""
    if google.authorized:
        try:
            google.get(
                'https://accounts.google.com/o/oauth2/revoke',
                params={
                    'token':
                    current_app.blueprints['google'].token['access_token']},
            )
        except TokenExpiredError:
            pass
        except InvalidClientIdError:
            # Our OAuth session apparently expired. We could renew the token
            # and logout again but that seems a bit silly, so for now fake
            # it.
            pass
    session.clear()
    return redirect('/')


@app.errorhandler(InvalidClientIdError)
def token_expired(_):
    del current_app.blueprints['google'].token
    # flash('Your session had expired. Please submit the request again',
          # 'error')
    return redirect('/')

if __name__ == "__main__":
    app.run(port=443, host='0.0.0.0', ssl_context=(os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'cert.pem'), os.path.join(os.environ.get('SSL_CERTIFICATES_FOLDER'),'privkey.pem')))



# docker-compose run -p 80:80 -p 443:443 -v /projects/hermod/hermod-python/certs:/app/certs  --entrypoint 'python src/tf.py' hermodweb
