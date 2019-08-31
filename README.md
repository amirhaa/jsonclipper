# JSONClipper

A simple utility to extract a part of json with a provides schema, also it is available to use default values if it is not available in the original json.

![](https://img.shields.io/npm/v/jsonclipper)

## Install

    npm i jsonclipper -D

## Usage

    import {compileSchema} from "jsonclipper";

    // create a schema
    const schema = {
        _type: "object",
        _properties: {
            name: {_type: "string"},
            age: {_type: "number"},
        }
    }

    const json = {
        name: "John",
        age: 26,
        job: "Developer",
    };

    const result = compileSchema(schema, json); // {name: "John", age: 26}

## Schema formats

__String:__  

    const schema1 = {
        _type: "string",
    }
  
__Number with default value:__  

    const schema2 = {
        _type: "number",
        _default: 0
    }

__Boolean:__  

    const schema3 = {
        _type: "boolean",
        _removeEmpty: true // remove the field if value is not provided, and has priority over `default` value
    }

__Object:__

    const schema4 = {
        _type: "object",
        _properties: {
            key1: {_type: "number"},
            key2: {_type: "string"},
        }
    }

__Array of objects:__  

    const schema5 = {
        _type: "array",
        _items: {
            _type: "object",
            _properties: {
                key1: {_type: "number"},
            }
        }
    }

__Array of multiple types:__  

    const schema6 = {
        _type: "array",
        _items: [
            {_type: "string"},
            {_type: "number"},
        ]
    }
