// DOM utility functions
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => document.querySelectorAll(sel);

// Class manipulation
export const show = (el) => el?.classList.remove("hidden");
export const hide = (el) => el?.classList.add("hidden");
export const toggle = (el, className = "hidden") =>
  el?.classList.toggle(className);
export const addClass = (el, ...classes) => el?.classList.add(...classes);
export const removeClass = (el, ...classes) => el?.classList.remove(...classes);
export const hasClass = (el, className) => el?.classList.contains(className);

// Element creation and manipulation
export const createElement = (tag, className, innerHTML) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (innerHTML !== undefined) element.innerHTML = innerHTML;
  return element;
};

export const clearElement = (element) => {
  if (element) element.innerHTML = "";
};

export const setAttributes = (element, attrs) => {
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
};

// Event helpers
export const on = (element, event, handler, options) => {
  element?.addEventListener(event, handler, options);
};

export const off = (element, event, handler, options) => {
  element?.removeEventListener(event, handler, options);
};

export const once = (element, event, handler) => {
  element?.addEventListener(event, handler, { once: true });
};
