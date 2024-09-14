// api.js
import { GraphQLClient, gql } from "graphql-request"
import { getHeaders } from "./session.js"
import { AUTH_HEADER_KEY, MonarchMoneyEndpoints, GQL_ENDPOINT } from "./constants.js"
import FormData from "form-data"

const timeout = 10

// Custom Exceptions
export class RequireMFAException extends Error {}
export class LoginFailedException extends Error {}
export class RequestFailedException extends Error {}

const getGraphQLClient = () => {
  const headers = getHeaders()
  // console.log(headers);
  if (!headers[AUTH_HEADER_KEY]) {
    throw new LoginFailedException("Make sure you call login() first or provide a session token!")
  }
  return new GraphQLClient(GQL_ENDPOINT, {
    headers,
    timeout: timeout * 1000,
  })
}

const gqlCall = async (operation, graphqlQuery, variables = {}) => {
  const client = getGraphQLClient()
  // console.log("Operation:", client)
  
  return await client.request(graphqlQuery, variables)
}

export const getAccounts = async () => {
  const query = gql`
    query GetAccounts {
      accounts {
        ...AccountFields
        __typename
      }
      householdPreferences {
        id
        accountGroupOrder
        __typename
      }
    }
    fragment AccountFields on Account {
      id
      displayName
      syncDisabled
      deactivatedAt
      isHidden
      isAsset
      mask
      createdAt
      updatedAt
      displayLastUpdatedAt
      currentBalance
      displayBalance
      includeInNetWorth
      hideFromList
      hideTransactionsFromReports
      includeBalanceInNetWorth
      includeInGoalBalance
      dataProvider
      dataProviderAccountId
      isManual
      transactionsCount
      holdingsCount
      manualInvestmentsTrackingMethod
      order
      logoUrl
      type {
        name
        display
        __typename
      }
      subtype {
        name
        display
        __typename
      }
      credential {
        id
        updateRequired
        disconnectedFromDataProviderAt
        dataProvider
        institution {
          id
          plaidInstitutionId
          name
          status
          __typename
        }
        __typename
      }
      institution {
        id
        name
        primaryColor
        url
        __typename
      }
      __typename
    }
  `
  return await gqlCall("GetAccounts", query)
}

export async function getAccountTypeOptions() {
  const query = gql`
    query GetAccountTypeOptions {
      accountTypeOptions {
        type {
          name
          display
          group
          possibleSubtypes {
            display
            name
            __typename
          }
          __typename
        }
        subtype {
          name
          display
          __typename
        }
        __typename
      }
    }
  `
  return await gqlCall("GetAccountTypeOptions", query)
}

export async function getRecentAccountBalances(startDate = null) {
  if (!startDate) {
    const date = new Date()
    date.setDate(date.getDate() - 31)
    startDate = date.toISOString().split("T")[0]
  }

  const query = gql`
    query GetAccountRecentBalances($startDate: Date!) {
      accounts {
        id
        recentBalances(startDate: $startDate)
        __typename
      }
    }
  `

  return await gqlCall("GetAccountRecentBalances", query, { startDate })
}

export async function getAccountHoldings(accountId) {
  const query = gql`
    query Web_GetHoldings($input: PortfolioInput) {
      portfolio(input: $input) {
        aggregateHoldings {
          edges {
            node {
              id
              quantity
              basis
              totalValue
              securityPriceChangeDollars
              securityPriceChangePercent
              lastSyncedAt
              holdings {
                id
                type
                typeDisplay
                name
                ticker
                closingPrice
                isManual
                closingPriceUpdatedAt
                __typename
              }
              security {
                id
                name
                type
                ticker
                typeDisplay
                currentPrice
                currentPriceUpdatedAt
                closingPrice
                closingPriceUpdatedAt
                oneDayChangePercent
                oneDayChangeDollars
                __typename
              }
              __typename
            }
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `

  const variables = {
    input: {
      accountIds: [accountId],
      endDate: new Date().toISOString().split("T")[0],
      includeHiddenHoldings: true,
      startDate: new Date().toISOString().split("T")[0],
    },
  }

  return await gqlCall("Web_GetHoldings", query, variables)
}

export async function getAccountHistory(accountId) {
  const query = gql`
    query AccountDetails_getAccount($id: UUID!, $filters: TransactionFilterInput) {
      account(id: $id) {
        id
        ...AccountFields
        ...EditAccountFormFields
        isLiability
        credential {
          id
          hasSyncInProgress
          canBeForceRefreshed
          disconnectedFromDataProviderAt
          dataProvider
          institution {
            id
            plaidInstitutionId
            url
            ...InstitutionStatusFields
            __typename
          }
          __typename
        }
        institution {
          id
          plaidInstitutionId
          url
          ...InstitutionStatusFields
          __typename
        }
        __typename
      }
      transactions: allTransactions(filters: $filters) {
        totalCount
        results(limit: 20) {
          id
          ...TransactionsListFields
          __typename
        }
        __typename
      }
      snapshots: snapshotsForAccount(accountId: $id) {
        date
        signedBalance
        __typename
      }
    }

    fragment AccountFields on Account {
      id
      displayName
      syncDisabled
      deactivatedAt
      isHidden
      isAsset
      mask
      createdAt
      updatedAt
      displayLastUpdatedAt
      currentBalance
      displayBalance
      includeInNetWorth
      hideFromList
      hideTransactionsFromReports
      includeBalanceInNetWorth
      includeInGoalBalance
      dataProvider
      dataProviderAccountId
      isManual
      transactionsCount
      holdingsCount
      manualInvestmentsTrackingMethod
      order
      logoUrl
      type {
        name
        display
        group
        __typename
      }
      subtype {
        name
        display
        __typename
      }
      credential {
        id
        updateRequired
        disconnectedFromDataProviderAt
        dataProvider
        institution {
          id
          plaidInstitutionId
          name
          status
          __typename
        }
        __typename
      }
      institution {
        id
        name
        primaryColor
        url
        __typename
      }
      __typename
    }

    fragment EditAccountFormFields on Account {
      id
      displayName
      deactivatedAt
      displayBalance
      includeInNetWorth
      hideFromList
      hideTransactionsFromReports
      dataProvider
      dataProviderAccountId
      isManual
      manualInvestmentsTrackingMethod
      isAsset
      invertSyncedBalance
      canInvertBalance
      type {
        name
        display
        __typename
      }
      subtype {
        name
        display
        __typename
      }
      __typename
    }

    fragment InstitutionStatusFields on Institution {
      id
      hasIssuesReported
      hasIssuesReportedMessage
      plaidStatus
      status
      balanceStatus
      transactionsStatus
      __typename
    }

    fragment TransactionsListFields on Transaction {
      id
      ...TransactionOverviewFields
      __typename
    }

    fragment TransactionOverviewFields on Transaction {
      id
      amount
      pending
      date
      hideFromReports
      plaidName
      notes
      isRecurring
      reviewStatus
      needsReview
      dataProviderDescription
      attachments {
        id
        __typename
      }
      isSplitTransaction
      category {
        id
        name
        group {
          id
          type
          __typename
        }
        __typename
      }
      merchant {
        name
        id
        transactionsCount
        __typename
      }
      tags {
        id
        name
        color
        order
        __typename
      }
      __typename
    }
  `

  const variables = { id: accountId }

  const accountDetails = await gqlCall("AccountDetails_getAccount", query, variables)

  const accountName = accountDetails.account.displayName
  const accountBalanceHistory = accountDetails.snapshots

  accountBalanceHistory.forEach((i) => {
    i.accountId = accountId
    i.accountName = accountName
  })

  return accountBalanceHistory
}

export async function getSubscriptionDetails() {
  const query = gql`
    query GetSubscriptionDetails {
      subscription {
        id
        paymentSource
        referralCode
        isOnFreeTrial
        hasPremiumEntitlement
        __typename
      }
    }
  `
  return await gqlCall("GetSubscriptionDetails", query)
}

export async function getInstitutions() {
  const query = gql`
    query Web_GetInstitutionSettings {
      credentials {
        id
        ...CredentialSettingsCardFields
        __typename
      }
      accounts(filters: { includeDeleted: true }) {
        id
        displayName
        subtype {
          display
          __typename
        }
        mask
        credential {
          id
          __typename
        }
        deletedAt
        __typename
      }
      subscription {
        isOnFreeTrial
        hasPremiumEntitlement
        __typename
      }
    }

    fragment CredentialSettingsCardFields on Credential {
      id
      updateRequired
      disconnectedFromDataProviderAt
      ...InstitutionInfoFields
      institution {
        id
        name
        url
        __typename
      }
      __typename
    }

    fragment InstitutionInfoFields on Credential {
      id
      displayLastUpdatedAt
      dataProvider
      updateRequired
      disconnectedFromDataProviderAt
      ...InstitutionLogoWithStatusFields
      institution {
        id
        name
        hasIssuesReported
        hasIssuesReportedMessage
        __typename
      }
      __typename
    }

    fragment InstitutionLogoWithStatusFields on Credential {
      dataProvider
      updateRequired
      institution {
        hasIssuesReported
        status
        balanceStatus
        transactionsStatus
        __typename
      }
      __typename
    }
  `
  return await gqlCall("Web_GetInstitutionSettings", query)
}

export async function getAccountSnapshotsByType(startDate, timeframe) {
  if (!["year", "month"].includes(timeframe)) {
    throw new Error(`Unknown timeframe "${timeframe}"`)
  }

  const query = gql`
    query GetSnapshotsByAccountType($startDate: Date!, $timeframe: Timeframe!) {
      snapshotsByAccountType(startDate: $startDate, timeframe: $timeframe) {
        accountType
        month
        balance
        __typename
      }
      accountTypes {
        name
        group
        __typename
      }
    }
  `

  return await gqlCall("GetSnapshotsByAccountType", query, { startDate, timeframe })
}

export async function getAggregateSnapshots(startDate = null, endDate = null, accountType = null) {
  const query = gql`
    query GetAggregateSnapshots($filters: AggregateSnapshotFilters) {
      aggregateSnapshots(filters: $filters) {
        date
        balance
        __typename
      }
    }
  `

  if (!startDate) {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 150)
    startDate = `${date.getFullYear()}-${date.getMonth() + 1}-01`
  }

  return await gqlCall("GetAggregateSnapshots", query, {
    filters: {
      startDate,
      endDate,
      accountType,
    },
  })
}

// The new function to get budgets
export const getBudgets = async (startDate = null, endDate = null, useLegacyGoals = false, useV2Goals = true) => {
  const query = gql`
    query GetJointPlanningData($startDate: Date!, $endDate: Date!, $useLegacyGoals: Boolean!, $useV2Goals: Boolean!) {
      budgetData(startMonth: $startDate, endMonth: $endDate) {
        monthlyAmountsByCategory {
          category {
            id
            name
            __typename
          }
          monthlyAmounts {
            month
            plannedCashFlowAmount
            plannedSetAsideAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            rolloverType
            __typename
          }
          __typename
        }
        monthlyAmountsByCategoryGroup {
          categoryGroup {
            id
            name
            __typename
          }
          monthlyAmounts {
            month
            plannedCashFlowAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            rolloverType
            __typename
          }
          __typename
        }
        monthlyAmountsForFlexExpense {
          budgetVariability
          monthlyAmounts {
            month
            plannedCashFlowAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            rolloverType
            __typename
          }
          __typename
        }
        totalsByMonth {
          month
          totalIncome {
            plannedAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            __typename
          }
          totalExpenses {
            plannedAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            __typename
          }
          totalFixedExpenses {
            plannedAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            __typename
          }
          totalNonMonthlyExpenses {
            plannedAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            __typename
          }
          totalFlexibleExpenses {
            plannedAmount
            actualAmount
            remainingAmount
            previousMonthRolloverAmount
            __typename
          }
          __typename
        }
        __typename
      }
      categoryGroups {
        id
        name
        order
        groupLevelBudgetingEnabled
        budgetVariability
        rolloverPeriod {
          id
          startMonth
          endMonth
          __typename
        }
        categories {
          id
          name
          order
          budgetVariability
          rolloverPeriod {
            id
            startMonth
            endMonth
            __typename
          }
          __typename
        }
        type
        __typename
      }
      goals @include(if: $useLegacyGoals) {
        id
        name
        completedAt
        targetDate
        __typename
      }
      goalMonthlyContributions(startDate: $startDate, endDate: $endDate) @include(if: $useLegacyGoals) {
        month: monthlyContribution
        startDate
        goalId
        __typename
      }
      goalPlannedContributions(startDate: $startDate, endDate: $endDate) @include(if: $useLegacyGoals) {
        id
        amount
        startDate
        goal {
          id
          __typename
        }
        __typename
      }
      goalsV2 @include(if: $useV2Goals) {
        id
        name
        archivedAt
        completedAt
        priority
        imageStorageProvider
        imageStorageProviderId
        plannedContributions(startMonth: $startDate, endMonth: $endDate) {
          id
          month
          amount
          __typename
        }
        monthlyContributionSummaries(startMonth: $startDate, endMonth: $endDate) {
          month
          sum
          __typename
        }
        __typename
      }
      budgetSystem
    }
  `

  const variables = {
    startDate,
    endDate,
    useLegacyGoals,
    useV2Goals,
  }

  if (!startDate && !endDate) {
    const today = new Date()

    // Get the first day of last month
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    variables.startDate = lastMonthDate.toISOString().split("T")[0]

    // Get the last day of next month
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 2, 0)
    variables.endDate = nextMonthDate.toISOString().split("T")[0]
  } else if (!startDate || !endDate) {
    throw new Error("You must specify both a startDate and endDate, not just one of them.")
  }

  return await gqlCall("GetJointPlanningData", query, variables)
}

export async function getTransactions({
  limit = 100,
  offset = 0,
  startDate = null,
  endDate = null,
  search = "",
  categoryIds = [],
  accountIds = [],
  tagIds = [],
  hasAttachments = null,
  hasNotes = null,
  hiddenFromReports = null,
  isSplit = null,
  isRecurring = null,
  importedFromMint = null,
  syncedFromInstitution = null,
}) {
  const query = gql`
    query GetTransactionsList($offset: Int, $limit: Int, $filters: TransactionFilterInput, $orderBy: TransactionOrdering) {
      allTransactions(filters: $filters) {
        totalCount
        results(offset: $offset, limit: $limit, orderBy: $orderBy) {
          id
          ...TransactionOverviewFields
          __typename
        }
        __typename
      }
      transactionRules {
        id
        __typename
      }
    }

    fragment TransactionOverviewFields on Transaction {
      id
      amount
      pending
      date
      hideFromReports
      plaidName
      notes
      isRecurring
      reviewStatus
      needsReview
      attachments {
        id
        extension
        filename
        originalAssetUrl
        publicId
        sizeBytes
        __typename
      }
      isSplitTransaction
      createdAt
      updatedAt
      category {
        id
        name
        __typename
      }
      merchant {
        name
        id
        transactionsCount
        __typename
      }
      account {
        id
        displayName
        __typename
      }
      tags {
        id
        name
        color
        order
        __typename
      }
      __typename
    }
  `

  const variables = {
    offset,
    limit,
    orderBy: "date",
    filters: {
      search,
      categories: categoryIds,
      accounts: accountIds,
      tags: tagIds,
    },
  }

  if (hasAttachments !== null) variables.filters.hasAttachments = hasAttachments
  if (hasNotes !== null) variables.filters.hasNotes = hasNotes
  if (hiddenFromReports !== null) variables.filters.hideFromReports = hiddenFromReports
  if (isRecurring !== null) variables.filters.isRecurring = isRecurring
  if (isSplit !== null) variables.filters.isSplit = isSplit
  if (importedFromMint !== null) variables.filters.importedFromMint = importedFromMint
  if (syncedFromInstitution !== null) variables.filters.syncedFromInstitution = syncedFromInstitution
  if (startDate && endDate) {
    variables.filters.startDate = startDate
    variables.filters.endDate = endDate
  } else if (startDate || endDate) {
    throw new Error("You must specify both a startDate and endDate, not just one of them.")
  }

  return await gqlCall("GetTransactionsList", query, variables)
}

export async function getTransactionsSummary() {
  const query = gql`
    query GetTransactionsPage($filters: TransactionFilterInput) {
      aggregates(filters: $filters) {
        summary {
          ...TransactionsSummaryFields
          __typename
        }
        __typename
      }
    }

    fragment TransactionsSummaryFields on TransactionsSummary {
      avg
      count
      max
      maxExpense
      sum
      sumIncome
      sumExpense
      first
      last
      __typename
    }
  `
  return await gqlCall("GetTransactionsPage", query)
}

export async function getRecurringTransactions(startDate = null, endDate = null) {
  const query = gql`
    query Web_GetUpcomingRecurringTransactionItems($startDate: Date!, $endDate: Date!, $filters: RecurringTransactionFilter) {
      recurringTransactionItems(startDate: $startDate, endDate: $endDate, filters: $filters) {
        stream {
          id
          frequency
          amount
          isApproximate
          merchant {
            id
            name
            logoUrl
            __typename
          }
          __typename
        }
        date
        isPast
        transactionId
        amount
        amountDiff
        category {
          id
          name
          __typename
        }
        account {
          id
          displayName
          logoUrl
          __typename
        }
        __typename
      }
    }
  `

  const variables = { startDate, endDate }

  if ((startDate === null) !== (endDate === null)) {
    throw new Error("You must specify both a startDate and endDate, not just one of them.")
  } else if (startDate === null && endDate === null) {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    variables.startDate = startOfMonth.toISOString().split("T")[0]
    variables.endDate = endOfMonth.toISOString().split("T")[0]
  }

  return await gqlCall("Web_GetUpcomingRecurringTransactionItems", query, variables)
}

// The new function to get transaction categories
export const getTransactionCategories = async () => {
  const query = gql`
    query GetCategories {
      categories {
        ...CategoryFields
        __typename
      }
    }

    fragment CategoryFields on Category {
      id
      order
      name
      systemCategory
      isSystemCategory
      isDisabled
      updatedAt
      createdAt
      group {
        id
        name
        type
        __typename
      }
      __typename
    }
  `
  return await gqlCall("GetCategories", query)
}

export async function getTransactionCategoryGroups() {
  const query = gql`
    query ManageGetCategoryGroups {
      categoryGroups {
        id
        name
        order
        type
        updatedAt
        createdAt
        __typename
      }
    }
  `
  return await gqlCall("ManageGetCategoryGroups", query)
}

export async function getTransactionTags() {
  const query = gql`
    query GetHouseholdTransactionTags($search: String, $limit: Int, $bulkParams: BulkTransactionDataParams) {
      householdTransactionTags(search: $search, limit: $limit, bulkParams: $bulkParams) {
        id
        name
        color
        order
        transactionCount
        __typename
      }
    }
  `
  return await gqlCall("GetHouseholdTransactionTags", query)
}

export async function getTransactionDetails(transactionId, redirectPosted = true) {
  const query = gql`
    query GetTransactionDrawer($id: UUID!, $redirectPosted: Boolean) {
      getTransaction(id: $id, redirectPosted: $redirectPosted) {
        id
        amount
        pending
        isRecurring
        date
        originalDate
        hideFromReports
        needsReview
        reviewedAt
        reviewedByUser {
          id
          name
          __typename
        }
        plaidName
        notes
        hasSplitTransactions
        isSplitTransaction
        isManual
        splitTransactions {
          id
          ...TransactionDrawerSplitMessageFields
          __typename
        }
        originalTransaction {
          id
          ...OriginalTransactionFields
          __typename
        }
        attachments {
          id
          publicId
          extension
          sizeBytes
          filename
          originalAssetUrl
          __typename
        }
        account {
          id
          ...TransactionDrawerAccountSectionFields
          __typename
        }
        category {
          id
          __typename
        }
        goal {
          id
          __typename
        }
        merchant {
          id
          name
          transactionCount
          logoUrl
          recurringTransactionStream {
            id
            __typename
          }
          __typename
        }
        tags {
          id
          name
          color
          order
          __typename
        }
        needsReviewByUser {
          id
          __typename
        }
        __typename
      }
      myHousehold {
        users {
          id
          name
          __typename
        }
        __typename
      }
    }

    fragment TransactionDrawerSplitMessageFields on Transaction {
      id
      amount
      merchant {
        id
        name
        __typename
      }
      category {
        id
        name
        __typename
      }
      __typename
    }

    fragment OriginalTransactionFields on Transaction {
      id
      date
      amount
      merchant {
        id
        name
        __typename
      }
      __typename
    }

    fragment TransactionDrawerAccountSectionFields on Account {
      id
      displayName
      logoUrl
      id
      mask
      subtype {
        display
        __typename
      }
      __typename
    }
  `

  const variables = {
    id: transactionId,
    redirectPosted,
  }

  return await gqlCall("GetTransactionDrawer", variables, query)
}

export async function getTransactionSplits(transactionId) {
  const query = gql`
    query TransactionSplitQuery($id: UUID!) {
      getTransaction(id: $id) {
        id
        amount
        category {
          id
          name
          __typename
        }
        merchant {
          id
          name
          __typename
        }
        splitTransactions {
          id
          merchant {
            id
            name
            __typename
          }
          category {
            id
            name
            __typename
          }
          amount
          notes
          __typename
        }
        __typename
      }
    }
  `

  const variables = { id: transactionId }

  return await gqlCall("TransactionSplitQuery", query, variables)
}

export async function getCashflow({ limit = 100, startDate = null, endDate = null }) {
  const query = gql`
    query Web_GetCashFlowPage($filters: TransactionFilterInput) {
      byCategory: aggregates(filters: $filters, groupBy: ["category"]) {
        groupBy {
          category {
            id
            name
            group {
              id
              type
              __typename
            }
            __typename
          }
          __typename
        }
        summary {
          sum
          __typename
        }
        __typename
      }
      byCategoryGroup: aggregates(filters: $filters, groupBy: ["categoryGroup"]) {
        groupBy {
          categoryGroup {
            id
            name
            type
            __typename
          }
          __typename
        }
        summary {
          sum
          __typename
        }
        __typename
      }
      byMerchant: aggregates(filters: $filters, groupBy: ["merchant"]) {
        groupBy {
          merchant {
            id
            name
            logoUrl
            __typename
          }
          __typename
        }
        summary {
          sumIncome
          sumExpense
          __typename
        }
        __typename
      }
      summary: aggregates(filters: $filters, fillEmptyValues: true) {
        summary {
          sumIncome
          sumExpense
          savings
          savingsRate
          __typename
        }
        __typename
      }
    }
  `

  const variables = {
    limit,
    orderBy: "date",
    filters: {
      search: "",
      categories: [],
      accounts: [],
      tags: [],
    },
  }

  if (startDate && endDate) {
    variables.filters.startDate = startDate
    variables.filters.endDate = endDate
  } else if (startDate || endDate) {
    throw new Error("You must specify both a startDate and endDate, not just one of them.")
  } else {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    variables.filters.startDate = startOfMonth.toISOString().split("T")[0]
    variables.filters.endDate = endOfMonth.toISOString().split("T")[0]
  }

  return await gqlCall("Web_GetCashFlowPage", query, variables)
}

export async function getCashflowSummary({ limit = 100, startDate = null, endDate = null }) {
  const query = gql`
    query Web_GetCashFlowPage($filters: TransactionFilterInput) {
      summary: aggregates(filters: $filters, fillEmptyValues: true) {
        summary {
          sumIncome
          sumExpense
          savings
          savingsRate
          __typename
        }
        __typename
      }
    }
  `

  const variables = {
    limit,
    orderBy: "date",
    filters: {
      search: "",
      categories: [],
      accounts: [],
      tags: [],
    },
  }

  if (startDate && endDate) {
    variables.filters.startDate = startDate
    variables.filters.endDate = endDate
  } else if (startDate || endDate) {
    throw new Error("You must specify both a startDate and endDate, not just one of them.")
  } else {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    variables.filters.startDate = startOfMonth.toISOString().split("T")[0]
    variables.filters.endDate = endOfMonth.toISOString().split("T")[0]
  }

  return await gqlCall("Web_GetCashFlowPage", query, variables)
}

///////////////////////////////////
// Mutation functions start here //
//////////////////////////////////
export async function deleteTransactionCategory(categoryId) {
  const query = gql`
    mutation Web_DeleteCategory($id: UUID!, $moveToCategoryId: UUID) {
      deleteCategory(id: $id, moveToCategoryId: $moveToCategoryId) {
        errors {
          ...PayloadErrorFields
          __typename
        }
        deleted
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    id: categoryId,
  }

  const response = await gqlCall("Web_DeleteCategory", query, variables)

  if (!response.deleteCategory.deleted) {
    throw new RequestFailedException(response.deleteCategory.errors)
  }

  return true
}

export async function deleteTransactionCategories(categoryIds) {
  return await Promise.all(categoryIds.map((id) => this.deleteTransactionCategory(id).catch((e) => e)))
}

export async function createTransactionCategory({
  groupId,
  transactionCategoryName,
  rolloverStartMonth = new Date(),
  icon = "\u2753",
  rolloverEnabled = false,
  rolloverType = "monthly",
}) {
  const query = gql`
    mutation Web_CreateCategory($input: CreateCategoryInput!) {
      createCategory(input: $input) {
        errors {
          ...PayloadErrorFields
          __typename
        }
        category {
          id
          ...CategoryFormFields
          __typename
        }
        __typename
      }
    }
    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
    fragment CategoryFormFields on Category {
      id
      order
      name
      systemCategory
      systemCategoryDisplayName
      budgetVariability
      isSystemCategory
      isDisabled
      group {
        id
        type
        groupLevelBudgetingEnabled
        __typename
      }
      rolloverPeriod {
        id
        startMonth
        startingBalance
        __typename
      }
      __typename
    }
  `
  const variables = {
    input: {
      group: groupId,
      name: transactionCategoryName,
      icon,
      rolloverEnabled,
      rolloverType,
      rolloverStartMonth: rolloverStartMonth.toISOString().split("T")[0],
    },
  }

  return await gqlCall("Web_CreateCategory", query, variables)
}

export async function createTransactionTag(name, color) {
  const mutation = gql`
    mutation Common_CreateTransactionTag($input: CreateTransactionTagInput!) {
      createTransactionTag(input: $input) {
        tag {
          id
          name
          color
          order
          transactionCount
          __typename
        }
        errors {
          message
          __typename
        }
        __typename
      }
    }
  `
  const variables = { input: { name, color } }

  return await gqlCall("Common_CreateTransactionTag", mutation, variables)
}

export async function setTransactionTags(transactionId, tagIds) {
  const query = gql`
    mutation Web_SetTransactionTags($input: SetTransactionTagsInput!) {
      setTransactionTags(input: $input) {
        errors {
          ...PayloadErrorFields
          __typename
        }
        transaction {
          id
          tags {
            id
            __typename
          }
          __typename
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: { transactionId, tagIds },
  }

  return await gqlCall("Web_SetTransactionTags", query, variables)
}

export async function updateTransactionSplits(transactionId, splitData) {
  const query = gql`
    mutation Common_SplitTransactionMutation($input: UpdateTransactionSplitMutationInput!) {
      updateTransactionSplit(input: $input) {
        errors {
          ...PayloadErrorFields
          __typename
        }
        transaction {
          id
          hasSplitTransactions
          splitTransactions {
            id
            merchant {
              id
              name
              __typename
            }
            category {
              id
              name
              __typename
            }
            amount
            notes
            __typename
          }
          __typename
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      transactionId,
      splitData: splitData || [],
    },
  }

  return await gqlCall("Common_SplitTransactionMutation", query, variables)
}

export async function updateTransaction({
  transactionId,
  categoryId = null,
  merchantName = null,
  goalId = null,
  amount = null,
  date = null,
  hideFromReports = null,
  needsReview = null,
  notes = null,
}) {
  const query = gql`
    mutation Web_TransactionDrawerUpdateTransaction($input: UpdateTransactionMutationInput!) {
      updateTransaction(input: $input) {
        transaction {
          id
          amount
          pending
          date
          hideFromReports
          needsReview
          reviewedAt
          reviewedByUser {
            id
            name
            __typename
          }
          plaidName
          notes
          isRecurring
          category {
            id
            __typename
          }
          goal {
            id
            __typename
          }
          merchant {
            id
            name
            __typename
          }
          __typename
        }
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      id: transactionId,
    },
  }

  if (categoryId) variables.input.category = categoryId
  if (merchantName) variables.input.name = merchantName
  if (amount !== null) variables.input.amount = amount
  if (date) variables.input.date = date
  if (hideFromReports !== null) variables.input.hideFromReports = Boolean(hideFromReports)
  if (needsReview !== null) variables.input.needsReview = Boolean(needsReview)
  if (goalId !== null) variables.input.goalId = goalId
  if (notes !== null) variables.input.notes = notes

  return await gqlCall("Web_TransactionDrawerUpdateTransaction", query, variables)
}

export async function setBudgetAmount({
  amount,
  categoryId = null,
  categoryGroupId = null,
  timeframe = "month",
  startDate = null,
  applyToFuture = false,
}) {
  if ((categoryId === null) === (categoryGroupId === null)) {
    throw new Error("You must specify either a categoryId OR categoryGroupId; not both")
  }

  const query = gql`
    mutation Common_UpdateBudgetItem($input: UpdateOrCreateBudgetItemMutationInput!) {
      updateOrCreateBudgetItem(input: $input) {
        budgetItem {
          id
          budgetAmount
          __typename
        }
        __typename
      }
    }
  `

  const variables = {
    input: {
      amount,
      timeframe,
      categoryId,
      categoryGroupId,
      applyToFuture,
      startDate: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    },
  }

  return await gqlCall("Common_UpdateBudgetItem", query, variables)
}

export async function deleteTransaction(transactionId) {
  const query = gql`
    mutation Common_DeleteTransactionMutation($input: DeleteTransactionMutationInput!) {
      deleteTransaction(input: $input) {
        deleted
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      transactionId,
    },
  }

  const response = await gqlCall("Common_DeleteTransactionMutation", query, variables)

  if (!response.deleteTransaction.deleted) {
    throw new RequestFailedException(response.deleteTransaction.errors)
  }

  return true
}

export async function createTransaction({ date, accountId, amount, merchantName, categoryId, notes = "", updateBalance = false }) {
  const query = gql`
    mutation Common_CreateTransactionMutation($input: CreateTransactionMutationInput!) {
      createTransaction(input: $input) {
        errors {
          ...PayloadErrorFields
          __typename
        }
        transaction {
          id
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      date,
      accountId,
      amount: Math.round(amount * 100) / 100,
      merchantName,
      categoryId,
      notes,
      shouldUpdateBalance: updateBalance,
    },
  }

  return await gqlCall("Common_CreateTransactionMutation", query, variables)
}

export async function uploadAccountBalanceHistory(accountId, csvContent) {
  if (!accountId || !csvContent) {
    throw new RequestFailedException("accountId and csvContent cannot be empty")
  }

  const form = new FormData()
  form.append("files", csvContent, { filename: "upload.csv", contentType: "text/csv" })
  form.append("account_files_mapping", JSON.stringify({ "upload.csv": accountId }))

  const response = await axios.post(MonarchMoneyEndpoints.getAccountBalanceHistoryUploadEndpoint(), form, {
    headers: {
      ...this._headers,
      ...form.getHeaders(),
    },
  })

  if (response.status !== 200) {
    throw new RequestFailedException(`HTTP Code ${response.status}: ${response.statusText}`)
  }
}

export async function createManualAccount(accountType, accountSubType, isInNetWorth, accountName, accountBalance = 0) {
  const query = gql`
    mutation Web_CreateManualAccount($input: CreateManualAccountMutationInput!) {
      createManualAccount(input: $input) {
        account {
          id
          __typename
        }
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }
    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      type: accountType,
      subtype: accountSubType,
      includeInNetWorth: isInNetWorth,
      name: accountName,
      displayBalance: accountBalance,
    },
  }

  return await gqlCall("Web_CreateManualAccount", query, variables)
}

export async function updateAccount(
  accountId,
  accountName = null,
  accountBalance = null,
  accountType = null,
  accountSubType = null,
  includeInNetWorth = null,
  hideFromSummaryList = null,
  hideTransactionsFromReports = null
) {
  const query = gql`
    mutation Common_UpdateAccount($input: UpdateAccountMutationInput!) {
      updateAccount(input: $input) {
        account {
          ...AccountFields
          __typename
        }
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }

    fragment AccountFields on Account {
      id
      displayName
      syncDisabled
      deactivatedAt
      isHidden
      isAsset
      mask
      createdAt
      updatedAt
      displayLastUpdatedAt
      currentBalance
      displayBalance
      includeInNetWorth
      hideFromList
      hideTransactionsFromReports
      includeBalanceInNetWorth
      includeInGoalBalance
      dataProvider
      dataProviderAccountId
      isManual
      transactionsCount
      holdingsCount
      manualInvestmentsTrackingMethod
      order
      icon
      logoUrl
      deactivatedAt
      type {
        name
        display
        group
        __typename
      }
      subtype {
        name
        display
        __typename
      }
      credential {
        id
        updateRequired
        disconnectedFromDataProviderAt
        dataProvider
        institution {
          id
          plaidInstitutionId
          name
          status
          __typename
        }
        __typename
      }
      institution {
        id
        name
        primaryColor
        url
        __typename
      }
      __typename
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    id: accountId,
  }

  if (accountType) variables.type = accountType
  if (accountSubType) variables.subtype = accountSubType
  if (includeInNetWorth !== null) variables.includeInNetWorth = includeInNetWorth
  if (hideFromSummaryList !== null) variables.hideFromList = hideFromSummaryList
  if (hideTransactionsFromReports !== null) variables.hideTransactionsFromReports = hideTransactionsFromReports
  if (accountName) variables.name = accountName
  if (accountBalance !== null) variables.displayBalance = accountBalance

  return await gqlCall("Common_UpdateAccount", query, { input: variables })
}

export async function deleteAccount(accountId) {
  const query = gql`
    mutation Common_DeleteAccount($id: UUID!) {
      deleteAccount(id: $id) {
        deleted
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }
    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = { id: accountId }

  return await gqlCall("Common_DeleteAccount", query, variables)
}

export async function requestAccountsRefresh(accountIds) {
  const query = gql`
    mutation Common_ForceRefreshAccountsMutation($input: ForceRefreshAccountsInput!) {
      forceRefreshAccounts(input: $input) {
        success
        errors {
          ...PayloadErrorFields
          __typename
        }
        __typename
      }
    }

    fragment PayloadErrorFields on PayloadError {
      fieldErrors {
        field
        messages
        __typename
      }
      message
      code
      __typename
    }
  `

  const variables = {
    input: {
      accountIds,
    },
  }

  const response = await gqlCall("Common_ForceRefreshAccountsMutation", query, variables)

  if (!response.forceRefreshAccounts.success) {
    throw new RequestFailedException(response.forceRefreshAccounts.errors)
  }

  return true
}

export async function isAccountsRefreshComplete(accountIds = null) {
  const query = gql`
    query ForceRefreshAccountsQuery {
      accounts {
        id
        hasSyncInProgress
        __typename
      }
    }
  `

  const response = await gqlCall("ForceRefreshAccountsQuery", query)

  if (!response.accounts) {
    throw new RequestFailedException("Unable to request status of refresh")
  }

  if (accountIds) {
    return response.accounts.every((x) => !x.hasSyncInProgress && accountIds.includes(x.id))
  } else {
    return response.accounts.every((x) => !x.hasSyncInProgress)
  }
}

export async function requestAccountsRefreshAndWait(accountIds = null, timeout = 300, delay = 10) {
  if (!accountIds) {
    // const accountData = await this.getAccounts()
    const accountData = await getAccounts()
    console.log(accountData)
    accountIds = accountData.accounts.map((x) => x.id)
  }

  await requestAccountsRefresh(accountIds)

  const start = Date.now()
  let refreshed = false

  while (!refreshed && Date.now() <= start + timeout * 1000) {
    await new Promise((resolve) => setTimeout(resolve, delay * 1000))
    refreshed = await isAccountsRefreshComplete(accountIds)
  }

  return refreshed
}

export async function requestAccountsRefreshAndDontWait(accountIds = null) {
  if (!accountIds) {
    const accountData = await getAccounts()
    accountIds = accountData.accounts.map((x) => x.id)
  }

  return await requestAccountsRefresh(accountIds)
}

// make schema introspection call (doesnt work)
export async function getSchema() {
  const query = gql`
    query IntrospectionQuery {
      __schema {
        queryType {
          name
          __typename
        }
        # mutationType {
        #   name
        #   __typename
        # }
        # subscriptionType {
        #   name
        #   __typename
        # }
      }
    }
  `
  return await gqlCall("IntrospectionQuery", query)
}