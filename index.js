/**
 * Accepts a javascript objects as schema template and a json as input and returns an object
 * That is passed the schema or filled with default values
 *
 * @param schema
 * @param data
 * @param shouldReturnArray
 * @returns {[*, *]|*|undefined}
 */
export const compileSchema = (schema, data, {shouldReturnArray} = {}) => {
    const schemaType = schema["_type"];

    if (schemaType === "string") {
        return compileStringType(schema, data, {
            useDefault: typeof data !== "string" || data === "" && schema["_default"],
            shouldReturnArray,
        });
    } else if (schemaType === "number") {
        return compileNumberType(schema, data, {
            useDefault: (typeof data !== "number" || isNaN(data)) && (schema["_default"] || schema["_default"] === 0),
            shouldReturnArray,
        });
    } else if (schemaType === "boolean") {
        return compileBooleanType(schema, data, {
            useDefault: typeof data !== "boolean" && schema["_default"],
            shouldReturnArray,
        });
    } else if (schemaType === "object") {
        return compileObjectType(schema, data);
    } else if (schemaType === "array") {
        return compileArrayType(schema, data, {
            useDefault: !Array.isArray(data) || data.length === 0,
        });
    }
};

// Handle value with schema type of "string"
const compileStringType = (schema, value, {useDefault, shouldReturnArray} = {}) => {
    let result;
    if (useDefault && !schema["_removeEmpty"]) { // removeEmpty has priority over default value
        result = schema["_default"];
    } else if (!!value) {
        result = value;
    }
    return shouldReturnArray ? [result, schema["_removeEmpty"]] : result;
};

// Handle value with schema type of "number"
const compileNumberType = (schema, value, {useDefault, shouldReturnArray}) => {
    let result;
    if (useDefault && !schema["_removeEmpty"]) { // removeEmpty has priority over default value
        result = schema["_default"];
    } else if (!isNaN(value)) {
        result = value;
    }
    return shouldReturnArray ? [result, schema["_removeEmpty"]] : result;
};

// Handle value with schema type of "boolean"
const compileBooleanType = (schema, value, {useDefault, shouldReturnArray}) => {
    let result;
    if (useDefault && !schema["_removeEmpty"]) { // removeEmpty has priority over default value
        result = schema["_default"];
    } else if (typeof value === "boolean") {
        result = value;
    }
    return shouldReturnArray ? [result, schema["_removeEmpty"]] : result;
};

// Handle value with schema type of "object"
const compileObjectType = (schema, value) => {
    if (!"_properties" in schema || Object.values(schema["_properties"]).length === 0) {
        const errorMessage = "It is necessary to provide `_properties` in object schema, " +
            "Please refer to documentation for usage of this key";
        throw new Error(errorMessage);
    }

    let result = {};
    for (const schemaKey in schema["_properties"]) {
        if (schema["_properties"].hasOwnProperty(schemaKey)) {
            const schemaValue = schema["_properties"][schemaKey];
            const useDefault = !(schemaKey in value)
                || (schemaValue["_type"] !== typeof value[schemaKey] && !Array.isArray(value[schemaKey]))
                && schemaValue["_default"];

            if (useDefault && !schemaValue["_removeEmpty"]) {
                result[schemaKey] = schemaValue["_default"];
            } else if (schemaKey in value) {
                const innerCompileSchema = compileSchema(schemaValue, value[schemaKey], {shouldReturnArray: true});

                if (Array.isArray(innerCompileSchema) && innerCompileSchema.length === 2) {
                    const [destructedResult, removeEmpty] = innerCompileSchema;
                    if (!removeEmpty) result[schemaKey] = destructedResult;
                } else {
                    result[schemaKey] = innerCompileSchema;
                }
            }
        }
    }
    return result;
};

// Handle value with schema type of "array"
const compileArrayType = (schema, value, {useDefault}) => {
    if (!"_items" in schema) {
        const errorMessage = "Please provide `_items` key in Array schema type";
        throw new Error(errorMessage);
    }

    if (useDefault && !schema["_removeEmpty"]) {
        return schema["_default"];
    } else if (Array.isArray(schema["_items"])) { // When schema is an array of other schemas
        return value.reduce((acc, item) => {
            const foundSchema = schema["_items"].find(i => i["_type"] === typeof item);
            if (foundSchema) {
                acc.push(compileSchema(foundSchema, item));
            }
            return acc;
        }, []);
    } else if (typeof schema["_items"] === "object") {
        return value.map(item => compileSchema(schema["_items"], item));
    }
};
