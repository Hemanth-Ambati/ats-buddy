/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createUser = /* GraphQL */ `mutation CreateUser(
  $input: CreateUserInput!
  $condition: ModelUserConditionInput
) {
  createUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateUserMutationVariables,
  APITypes.CreateUserMutation
>;
export const updateUser = /* GraphQL */ `mutation UpdateUser(
  $input: UpdateUserInput!
  $condition: ModelUserConditionInput
) {
  updateUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateUserMutationVariables,
  APITypes.UpdateUserMutation
>;
export const deleteUser = /* GraphQL */ `mutation DeleteUser(
  $input: DeleteUserInput!
  $condition: ModelUserConditionInput
) {
  deleteUser(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteUserMutationVariables,
  APITypes.DeleteUserMutation
>;
export const createSession = /* GraphQL */ `mutation CreateSession(
  $input: CreateSessionInput!
  $condition: ModelSessionConditionInput
) {
  createSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.CreateSessionMutationVariables,
  APITypes.CreateSessionMutation
>;
export const updateSession = /* GraphQL */ `mutation UpdateSession(
  $input: UpdateSessionInput!
  $condition: ModelSessionConditionInput
) {
  updateSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.UpdateSessionMutationVariables,
  APITypes.UpdateSessionMutation
>;
export const deleteSession = /* GraphQL */ `mutation DeleteSession(
  $input: DeleteSessionInput!
  $condition: ModelSessionConditionInput
) {
  deleteSession(input: $input, condition: $condition) {
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
` as GeneratedMutation<
  APITypes.DeleteSessionMutationVariables,
  APITypes.DeleteSessionMutation
>;
