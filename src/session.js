// session.js
import fs from "fs"
import path from "path"
import { SESSION_FILE, ENV_TOKEN_KEY, ENV_COOKIE_KEY } from "./constants.js"

let headers = {
  "Client-Platform": "web",
}

// Auth option 1: legacy bearer token from MONARCH_TOKEN (ignored when MONARCH_COOKIE is set).
if (process.env[ENV_TOKEN_KEY] && !process.env[ENV_COOKIE_KEY]) {
  headers["Authorization"] = `Token ${process.env[ENV_TOKEN_KEY]}`
  console.log("Loaded token from environment variable.")
}

// Auth option 2: browser session cookie from MONARCH_COOKIE.
// Monarch's web app now authenticates with an HttpOnly session cookie + CSRF token instead of a
// bearer token, and scripted logins are blocked by bot protection. Copy the cookie header for
// api.monarch.com from a logged-in browser (DevTools → Application → Cookies), e.g.
//   MONARCH_COOKIE="sessionid=...; csrftoken=..."
export const setCookie = (cookie) => {
  headers["Cookie"] = cookie
  const csrf = cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1]
  if (csrf) headers["X-CSRFToken"] = csrf
  // Django's CSRF check on cookie-authenticated requests requires a matching Origin/Referer.
  headers["Origin"] = "https://app.monarch.com"
  headers["Referer"] = "https://app.monarch.com/"
}
if (process.env[ENV_COOKIE_KEY]) {
  setCookie(process.env[ENV_COOKIE_KEY])
  console.log("Loaded session cookie from environment variable.")
}

export const isAuthenticated = () => Boolean(headers["Authorization"] || headers["Cookie"])
let token = null

export const setToken = (newToken) => {
  token = newToken
  headers["Authorization"] = `Token ${newToken}`
}

// export const saveSession = (filename = SESSION_FILE) => {
//   filename = path.resolve(filename)
//   const sessionData = { token }
//   fs.mkdirSync(path.dirname(filename), { recursive: true })
//   fs.writeFileSync(filename, JSON.stringify(sessionData))
// }

// export const loadSession = (filename = SESSION_FILE) => {
//   const data = JSON.parse(fs.readFileSync(filename, "utf-8"))
//   // console.log("Loaded session:", data);
//   // setToken(data[ENV_TOKEN_KEY])
//   setToken(process.env[ENV_TOKEN_KEY])
// }

// export const deleteSession = (filename = SESSION_FILE) => {
//   if (fs.existsSync(filename)) {
//     fs.unlinkSync(filename)
//   }
// }

// export const sessionExists = (filename = SESSION_FILE) => {
//   return fs.existsSync(filename)
// }

export const getHeaders = () => headers
export const getToken = () => token
