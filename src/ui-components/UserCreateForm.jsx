/***************************************************************************
 * The contents of this file were generated with Amplify Studio.           *
 * Please refrain from making any modifications to this file.              *
 * Any changes to this file will be overwritten when running amplify pull. *
 **************************************************************************/

/* eslint-disable */
import * as React from "react";
import {
  Badge,
  Button,
  Divider,
  Flex,
  Grid,
  Icon,
  ScrollView,
  Text,
  TextField,
  useTheme,
} from "@aws-amplify/ui-react";
import { fetchByPath, getOverrideProps, validateField } from "./utils";
import { generateClient } from "aws-amplify/api";
import { createUser } from "../graphql/mutations";
const client = generateClient();
function ArrayField({
  items = [],
  onChange,
  label,
  inputFieldRef,
  children,
  hasError,
  setFieldValue,
  currentFieldValue,
  defaultFieldValue,
  lengthLimit,
  getBadgeText,
  runValidationTasks,
  errorMessage,
}) {
  const labelElement = <Text>{label}</Text>;
  const {
    tokens: {
      components: {
        fieldmessages: { error: errorStyles },
      },
    },
  } = useTheme();
  const [selectedBadgeIndex, setSelectedBadgeIndex] = React.useState();
  const [isEditing, setIsEditing] = React.useState();
  React.useEffect(() => {
    if (isEditing) {
      inputFieldRef?.current?.focus();
    }
  }, [isEditing]);
  const removeItem = async (removeIndex) => {
    const newItems = items.filter((value, index) => index !== removeIndex);
    await onChange(newItems);
    setSelectedBadgeIndex(undefined);
  };
  const addItem = async () => {
    const { hasError } = runValidationTasks();
    if (
      currentFieldValue !== undefined &&
      currentFieldValue !== null &&
      currentFieldValue !== "" &&
      !hasError
    ) {
      const newItems = [...items];
      if (selectedBadgeIndex !== undefined) {
        newItems[selectedBadgeIndex] = currentFieldValue;
        setSelectedBadgeIndex(undefined);
      } else {
        newItems.push(currentFieldValue);
      }
      await onChange(newItems);
      setIsEditing(false);
    }
  };
  const arraySection = (
    <React.Fragment>
      {!!items?.length && (
        <ScrollView height="inherit" width="inherit" maxHeight={"7rem"}>
          {items.map((value, index) => {
            return (
              <Badge
                key={index}
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  marginRight: 3,
                  marginTop: 3,
                  backgroundColor:
                    index === selectedBadgeIndex ? "#B8CEF9" : "",
                }}
                onClick={() => {
                  setSelectedBadgeIndex(index);
                  setFieldValue(items[index]);
                  setIsEditing(true);
                }}
              >
                {getBadgeText ? getBadgeText(value) : value.toString()}
                <Icon
                  style={{
                    cursor: "pointer",
                    paddingLeft: 3,
                    width: 20,
                    height: 20,
                  }}
                  viewBox={{ width: 20, height: 20 }}
                  paths={[
                    {
                      d: "M10 10l5.09-5.09L10 10l5.09 5.09L10 10zm0 0L4.91 4.91 10 10l-5.09 5.09L10 10z",
                      stroke: "black",
                    },
                  ]}
                  ariaLabel="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeItem(index);
                  }}
                />
              </Badge>
            );
          })}
        </ScrollView>
      )}
      <Divider orientation="horizontal" marginTop={5} />
    </React.Fragment>
  );
  if (lengthLimit !== undefined && items.length >= lengthLimit && !isEditing) {
    return (
      <React.Fragment>
        {labelElement}
        {arraySection}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment>
      {labelElement}
      {isEditing && children}
      {!isEditing ? (
        <>
          <Button
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Add item
          </Button>
          {errorMessage && hasError && (
            <Text color={errorStyles.color} fontSize={errorStyles.fontSize}>
              {errorMessage}
            </Text>
          )}
        </>
      ) : (
        <Flex justifyContent="flex-end">
          {(currentFieldValue || isEditing) && (
            <Button
              children="Cancel"
              type="button"
              size="small"
              onClick={() => {
                setFieldValue(defaultFieldValue);
                setIsEditing(false);
                setSelectedBadgeIndex(undefined);
              }}
            ></Button>
          )}
          <Button size="small" variation="link" onClick={addItem}>
            {selectedBadgeIndex !== undefined ? "Save" : "Add"}
          </Button>
        </Flex>
      )}
      {arraySection}
    </React.Fragment>
  );
}
export default function UserCreateForm(props) {
  const {
    clearOnSuccess = true,
    onSuccess,
    onError,
    onSubmit,
    onValidate,
    onChange,
    overrides,
    ...rest
  } = props;
  const initialValues = {
    email: "",
    displayName: "",
    photoURL: "",
    lastSessionId: "",
    lastUpdated: "",
    passwordHistory: [],
  };
  const [email, setEmail] = React.useState(initialValues.email);
  const [displayName, setDisplayName] = React.useState(
    initialValues.displayName
  );
  const [photoURL, setPhotoURL] = React.useState(initialValues.photoURL);
  const [lastSessionId, setLastSessionId] = React.useState(
    initialValues.lastSessionId
  );
  const [lastUpdated, setLastUpdated] = React.useState(
    initialValues.lastUpdated
  );
  const [passwordHistory, setPasswordHistory] = React.useState(
    initialValues.passwordHistory
  );
  const [errors, setErrors] = React.useState({});
  const resetStateValues = () => {
    setEmail(initialValues.email);
    setDisplayName(initialValues.displayName);
    setPhotoURL(initialValues.photoURL);
    setLastSessionId(initialValues.lastSessionId);
    setLastUpdated(initialValues.lastUpdated);
    setPasswordHistory(initialValues.passwordHistory);
    setCurrentPasswordHistoryValue("");
    setErrors({});
  };
  const [currentPasswordHistoryValue, setCurrentPasswordHistoryValue] =
    React.useState("");
  const passwordHistoryRef = React.createRef();
  const validations = {
    email: [],
    displayName: [],
    photoURL: [],
    lastSessionId: [],
    lastUpdated: [],
    passwordHistory: [],
  };
  const runValidationTasks = async (
    fieldName,
    currentValue,
    getDisplayValue
  ) => {
    const value =
      currentValue && getDisplayValue
        ? getDisplayValue(currentValue)
        : currentValue;
    let validationResponse = validateField(value, validations[fieldName]);
    const customValidator = fetchByPath(onValidate, fieldName);
    if (customValidator) {
      validationResponse = await customValidator(value, validationResponse);
    }
    setErrors((errors) => ({ ...errors, [fieldName]: validationResponse }));
    return validationResponse;
  };
  const convertToLocal = (date) => {
    const df = new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      calendar: "iso8601",
      numberingSystem: "latn",
      hourCycle: "h23",
    });
    const parts = df.formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  };
  return (
    <Grid
      as="form"
      rowGap="15px"
      columnGap="15px"
      padding="20px"
      onSubmit={async (event) => {
        event.preventDefault();
        let modelFields = {
          email,
          displayName,
          photoURL,
          lastSessionId,
          lastUpdated,
          passwordHistory,
        };
        const validationResponses = await Promise.all(
          Object.keys(validations).reduce((promises, fieldName) => {
            if (Array.isArray(modelFields[fieldName])) {
              promises.push(
                ...modelFields[fieldName].map((item) =>
                  runValidationTasks(fieldName, item)
                )
              );
              return promises;
            }
            promises.push(
              runValidationTasks(fieldName, modelFields[fieldName])
            );
            return promises;
          }, [])
        );
        if (validationResponses.some((r) => r.hasError)) {
          return;
        }
        if (onSubmit) {
          modelFields = onSubmit(modelFields);
        }
        try {
          Object.entries(modelFields).forEach(([key, value]) => {
            if (typeof value === "string" && value === "") {
              modelFields[key] = null;
            }
          });
          await client.graphql({
            query: createUser.replaceAll("__typename", ""),
            variables: {
              input: {
                ...modelFields,
              },
            },
          });
          if (onSuccess) {
            onSuccess(modelFields);
          }
          if (clearOnSuccess) {
            resetStateValues();
          }
        } catch (err) {
          if (onError) {
            const messages = err.errors.map((e) => e.message).join("\n");
            onError(modelFields, messages);
          }
        }
      }}
      {...getOverrideProps(overrides, "UserCreateForm")}
      {...rest}
    >
      <TextField
        label="Email"
        isRequired={false}
        isReadOnly={false}
        value={email}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email: value,
              displayName,
              photoURL,
              lastSessionId,
              lastUpdated,
              passwordHistory,
            };
            const result = onChange(modelFields);
            value = result?.email ?? value;
          }
          if (errors.email?.hasError) {
            runValidationTasks("email", value);
          }
          setEmail(value);
        }}
        onBlur={() => runValidationTasks("email", email)}
        errorMessage={errors.email?.errorMessage}
        hasError={errors.email?.hasError}
        {...getOverrideProps(overrides, "email")}
      ></TextField>
      <TextField
        label="Display name"
        isRequired={false}
        isReadOnly={false}
        value={displayName}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              displayName: value,
              photoURL,
              lastSessionId,
              lastUpdated,
              passwordHistory,
            };
            const result = onChange(modelFields);
            value = result?.displayName ?? value;
          }
          if (errors.displayName?.hasError) {
            runValidationTasks("displayName", value);
          }
          setDisplayName(value);
        }}
        onBlur={() => runValidationTasks("displayName", displayName)}
        errorMessage={errors.displayName?.errorMessage}
        hasError={errors.displayName?.hasError}
        {...getOverrideProps(overrides, "displayName")}
      ></TextField>
      <TextField
        label="Photo url"
        isRequired={false}
        isReadOnly={false}
        value={photoURL}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              displayName,
              photoURL: value,
              lastSessionId,
              lastUpdated,
              passwordHistory,
            };
            const result = onChange(modelFields);
            value = result?.photoURL ?? value;
          }
          if (errors.photoURL?.hasError) {
            runValidationTasks("photoURL", value);
          }
          setPhotoURL(value);
        }}
        onBlur={() => runValidationTasks("photoURL", photoURL)}
        errorMessage={errors.photoURL?.errorMessage}
        hasError={errors.photoURL?.hasError}
        {...getOverrideProps(overrides, "photoURL")}
      ></TextField>
      <TextField
        label="Last session id"
        isRequired={false}
        isReadOnly={false}
        value={lastSessionId}
        onChange={(e) => {
          let { value } = e.target;
          if (onChange) {
            const modelFields = {
              email,
              displayName,
              photoURL,
              lastSessionId: value,
              lastUpdated,
              passwordHistory,
            };
            const result = onChange(modelFields);
            value = result?.lastSessionId ?? value;
          }
          if (errors.lastSessionId?.hasError) {
            runValidationTasks("lastSessionId", value);
          }
          setLastSessionId(value);
        }}
        onBlur={() => runValidationTasks("lastSessionId", lastSessionId)}
        errorMessage={errors.lastSessionId?.errorMessage}
        hasError={errors.lastSessionId?.hasError}
        {...getOverrideProps(overrides, "lastSessionId")}
      ></TextField>
      <TextField
        label="Last updated"
        isRequired={false}
        isReadOnly={false}
        type="datetime-local"
        value={lastUpdated && convertToLocal(new Date(lastUpdated))}
        onChange={(e) => {
          let value =
            e.target.value === "" ? "" : new Date(e.target.value).toISOString();
          if (onChange) {
            const modelFields = {
              email,
              displayName,
              photoURL,
              lastSessionId,
              lastUpdated: value,
              passwordHistory,
            };
            const result = onChange(modelFields);
            value = result?.lastUpdated ?? value;
          }
          if (errors.lastUpdated?.hasError) {
            runValidationTasks("lastUpdated", value);
          }
          setLastUpdated(value);
        }}
        onBlur={() => runValidationTasks("lastUpdated", lastUpdated)}
        errorMessage={errors.lastUpdated?.errorMessage}
        hasError={errors.lastUpdated?.hasError}
        {...getOverrideProps(overrides, "lastUpdated")}
      ></TextField>
      <ArrayField
        onChange={async (items) => {
          let values = items;
          if (onChange) {
            const modelFields = {
              email,
              displayName,
              photoURL,
              lastSessionId,
              lastUpdated,
              passwordHistory: values,
            };
            const result = onChange(modelFields);
            values = result?.passwordHistory ?? values;
          }
          setPasswordHistory(values);
          setCurrentPasswordHistoryValue("");
        }}
        currentFieldValue={currentPasswordHistoryValue}
        label={"Password history"}
        items={passwordHistory}
        hasError={errors?.passwordHistory?.hasError}
        runValidationTasks={async () =>
          await runValidationTasks(
            "passwordHistory",
            currentPasswordHistoryValue
          )
        }
        errorMessage={errors?.passwordHistory?.errorMessage}
        setFieldValue={setCurrentPasswordHistoryValue}
        inputFieldRef={passwordHistoryRef}
        defaultFieldValue={""}
      >
        <TextField
          label="Password history"
          isRequired={false}
          isReadOnly={false}
          value={currentPasswordHistoryValue}
          onChange={(e) => {
            let { value } = e.target;
            if (errors.passwordHistory?.hasError) {
              runValidationTasks("passwordHistory", value);
            }
            setCurrentPasswordHistoryValue(value);
          }}
          onBlur={() =>
            runValidationTasks("passwordHistory", currentPasswordHistoryValue)
          }
          errorMessage={errors.passwordHistory?.errorMessage}
          hasError={errors.passwordHistory?.hasError}
          ref={passwordHistoryRef}
          labelHidden={true}
          {...getOverrideProps(overrides, "passwordHistory")}
        ></TextField>
      </ArrayField>
      <Flex
        justifyContent="space-between"
        {...getOverrideProps(overrides, "CTAFlex")}
      >
        <Button
          children="Clear"
          type="reset"
          onClick={(event) => {
            event.preventDefault();
            resetStateValues();
          }}
          {...getOverrideProps(overrides, "ClearButton")}
        ></Button>
        <Flex
          gap="15px"
          {...getOverrideProps(overrides, "RightAlignCTASubFlex")}
        >
          <Button
            children="Submit"
            type="submit"
            variation="primary"
            isDisabled={Object.values(errors).some((e) => e?.hasError)}
            {...getOverrideProps(overrides, "SubmitButton")}
          ></Button>
        </Flex>
      </Flex>
    </Grid>
  );
}
