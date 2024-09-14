// constants.js
import path from 'path';
import { fileURLToPath } from 'url';

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const SESSION_DIR = path.resolve(__dirname, '../.mm');
export const SESSION_FILE = path.join(SESSION_DIR, "mm_session.json");

export const ENV_TOKEN_KEY = "MONARCH_TOKEN"
export const AUTH_HEADER_KEY = "Authorization";
export const CSRF_KEY = "csrftoken";
export const DEFAULT_RECORD_LIMIT = 100;
export const ERRORS_KEY = "error_code";
export const BASE_URL = "https://api.monarchmoney.com"
export const GQL_ENDPOINT = `${BASE_URL}/graphql`;

export const MonarchMoneyEndpoints = {

    getLoginEndpoint() {
        return `${BASE_URL}/auth/login/`;
    },

    getGraphQL() {
        return `${BASE_URL}/graphql`;
    },

    getAccountBalanceHistoryUploadEndpoint() {
        return `${BASE_URL}/account-balance-history/upload/`;
    }
};
