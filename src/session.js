// session.js
import fs from "fs"
import path from "path"
import { SESSION_FILE, ENV_TOKEN_KEY } from "./constants.js"

let headers = {
  "Client-Platform": "web",
}

// Try to load token from environment variable, rather than from session file.
if (process.env[ENV_TOKEN_KEY]) {
  headers["Authorization"] = `Token ${process.env[ENV_TOKEN_KEY]}`
  console.log("Loaded token from environment variable." + process.env[ENV_TOKEN_KEY])
}
let token = null

export const setToken = (newToken) => {
  token = newToken
  headers["Authorization"] = `Token ${newToken}`
  console.log("Set token to:", newToken)
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
