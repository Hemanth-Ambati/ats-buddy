/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onCreateUser = /* GraphQL */ `subscription OnCreateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onCreateUser(filter: $filter, owner: $owner) {
    id
    email
    displayName
    photoURL
    profileResume
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
` as GeneratedSubscription<
  APITypes.OnCreateUserSubscriptionVariables,
  APITypes.OnCreateUserSubscription
>;
export const onUpdateUser = /* GraphQL */ `subscription OnUpdateUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onUpdateUser(filter: $filter, owner: $owner) {
    id
    email
    displayName
    photoURL
    profileResume
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
` as GeneratedSubscription<
  APITypes.OnUpdateUserSubscriptionVariables,
  APITypes.OnUpdateUserSubscription
>;
export const onDeleteUser = /* GraphQL */ `subscription OnDeleteUser(
  $filter: ModelSubscriptionUserFilterInput
  $owner: String
) {
  onDeleteUser(filter: $filter, owner: $owner) {
    id
    email
    displayName
    photoURL
    profileResume
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
` as GeneratedSubscription<
  APITypes.OnDeleteUserSubscriptionVariables,
  APITypes.OnDeleteUserSubscription
>;
export const onCreateSession = /* GraphQL */ `subscription OnCreateSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onCreateSession(filter: $filter, owner: $owner) {
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
      profileResume
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
` as GeneratedSubscription<
  APITypes.OnCreateSessionSubscriptionVariables,
  APITypes.OnCreateSessionSubscription
>;
export const onUpdateSession = /* GraphQL */ `subscription OnUpdateSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onUpdateSession(filter: $filter, owner: $owner) {
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
      profileResume
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
` as GeneratedSubscription<
  APITypes.OnUpdateSessionSubscriptionVariables,
  APITypes.OnUpdateSessionSubscription
>;
export const onDeleteSession = /* GraphQL */ `subscription OnDeleteSession(
  $filter: ModelSubscriptionSessionFilterInput
  $owner: String
) {
  onDeleteSession(filter: $filter, owner: $owner) {
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
      profileResume
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
` as GeneratedSubscription<
  APITypes.OnDeleteSessionSubscriptionVariables,
  APITypes.OnDeleteSessionSubscription
>;
