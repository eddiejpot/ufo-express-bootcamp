/* IMPORT MODULES */
import { readFile, writeFile } from 'fs';

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {object} jsonContentObj - The content to write to the JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes write error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
const write = (filename, jsonContentObj, callback) => {
  // Convert content object to string before writing
  const jsonContentStr = JSON.stringify(jsonContentObj);

  // Write content to DB
  writeFile(filename, jsonContentStr, (writeErr) => {
    if (writeErr) {
      console.error('Write error', jsonContentStr, writeErr);
      // Allow each client app to handle errors in their own way
      callback(writeErr, null);
      return;
    }
    console.log('Write success!');
    // Call client-provided callback on successful write
    callback(null, jsonContentStr);
  });
};

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
const read = (filename, callback) => {
  const handleFileRead = (readErr, jsonContentStr) => {
    if (readErr) {
      console.error('Read error', readErr);
      // Allow client to handle error in their own way
      callback(readErr, null);
      return;
    }

    // Convert file content to JS Object
    const jsonContentObj = JSON.parse(jsonContentStr);

    // Call client callback on file content
    callback(null, jsonContentObj);
  };

  // Read content from DB
  readFile(filename, 'utf-8', handleFileRead);
};

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read error as 1st param and JS Object as 2nd param.
 * @returns undefined
 */
const edit = (filename, callback) => {
  // Read contents of target file and perform callback on JSON contents
  read(filename, (readErr, jsonContentObj) => {
    // Exit if there was a read error
    if (readErr) {
      console.error('Read error', readErr);
      callback(readErr, null);
      return;
    }

    // Perform custom edit operations here.
    // jsonContentObj mutated in-place because object is mutable data type.
    callback(null, jsonContentObj);

    // Write updated content to target file.
    // Provide empty callback because no custom logic needed.
    write(filename, jsonContentObj, () => {});
  });
};

const editOneElement = (filename, key, inputIndex, inputStr, callback) => {
  // Read contents of target file and perform callback on JSON contents
  read(filename, (readErr, jsonContentObj) => {
    // Exit if there was a read error
    if (readErr) {
      console.error('Read error', readErr);
      callback(readErr, null);
      return;
    }

    // Perform edit operations here.
    callback(jsonContentObj[key][inputIndex]);
    jsonContentObj[key][inputIndex] = inputStr;

    // Write updated content to target file.
    // Provide empty callback because no custom logic needed.
    write(filename, jsonContentObj, () => {});
  });
};

/**
 * Add a JS Object to an array of Objects in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {string} key - The key in the JSON file whose value is the target array
 * @param {string} input - The value to append to the target array
 * @param {function} callback - The callback function to execute on error or success
 *                              Callback takes read or write error as 1st param
 * @returns undefined
 */
const append = (filename, key, input, callback) => {
  edit(filename, (err, jsonContentObj) => {
    // Exit if there was an error
    if (err) {
      console.error('Edit error', err);
      callback(err);
      return;
    }

    // Exit if key does not exist in DB
    if (!(key in jsonContentObj)) {
      console.error('Key does not exist');
      // Call callback with relevant error message to let client handle
      callback('Key does not exist');
      return;
    }

    // Add input element to target array
    jsonContentObj[key].push(input);

    // Pass callback to edit to be called after edit completion
    callback();
  });
};

/**
 * Remove a JS Object/Element from an array in a JSON file
 * @param {string} filename - Name of JSON file
 * @param {string} key - The key in the JSON file whose value is the target array
 * @param {string} input - The index number of the target in the array
 * @param {function} callback - The callback function to execute on error or success
 * Callback takes read or write error as 1st param
 * @returns removed element
 */
const remove = (filename, key, inputIndex, callback) => {
  edit(filename, (err, jsonContentObj) => {
  // exit if theres an error
    if (err) {
      console.error('Edit Error', err);
      callback(err, null);
      return;
    }

    // exit if keydoes not exist in DB
    if (!key in jsonContentObj) {
      console.error('Key does not exist');
      // Call callback with relevant error message to let client handle
      callback('Key does not exist', null);
      return;
    }

    // call back
    const itemsArr = jsonContentObj[key];
    const itemToRemove = itemsArr[inputIndex];
    callback(itemToRemove);

    // remove element from array
    for (let i = 0; i < itemsArr.length; i += 1) {
      if (i === inputIndex) {
        itemsArr.splice(i, 1);
      }
    }
  });
};

export {
  read, write, edit, editOneElement, append, remove,
};
