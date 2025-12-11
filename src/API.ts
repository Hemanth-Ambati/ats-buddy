/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type CreateUserInput = {
  id?: string | null,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null,
  profileResume?: string | null,
  lastSessionId?: string | null,
  lastUpdated?: string | null,
  passwordHistory?: Array< string | null > | null,
};

export type ModelUserConditionInput = {
  email?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  photoURL?: ModelStringInput | null,
  profileResume?: ModelStringInput | null,
  lastSessionId?: ModelStringInput | null,
  lastUpdated?: ModelStringInput | null,
  passwordHistory?: ModelStringInput | null,
  and?: Array< ModelUserConditionInput | null > | null,
  or?: Array< ModelUserConditionInput | null > | null,
  not?: ModelUserConditionInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  owner?: ModelStringInput | null,
};

export type ModelStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export enum ModelAttributeTypes {
  binary = "binary",
  binarySet = "binarySet",
  bool = "bool",
  list = "list",
  map = "map",
  number = "number",
  numberSet = "numberSet",
  string = "string",
  stringSet = "stringSet",
  _null = "_null",
}


export type ModelSizeInput = {
  ne?: number | null,
  eq?: number | null,
  le?: number | null,
  lt?: number | null,
  ge?: number | null,
  gt?: number | null,
  between?: Array< number | null > | null,
};

export type User = {
  __typename: "User",
  id: string,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null,
  profileResume?: string | null,
  lastSessionId?: string | null,
  lastUpdated?: string | null,
  passwordHistory?: Array< string | null > | null,
  sessions?: ModelSessionConnection | null,
  createdAt: string,
  updatedAt: string,
  owner?: string | null,
};

export type ModelSessionConnection = {
  __typename: "ModelSessionConnection",
  items:  Array<Session | null >,
  nextToken?: string | null,
};

export type Session = {
  __typename: "Session",
  id: string,
  title?: string | null,
  updatedAt?: string | null,
  resumeText?: string | null,
  jobDescriptionText?: string | null,
  chatHistory?: string | null,
  analysis?: string | null,
  userId: string,
  user?: User | null,
  createdAt: string,
  userSessionsId?: string | null,
  owner?: string | null,
};

export type UpdateUserInput = {
  id: string,
  email?: string | null,
  displayName?: string | null,
  photoURL?: string | null,
  profileResume?: string | null,
  lastSessionId?: string | null,
  lastUpdated?: string | null,
  passwordHistory?: Array< string | null > | null,
};

export type DeleteUserInput = {
  id: string,
};

export type CreateSessionInput = {
  id?: string | null,
  title?: string | null,
  updatedAt?: string | null,
  resumeText?: string | null,
  jobDescriptionText?: string | null,
  chatHistory?: string | null,
  analysis?: string | null,
  userId: string,
  userSessionsId?: string | null,
};

export type ModelSessionConditionInput = {
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  resumeText?: ModelStringInput | null,
  jobDescriptionText?: ModelStringInput | null,
  chatHistory?: ModelStringInput | null,
  analysis?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  and?: Array< ModelSessionConditionInput | null > | null,
  or?: Array< ModelSessionConditionInput | null > | null,
  not?: ModelSessionConditionInput | null,
  createdAt?: ModelStringInput | null,
  userSessionsId?: ModelIDInput | null,
  owner?: ModelStringInput | null,
};

export type ModelIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  attributeExists?: boolean | null,
  attributeType?: ModelAttributeTypes | null,
  size?: ModelSizeInput | null,
};

export type UpdateSessionInput = {
  id: string,
  title?: string | null,
  updatedAt?: string | null,
  resumeText?: string | null,
  jobDescriptionText?: string | null,
  chatHistory?: string | null,
  analysis?: string | null,
  userId?: string | null,
  userSessionsId?: string | null,
};

export type DeleteSessionInput = {
  id: string,
};

export type ModelUserFilterInput = {
  id?: ModelIDInput | null,
  email?: ModelStringInput | null,
  displayName?: ModelStringInput | null,
  photoURL?: ModelStringInput | null,
  profileResume?: ModelStringInput | null,
  lastSessionId?: ModelStringInput | null,
  lastUpdated?: ModelStringInput | null,
  passwordHistory?: ModelStringInput | null,
  createdAt?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  and?: Array< ModelUserFilterInput | null > | null,
  or?: Array< ModelUserFilterInput | null > | null,
  not?: ModelUserFilterInput | null,
  owner?: ModelStringInput | null,
};

export type ModelUserConnection = {
  __typename: "ModelUserConnection",
  items:  Array<User | null >,
  nextToken?: string | null,
};

export type ModelSessionFilterInput = {
  id?: ModelIDInput | null,
  title?: ModelStringInput | null,
  updatedAt?: ModelStringInput | null,
  resumeText?: ModelStringInput | null,
  jobDescriptionText?: ModelStringInput | null,
  chatHistory?: ModelStringInput | null,
  analysis?: ModelStringInput | null,
  userId?: ModelIDInput | null,
  createdAt?: ModelStringInput | null,
  and?: Array< ModelSessionFilterInput | null > | null,
  or?: Array< ModelSessionFilterInput | null > | null,
  not?: ModelSessionFilterInput | null,
  userSessionsId?: ModelIDInput | null,
  owner?: ModelStringInput | null,
};

export type ModelStringKeyConditionInput = {
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
};

export enum ModelSortDirection {
  ASC = "ASC",
  DESC = "DESC",
}


export type ModelSubscriptionUserFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  email?: ModelSubscriptionStringInput | null,
  displayName?: ModelSubscriptionStringInput | null,
  photoURL?: ModelSubscriptionStringInput | null,
  profileResume?: ModelSubscriptionStringInput | null,
  lastSessionId?: ModelSubscriptionStringInput | null,
  lastUpdated?: ModelSubscriptionStringInput | null,
  passwordHistory?: ModelSubscriptionStringInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionUserFilterInput | null > | null,
  or?: Array< ModelSubscriptionUserFilterInput | null > | null,
  userSessionsId?: ModelSubscriptionIDInput | null,
  owner?: ModelStringInput | null,
};

export type ModelSubscriptionIDInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionStringInput = {
  ne?: string | null,
  eq?: string | null,
  le?: string | null,
  lt?: string | null,
  ge?: string | null,
  gt?: string | null,
  contains?: string | null,
  notContains?: string | null,
  between?: Array< string | null > | null,
  beginsWith?: string | null,
  in?: Array< string | null > | null,
  notIn?: Array< string | null > | null,
};

export type ModelSubscriptionSessionFilterInput = {
  id?: ModelSubscriptionIDInput | null,
  title?: ModelSubscriptionStringInput | null,
  updatedAt?: ModelSubscriptionStringInput | null,
  resumeText?: ModelSubscriptionStringInput | null,
  jobDescriptionText?: ModelSubscriptionStringInput | null,
  chatHistory?: ModelSubscriptionStringInput | null,
  analysis?: ModelSubscriptionStringInput | null,
  userId?: ModelSubscriptionIDInput | null,
  createdAt?: ModelSubscriptionStringInput | null,
  and?: Array< ModelSubscriptionSessionFilterInput | null > | null,
  or?: Array< ModelSubscriptionSessionFilterInput | null > | null,
  owner?: ModelStringInput | null,
};

export type CreateUserMutationVariables = {
  input: CreateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type CreateUserMutation = {
  createUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type UpdateUserMutationVariables = {
  input: UpdateUserInput,
  condition?: ModelUserConditionInput | null,
};

export type UpdateUserMutation = {
  updateUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type DeleteUserMutationVariables = {
  input: DeleteUserInput,
  condition?: ModelUserConditionInput | null,
};

export type DeleteUserMutation = {
  deleteUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type CreateSessionMutationVariables = {
  input: CreateSessionInput,
  condition?: ModelSessionConditionInput | null,
};

export type CreateSessionMutation = {
  createSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type UpdateSessionMutationVariables = {
  input: UpdateSessionInput,
  condition?: ModelSessionConditionInput | null,
};

export type UpdateSessionMutation = {
  updateSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type DeleteSessionMutationVariables = {
  input: DeleteSessionInput,
  condition?: ModelSessionConditionInput | null,
};

export type DeleteSessionMutation = {
  deleteSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type GetUserQueryVariables = {
  id: string,
};

export type GetUserQuery = {
  getUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type ListUsersQueryVariables = {
  filter?: ModelUserFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListUsersQuery = {
  listUsers?:  {
    __typename: "ModelUserConnection",
    items:  Array< {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GetSessionQueryVariables = {
  id: string,
};

export type GetSessionQuery = {
  getSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type ListSessionsQueryVariables = {
  filter?: ModelSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type ListSessionsQuery = {
  listSessions?:  {
    __typename: "ModelSessionConnection",
    items:  Array< {
      __typename: "Session",
      id: string,
      title?: string | null,
      updatedAt?: string | null,
      resumeText?: string | null,
      jobDescriptionText?: string | null,
      chatHistory?: string | null,
      analysis?: string | null,
      userId: string,
      createdAt: string,
      userSessionsId?: string | null,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type SessionsByUserIdAndUpdatedAtQueryVariables = {
  userId: string,
  updatedAt?: ModelStringKeyConditionInput | null,
  sortDirection?: ModelSortDirection | null,
  filter?: ModelSessionFilterInput | null,
  limit?: number | null,
  nextToken?: string | null,
};

export type SessionsByUserIdAndUpdatedAtQuery = {
  sessionsByUserIdAndUpdatedAt?:  {
    __typename: "ModelSessionConnection",
    items:  Array< {
      __typename: "Session",
      id: string,
      title?: string | null,
      updatedAt?: string | null,
      resumeText?: string | null,
      jobDescriptionText?: string | null,
      chatHistory?: string | null,
      analysis?: string | null,
      userId: string,
      createdAt: string,
      userSessionsId?: string | null,
      owner?: string | null,
    } | null >,
    nextToken?: string | null,
  } | null,
};

export type GenerateGeminiResponseQueryVariables = {
  prompt?: string | null,
  schema?: string | null,
  temperature?: number | null,
  messages?: string | null,
  analysisContext?: string | null,
  resumeText?: string | null,
  jobDescriptionText?: string | null,
};

export type GenerateGeminiResponseQuery = {
  generateGeminiResponse?: string | null,
};

export type OnCreateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnCreateUserSubscription = {
  onCreateUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnUpdateUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnUpdateUserSubscription = {
  onUpdateUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnDeleteUserSubscriptionVariables = {
  filter?: ModelSubscriptionUserFilterInput | null,
  owner?: string | null,
};

export type OnDeleteUserSubscription = {
  onDeleteUser?:  {
    __typename: "User",
    id: string,
    email?: string | null,
    displayName?: string | null,
    photoURL?: string | null,
    profileResume?: string | null,
    lastSessionId?: string | null,
    lastUpdated?: string | null,
    passwordHistory?: Array< string | null > | null,
    sessions?:  {
      __typename: "ModelSessionConnection",
      nextToken?: string | null,
    } | null,
    createdAt: string,
    updatedAt: string,
    owner?: string | null,
  } | null,
};

export type OnCreateSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnCreateSessionSubscription = {
  onCreateSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type OnUpdateSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnUpdateSessionSubscription = {
  onUpdateSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};

export type OnDeleteSessionSubscriptionVariables = {
  filter?: ModelSubscriptionSessionFilterInput | null,
  owner?: string | null,
};

export type OnDeleteSessionSubscription = {
  onDeleteSession?:  {
    __typename: "Session",
    id: string,
    title?: string | null,
    updatedAt?: string | null,
    resumeText?: string | null,
    jobDescriptionText?: string | null,
    chatHistory?: string | null,
    analysis?: string | null,
    userId: string,
    user?:  {
      __typename: "User",
      id: string,
      email?: string | null,
      displayName?: string | null,
      photoURL?: string | null,
      profileResume?: string | null,
      lastSessionId?: string | null,
      lastUpdated?: string | null,
      passwordHistory?: Array< string | null > | null,
      createdAt: string,
      updatedAt: string,
      owner?: string | null,
    } | null,
    createdAt: string,
    userSessionsId?: string | null,
    owner?: string | null,
  } | null,
};
