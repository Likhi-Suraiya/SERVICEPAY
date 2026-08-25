
// import React from 'react';
import { Link } from 'react-router-dom';
// import sneatLogo from '../assets/img/sneat.svg'; // Adjust path as needed
// import googleIcon from '../assets/img/icons/google.svg';
// import facebookIcon from '../assets/img/icons/facebook.svg';

export const SignInPage = () => {
  return (
    <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-4">
          {/* <img src={sneatLogo} alt="Sneat Logo" style={{ height: '40px' }} /> */}
          <img src="/assets/img/sneat.svg" alt="sneat-logo" />
          <h1 className="mt-2 mb-0" style={{ color: '#7367f0' }}>Sneat</h1>
        </div>
        
        <div className="text-center mb-4">
          <h2 className="h4 mb-1">Welcome to Sneat! 👋🏻</h2>
          <p className="text-muted small">Please sign-in to your account and start the adventure</p>
        </div>

        <form>
          <div className="mb-3">
            <label htmlFor="email" className="form-label small">Email or Username</label>
            <input
              type="text"
              className="form-control"
              id="email"
              placeholder="Enter your email or username"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label small">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              placeholder="············"
            />
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="remember" />
              <label className="form-check-label small" htmlFor="remember">
                Remember Me
              </label>
            </div>
            <Link to="/forgot-password" className="small text-decoration-none" style={{ color: '#7367f0' }}>
              Forgot Password?
            </Link>
          </div>

          <button type="submit" className="btn w-100 mb-3" style={{ backgroundColor: '#7367f0', color: 'white' }}>
            Sign in
          </button>

          <p className="text-center text-muted small mb-3">
            New on our platform?{' '}
            <Link to="/register" className="text-decoration-none" style={{ color: '#7367f0' }}>
              Create an account
            </Link>
          </p>

          <div className="position-relative text-center mb-3">
            <hr className="my-3" />
            <span className="position-absolute top-50 start-50 translate-middle bg-white px-2 small text-muted">
              or
            </span>
          </div>

          <div className="d-grid gap-2">
            <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center">
              {/* <img src={googleIcon} alt="Google" style={{ width: '20px', marginRight: '8px' }} /> */}
              <span className="small">Sign in with Google</span>
            </button>
            <button type="button" className="btn btn-outline-secondary d-flex align-items-center justify-content-center">
              {/* <img src={facebookIcon} alt="Facebook" style={{ width: '20px', marginRight: '8px' }} /> */}
              <span className="small">Sign in with Facebook</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// export default SignInPage;