/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const getUser = /* GraphQL */ `query GetUser($id: ID!) {
  getUser(id: $id) {
    id
    email
    displayName
    photoURL
    lastSessionId
    lastUpdated
    passwordHistory
    sessions {
      nextToken
      __typename
    }
    createdAt
    updatedAt
    owner
    __typename
  }
}
` as GeneratedQuery<APITypes.GetUserQueryVariables, APITypes.GetUserQuery>;
export const listUsers = /* GraphQL */ `query ListUsers(
  $filter: ModelUserFilterInput
  $limit: Int
  $nextToken: String
) {
  listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      email
      displayName
      photoURL
      lastSessionId
      lastUpdated
      passwordHistory
      createdAt
      updatedAt
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<APITypes.ListUsersQueryVariables, APITypes.ListUsersQuery>;
export const getSession = /* GraphQL */ `query GetSession($id: ID!) {
  getSession(id: $id) {
    id
    title
    updatedAt
    resumeText
    jobDescriptionText
    chatHistory
    analysis
    userId
    user {
      id
      email
      displayName
      photoURL
      lastSessionId
      lastUpdated
      passwordHistory
      createdAt
      updatedAt
      owner
      __typename
    }
    createdAt
    userSessionsId
    owner
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetSessionQueryVariables,
  APITypes.GetSessionQuery
>;
export const listSessions = /* GraphQL */ `query ListSessions(
  $filter: ModelSessionFilterInput
  $limit: Int
  $nextToken: String
) {
  listSessions(filter: $filter, limit: $limit, nextToken: $nextToken) {
    items {
      id
      title
      updatedAt
      resumeText
      jobDescriptionText
      chatHistory
      analysis
      userId
      createdAt
      userSessionsId
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListSessionsQueryVariables,
  APITypes.ListSessionsQuery
>;
export const sessionsByUserIdAndUpdatedAt = /* GraphQL */ `query SessionsByUserIdAndUpdatedAt(
  $userId: ID!
  $updatedAt: ModelStringKeyConditionInput
  $sortDirection: ModelSortDirection
  $filter: ModelSessionFilterInput
  $limit: Int
  $nextToken: String
) {
  sessionsByUserIdAndUpdatedAt(
    userId: $userId
    updatedAt: $updatedAt
    sortDirection: $sortDirection
    filter: $filter
    limit: $limit
    nextToken: $nextToken
  ) {
    items {
      id
      title
      updatedAt
      resumeText
      jobDescriptionText
      chatHistory
      analysis
      userId
      createdAt
      userSessionsId
      owner
      __typename
    }
    nextToken
    __typename
  }
}
` as GeneratedQuery<
  APITypes.SessionsByUserIdAndUpdatedAtQueryVariables,
  APITypes.SessionsByUserIdAndUpdatedAtQuery
>;
export const generateGeminiResponse = /* GraphQL */ `query GenerateGeminiResponse(
  $prompt: String
  $schema: String
  $temperature: Float
  $messages: String
  $analysisContext: String
  $resumeText: String
  $jobDescriptionText: String
) {
  generateGeminiResponse(
    prompt: $prompt
    schema: $schema
    temperature: $temperature
    messages: $messages
    analysisContext: $analysisContext
    resumeText: $resumeText
    jobDescriptionText: $jobDescriptionText
  )
}
` as GeneratedQuery<
  APITypes.GenerateGeminiResponseQueryVariables,
  APITypes.GenerateGeminiResponseQuery
>;
