/**
 * J-Card Template: Models
 *
 * Form and output model classes.
 */

import { NUL_ELEMENT, NUL_OBJECT, NUL_STRING } from "./constants.mjs";
import {
  defaultOrAsIs,
  qs,
  getInputSafeValue,
  setInputValue,
} from "./functions.mjs";
import { application, template } from "./roots.mjs";

/** Represents an element. This is a wrapper for interoperability purposes. */
export class ElementModel {
  constructor(element, options = NUL_OBJECT) {
    /** Element. */
    this.element = defaultOrAsIs(NUL_ELEMENT, element);
  }
}

/** Represents a form control. */
export class FormControl extends ElementModel {
  constructor(options = NUL_OBJECT, prefix = NUL_STRING) {
    super(
      defaultOrAsIs(NUL_ELEMENT, qs(application, "#" + prefix + options.id)),
      options
    );
  }
}

/** Represents a form button. */
export class FormButton extends FormControl {
  constructor(options = NUL_OBJECT, prefix = "button-") {
    super(options, prefix);
  }
}

/** Represents an Unagi menu item. */
export class MenuButton extends FormButton {
  constructor(options = NUL_OBJECT, prefix = "menuitem-") {
    super(options, prefix);
    /** Icon. */
    this.icon = qs(this.element, ".icon");
    /** Label. */
    this.label = qs(this.element, "label");
    /** Mnemonic. */
    this.label = qs(this.element, ".mnemonic");
  }
}

/** Represents a form entry. */
export class FormEntry extends FormControl {
  constructor(options = NUL_OBJECT, prefix = "input-") {
    super(options, prefix);
    /** Remain across instances? */
    this.persistent = defaultOrAsIs(true, options.persistent);
    /** Default value. */
    this.preset = defaultOrAsIs(NUL_STRING, options.preset);
  }

  /** Returns its fail-safe value. */
  get safeValue() {
    return getInputSafeValue(this.element, NUL_STRING);
  }

  /** Returns its preset-default fail-safe value. */
  get valueOrPreset() {
    return getInputSafeValue(this.element, this.preset);
  }

  /** Sets its value. */
  set value(value) {
    return setInputValue(this.element, value);
  }
}

/** Represents a data form entry. */
export class DataFormEntry extends FormEntry {
  constructor(options = NUL_OBJECT) {
    super(options);
    /** Save? */
    this.save = defaultOrAsIs(true, options.save);
    if (this.save || options.persistent === undefined) {
      this.persistent = false;
    }
  }
}

/** Represents a J-card template output. */
export class JCardOutput extends ElementModel {
  constructor(options = NUL_OBJECT, prefix = "template-") {
    super(
      options.class
        ? defaultOrAsIs(NUL_ELEMENT, qs(template, "." + prefix + options.class))
        : template,
      options
    );
  }
}
