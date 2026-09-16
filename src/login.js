import fetch from "node-fetch"
import { promisify } from "util"
import { RequireMFAException, LoginFailedException } from "./api.js"
import { MonarchMoneyEndpoints, ERRORS_KEY, ENV_TOKEN_KEY, ENV_COOKIE_KEY } from "./constants.js"
// import { getHeaders, setToken, saveSession } from "./session.js"
import { getHeaders, setToken } from "./session.js"
import readline from "readline"

export const createInterface = () =>
  readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

export const loginUser = async (email, password, mfaSecretKey) => {
  const data = new URLSearchParams({
    password,
    supports_mfa: true,
    trusted_device: false,
    username: email,
  })

  if (mfaSecretKey) {
    data.append("totp", generateOtp(mfaSecretKey)) // You need to implement generateOtp function if required
  }

  const response = await fetch(MonarchMoneyEndpoints.getLoginEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: data,
  })

  if (response.status !== 200) {
    const text = await response.text()
    // Monarch answers 403 both for "MFA required" and for its edge/bot protection ("You Shall Not Pass").
    if (response.status === 403 && /mfa|two.?factor|totp/i.test(text)) {
      throw new RequireMFAException("Multi-Factor Auth Required")
    }
    throw new LoginFailedException(
      `HTTP Code ${response.status}: ${text.slice(0, 200)}\n` +
        "Monarch now blocks scripted logins (bot protection / reCAPTCHA). " +
        "Log in at https://app.monarch.com in a browser and copy the token from localStorage instead (see README).",
    )
  }

  const json = await response.json()
  console.log(json.token)

  setToken(json.token)
}

export const multiFactorAuthenticate = async (email, password, code) => {
  const data = new URLSearchParams({
    password,
    supports_mfa: true,
    totp: code,
    trusted_device: false,
    username: email,
  })

  const response = await fetch(MonarchMoneyEndpoints.getLoginEndpoint(), {
    method: "POST",
    headers: getHeaders(),
    body: data,
  })

  if (response.status !== 200) {
    const text = await response.text()
    let errorMessage = text.slice(0, 200)
    try {
      const json = JSON.parse(text)
      if (json[ERRORS_KEY]) errorMessage = json[ERRORS_KEY]
    } catch {}
    throw new LoginFailedException(`HTTP Code ${response.status}: ${errorMessage}`)
  }

  const json = await response.json()
  console.log(json.token)
  setToken(json.token)
}

export const interactiveLogin = async (useSavedSession = true, saveSessionFlag = true) => {
  const rl = createInterface()
  const email = await promisify(rl.question).bind(rl)("Email: ")
  const passwd = await promisify(rl.question).bind(rl)("Password: ")
  rl.close()

  try {
    await loginUser(email, passwd)
  } catch (error) {
    if (error instanceof RequireMFAException) {
      const rl = createInterface()
      const twoFactorCode = await promisify(rl.question).bind(rl)("Two Factor Code: ")
      rl.close()
      await multiFactorAuthenticate(email, passwd, twoFactorCode)
      if (saveSessionFlag) {
        // saveSession()
      }
    } else {
      throw error
    }
  }
}

// interactiveLogin()
if (!process.env[ENV_TOKEN_KEY] && !process.env[ENV_COOKIE_KEY]) {
    console.error(`No environment variable with key "${ENV_TOKEN_KEY}" or "${ENV_COOKIE_KEY}" found.`)
    // throw new Error(`No environment variable with key "${ENV_TOKEN_KEY}" found.`)
    // interactiveLogin()
} else {
    // console.log(`Loaded token from environment variable ${ENV_TOKEN_KEY}. ` + process.env[ENV_TOKEN_KEY])
    // setToken(process.env.token)
}
