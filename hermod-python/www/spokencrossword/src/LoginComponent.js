import React from 'react';
import { GoogleLogin } from 'react-google-login';
import { BrowserRouter as Router, Link } from "react-router-dom";


const responseGoogle = (response) => {
  console.log(response);
}
 
function LoginComponent() {
  return (
    <div className="Login">
      <GoogleLogin
        clientId="589552091078-p6ccsnt8kchep5r46t9hfuti328fofjr.apps.googleusercontent.com"
        buttonText="Login"
        onSuccess={responseGoogle}
        onFailure={responseGoogle}
        cookiePolicy={'single_host_origin'}
      />
    </div>
  );
}

export default LoginComponent;
