export const LIVE = process.env.REACT_APP_DEPLOYMENT_MODE === "live";
export const OPS = LIVE && window.location.hostname.toLowerCase() === "ops.hansonhome.us";
