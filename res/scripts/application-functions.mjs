/**
 * J-Card Template: Application Functions
 *
 * Functions operating on the application model. Whenever unavailable, operate
 * directly on the model.
 */

import {
  NUL_OBJECT,
  NUL_STRING,
  COVER_IMAGE,
  DATA_TYPE,
  DATA_VERSION,
  EVENT_CHANGE,
  EVENT_INPUT,
  FILE_EXTENSION,
  FILE_NAME,
  FILE_NAME_LENGTH_MAX,
  FILE_SIZE_MAX_SAFE,
  MESSAGES,
  regexps,
} from "./constants.mjs";
import { defaultOrAsIs, testFile } from "./functions.mjs";
import { application } from "./application-model.mjs";

/** For use with `getEntries`. */
const entries = (() => {
  let out = {};
  Object.entries(application.entries).forEach(([key, value]) => {
    Object.entries(value).forEach(([subKey, value]) => {
      out[key + subKey.charAt(0).toUpperCase + subKey.substring(1)] = value;
    });
  });
  return Object.freeze(out);
})();

/** Alerts the current file properties. */
export function alertFileProperties() {
  const file = getFile();
  if (file) {
    alert(
      "Name: " +
        file.name +
        "\nType: " +
        file.type +
        "\nSize: " +
        file.size +
        " bytes\nLast modified: " +
        new Date(file.lastModified).toISOString()
    );
  } else {
    alert(MESSAGES.fileNul);
  }
}

/** Closes the current instance. */
export function close() {
  setWindowSubtitle();
  getSource().value = NUL_STRING;
  application.instance.file = null;
}

/** Downloads the given file by its name and URL. */
export function download(name = NUL_STRING, url = NUL_STRING) {
  const href = application.anchor.href;
  application.anchor.download = name;
  if (href !== url) {
    if (href) {
      URL.revokeObjectURL(href);
    }
    application.anchor.href = url;
  }
  application.anchor.click();
}

/**
 * Loads the file at the given index of the given list. If successful, then this
 * may be followed by `loadReader`.
 */
export function loadFile(files = getSource().valueOrPreset, index = 0) {
  getSource().element.disabled = true;
  if (files.length) {
    const file = files[index];
    if (
      testFile(file) &&
      (file.size <= FILE_SIZE_MAX_SAFE || confirm(MESSAGES.loadLarge)) &&
      (!isModified() || confirm(MESSAGES.discard))
    ) {
      getReader().readAsText(file);
      return (application.instance.file = file);
    }
  } else {
    alert(MESSAGES.loadEmpty);
  }
  getSource().element.disabled = false;
}

/** Loads the reader contents into the current instance. */
export function loadReader() {
  try {
    populate(JSON.parse(getReader().result));
  } catch (error) {
    alert(error.toString());
    getSource().element.disabled = false;
    return;
  }
  Object.values(getDataEntries())
    .filter((entry) => !entry.persistent && !entry.save)
    .forEach((entry) => {
      entry.value = entry.preset;
    });
  const name = getSaveEntry("name");
  name.value = getFile().name.replace(
    regexps.fileExtension,
    NUL_STRING
  );
  name.element.dispatchEvent(EVENT_INPUT);
  update();
  getSource().element.disabled = false;
}

/**
 * Populates data form entries with the given values. Those not to be saved are
 * excluded by default, and those undefined are set to their default. This is
 * opposite to `preserve`.
 */
export function populate(values = NUL_OBJECT, all = false) {
  let entries = Object.entries(getDataEntries());
  if (!all) {
    entries = entries.filter(([, entry]) => entry.save);
  }
  return entries.forEach(([key, entry]) => {
    entry.value = defaultOrAsIs(entry.preset, values[key]);
  });
}

/**
 * Returns a snapshot of data form entry values. Those not to be saved are
 * excluded by default, and those undefined are set to their default. This is
 * opposite to `populate`.
 */
export function preserve(all = false) {
  const out = { version: DATA_VERSION };
  let entries = Object.entries(getDataEntries());
  if (!all) {
    entries = entries.filter(([, entry]) => entry.save);
  }
  entries.forEach(([key, entry]) => {
    out[key] = entry.safeValue;
  });
  return Object.freeze(out);
}

/** Prints the window only if print form entries are good. */
export function print() {
  if (testPrintFormEntries()) {
    return window.print();
  }
}

/** Resets form entries. */
export function reset() {
  return Object.values(getEntries()).forEach((entry) => {
    entry.value = entry.preset;
  });
}

/** Saves data form entries as a file download. */
export function save() {
  const file = new File(
    [JSON.stringify(preserve())],
    getCardName().substring(0, FILE_NAME_LENGTH_MAX) + FILE_EXTENSION,
    { type: DATA_TYPE }
  );
  return download(file.name, URL.createObjectURL(file));
}

/** Returns whether print form entries are valid and reports on a fault. */
export function testPrintFormEntries() {
  try {
    Object.values(getPrintEntries()).forEach((entry) => {
      if (!entry.element.reportValidity()) {
        throw new Error();
      }
    });
  } catch (error) {
    return false;
  }
  return true;
}

/** Dispatches change or input events on data form entries. */
export function update() {
  return Object.values(getDataEntries()).forEach((entry) => {
    entry.element.dispatchEvent(
      entry.element.type === "checkbox" || entry.element.type === "file"
        ? EVENT_CHANGE
        : EVENT_INPUT
    );
  });
}

/**
 * In their parent: prepends a given number of blanks; and appends a given
 * number of the template root element. The parameters correspond to those in
 * the Print section.
 */
export function doPrint(
  start = 1,
  count = 1,
  margin = NUL_STRING,
  opacity = 1,
  outline = false
) {
  const element = getOutput("root").element;
  switch (margin) {
    case "variable":
      element.classList.add("variable-width");
    case "half":
      element.classList.add("half-margin");
  }
  if (outline) {
    element.classList.add("outline");
  }
  const blank = element.cloneNode(true);
  element.style.opacity = opacity;
  blank.style.opacity = 0;
  const parent = element.parentElement;
  while (start-- > 1) {
    parent.prepend(blank.cloneNode(true));
  }
  while (count-- > 1) {
    parent.append(element.cloneNode(true));
  }
}

/**
 * Undoes `doPrint`; removes siblings of the template root element, and clears
 * its added properties.
 */
export function undoPrint() {
  const element = getOutput("root").element;
  ["previousElementSibling", "nextElementSibling"].forEach((neighbor) => {
    let sibling = element[neighbor];
    while (sibling) {
      sibling.remove();
      sibling = element[neighbor];
    }
  });
  element.style.opacity = NUL_STRING;
  element.classList.remove("half-margin", "outline", "variable-width");
}

/** Resets the cover image. */
export function resetCover() {
  const entry = getDataEntry("coverImage");
  entry.value = NUL_STRING;
  getOutput("cover").element.src = COVER_IMAGE;
  setModifiedBy(entry);
}

/** Saves the cover image as a file download. */
export function saveCover() {
  return download(getCardName(), getOutput("cover").element.src);
}

/** Returns collapsible fieldsets. */
export function getAccordions() {
  return application.accordions;
}

/** Returns the given form button by its key. */
export function getButton(key = NUL_STRING) {
  return getControl(getButtons, key);
}

/** Returns form buttons. */
export function getButtons() {
  return application.buttons;
}

/** Returns the current card name. */
export function getCardName() {
  return (
    (getSaveEntry("follow").valueOrPreset
      ? getDataEntry("titleUpper").valueOrPreset ||
        getDataEntry("titleLower").valueOrPreset
      : getSaveEntry("name").valueOrPreset) || FILE_NAME
  );
}

/** Returns the given data form entry by its key. */
export function getDataEntry(key = NUL_STRING) {
  return getControl(getDataEntries, key);
}

/** Returns data form entries. */
export function getDataEntries() {
  return application.entries.data;
}

/** Returns the given form entry by its key. */
export function getEntry(key = NUL_STRING) {
  return getControl(getEntries, key);
}

/** Returns form entries. */
export function getEntries() {
  return entries;
}

/** Returns the current working file. */
export function getFile() {
  return application.instance.file;
}

/** Returns the given load form entry by its key. */
export function getLoadEntry(key = NUL_STRING) {
  return getControl(getLoadEntries, key);
}

/** Returns load form entries. */
export function getLoadEntries() {
  return application.entries.load;
}

/** Returns whether the current instance is modified. */
export function isModified() {
  return application.instance.modified;
}

/** Sets the modified flag to the given value. */
export function setModified(value = true) {
  return (application.instance.modified = value);
}

/** Sets the modified flag by the given data entry. */
export function setModifiedBy(entry = NUL_OBJECT) {
  return setModified(isModified() || entry.save || false);
}

/** Returns the current instance name. */
export function getName() {
  return getSaveEntry("name").safeValue;
}

/** Returns the given J-card output by its key. */
export function getOutput(key = NUL_STRING) {
  return getControl(getOutputs, key);
}

/** Returns J-card outputs. */
export function getOutputs() {
  return application.outputs;
}

/** Returns the given print form entry by its key. */
export function getPrintEntry(key = NUL_STRING) {
  return getControl(getPrintEntries, key);
}

/** Returns print form entries. */
export function getPrintEntries() {
  return application.entries.print;
}

/** Returns the file reader. */
export function getReader() {
  return application.reader;
}

/** Returns the root element. */
export function getRoot() {
  return application.root;
}

/** Returns the source file input. */
export function getSource() {
  return application.source;
}

/** Returns the given save form entry by its key. */
export function getSaveEntry(key = NUL_STRING) {
  return getControl(getSaveEntries, key);
}

/** Returns save form entries. */
export function getSaveEntries() {
  return application.entries.save;
}

/** Returns the given view form entry by its key. */
export function getViewEntry(key = NUL_STRING) {
  return getControl(getViewEntries, key);
}

/** Returns view form entries. */
export function getViewEntries() {
  return application.entries.view;
}

/** Returns the given control by its getter and key. */
function getControl(getter, key) {
  return getter()[key];
}
