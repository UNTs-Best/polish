import { auth } from "express-oauth2-jwt-bearer";

// Protect endpoints with Auth0-issued JWTs
// Requires env: AUTH0_AUDIENCE, AUTH0_ISSUER_BASE_URL
const audience = process.env.AUTH0_AUDIENCE;
const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;

let checkJwt;
if (audience && issuerBaseURL) {
  checkJwt = auth({
    audience,
    issuerBaseURL,
    tokenSigningAlg: "RS256",
  });
} else {
  // Fallback pass-through middleware for local dev without Auth0 configuration
  console.warn(
    "Auth0 middleware not configured; set AUTH0_AUDIENCE and AUTH0_ISSUER_BASE_URL to enable JWT verification."
  );
  checkJwt = (req, _res, next) => {
    req.user = null;
    next();
  };
}

export { checkJwt };
export default checkJwt;


