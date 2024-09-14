## Unofficial Monarch Money API
![Monarch Image](/monarch-image-blue.svg)
This is an unofficial Javascript API for Monarch Money. It is not endorsed by Monarch Money and may break at any time. Use at your own risk.

## Installation

```bash
npm i monarch-money-api
```

## Configuration
You will need to create a user token, that you will save as an environment variable in order to use the API.

#### Create a token using the CLI: 

#### 1. Create a file named `login.js` and add the following code:


```javascript
import { interactiveLogin } from "monarch-money-api";

interactiveLogin();
```

Save.

#### 2. Run the script and enter your credentials:
Enter this in your teminal and press enter:
```bash
node login.js
```
You will be prompted to enter your email, password, and 2FA code if you have 2FA enabled.

#### 3. Save the token in your `.env` file:
After you have logged in, you will be given a token. Copy this token and add it to your `.env` file. (Create a `.env` file if you don't have one.)

```env
MONARCH_TOKEN=your_token_here
```

> [!TIP]
> If deploying to Vercel, you can add an environment variable in local and production environments with the vercel cli:
> ```bash
> vercel env add token
> ```

## Usage Example
```javascript
import { getAccounts, getBudgets } from "monarch-money-api";

const accounts = await getAccounts();
console.log("Accounts:", accounts);

const budgets = await getBudgets();
console.log("Budgets:", budgets)
```


## Vercel Example
You can deploy this to Vercel by creating a new project and adding the token as an environment variable. You can then use the API in your serverless functions.

If you want to use the API in a serverless function, you can create a new file in the `api/budget.js` directory and add the following code:

```javascript
import { getBudgets } from "monarch-money-api";

export default async function handler(req, res) {
    try {
        const budgets = await getBudgets();
        console.log("Budgets:", budgets)
        
        res.status(200).json(budgets);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
```

## API Methods

```js
interactiveLogin(useSavedSession = true, saveSession = true)

login(email, password, useSavedSession = true, saveSession = true, mfaSecretKey = null)

multiFactorAuthenticate(email, password, code)

getAccounts()

getAccountTypeOptions()

getRecentAccountBalances(startDate = null)

getAccountSnapshotsByType(startDate, timeframe)

getAggregateSnapshots(startDate = null, endDate = null, accountType = null)

createManualAccount(accountType, accountSubType, isInNetWorth, accountName, accountBalance = 0)

updateAccount(accountId, accountName = null, accountBalance = null, accountType = null,accountSubType = null, includeInNetWorth = null, hideFromSummaryList = null, hideTransactionsFromReports = null)

deleteAccount(accountId)

requestAccountsRefresh(accountIds)

isAccountsRefreshComplete(accountIds = null)

requestAccountsRefreshAndWait(accountIds = null, timeout = 300, delay = 10)

getAccountHoldings(accountId)

getAccountHistory(accountId)

getInstitutions()

getBudgets(startDate = null, endDate = null, useLegacyGoals = false, useV2Goals = true)

getSubscriptionDetails()

getTransactionsSummary()

getTransactions({ limit = 100, offset = 0, startDate = null, endDate = null, search = "",categoryIds = [], accountIds = [], tagIds = [], hasAttachments = null, hasNotes = null, hiddenFromReports = null, isSplit = null, isRecurring = null, importedFromMint = null, syncedFromInstitution = null })

createTransaction({ date, accountId, amount, merchantName, categoryId, notes = "", updateBalance = false })

deleteTransaction(transactionId)

getTransactionCategories()

deleteTransactionCategory(categoryId)

deleteTransactionCategories(categoryIds)

getTransactionCategoryGroups()

createTransactionCategory({ groupId, transactionCategoryName, rolloverStartMonth = new Dat(), icon = "\u2753", rolloverEnabled = false, rolloverType = "monthly" })

createTransactionTag(name, color)

getTransactionTags()

setTransactionTags(transactionId, tagIds)

getTransactionDetails(transactionId, redirectPosted = true)

getTransactionSplits(transactionId)

updateTransactionSplits(transactionId, splitData)
```

## Credits

This API is based on a lot of [Monarch Money](https://github.com/hammem/monarchmoney), a python library to access Monarch data.
