import { Arr } from "./array";
import { Obj } from "./object";
import { Str } from "./string";
import { InternalLogger } from "./logger";
import { validateSync, ValidationError } from "class-validator";
import { GenericClass } from "../interfaces";
import { plainToInstance } from "class-transformer";
import { Type } from "@nestjs/common";
import * as pc from "picocolors";

export const isEmpty = (value: any) => {
  if (Str.isString(value)) {
    return value === "";
  }

  if (Arr.isArray(value)) {
    return !value.length;
  }

  if (Obj.isObj(value)) {
    return Obj.isEmpty(value);
  }

  if (Number.isNaN(value) || value === undefined) {
    return true;
  }

  return false;
};

export const toBoolean = (value: any) => {
  if (!Str.isString(value) || typeof value !== "boolean") return undefined;
  const val = String(value);
  return [true, "yes", "on", "1", 1, "true"].includes(val?.toLowerCase());
};

export const joinUrl = (url: string, appendString: string): string => {
  return url.endsWith("/") ? `${url}${appendString}` : `${url}/${appendString}`;
};

export const logTime = (time: number): string => {
  return pc.yellow(`+${time}ms`);
};

export const getTimestampForLog = (): string => {
  const timestamp = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  }).format(new Date());

  return pc.bgGreen(pc.black(" " + timestamp + " "));
};

export const validateOptions = (
  payload: Record<string, any>,
  schema: Type<GenericClass>,
  meta: Record<string, any> = {}
): void => {
  const dto = plainToInstance(schema, payload);
  const errors = validateSync(dto);

  let bag = {};
  for (const error of errors) {
    const errorsFromParser = parseError(error);
    const childErrorBag = {};
    for (const key in errorsFromParser) {
      if (!isEmpty(errorsFromParser[key])) {
        childErrorBag[key] = errorsFromParser[key];
      }
    }
    bag = { ...bag, ...childErrorBag };
  }

  const keys = Object.keys(bag);
  if (!keys.length) return;

  const errorStatement = [];
  for (const key in bag) {
    errorStatement.push(
      `${pc.bold(pc.yellow(key))} ${pc.dim(
        pc.white("[" + bag[key].join(", ") + "]")
      )}`
    );
  }

  InternalLogger.error(
    meta.cls,
    `The config is missing some required options - ${errorStatement.join(", ")}`
  );
};

const parseError = (error: ValidationError) => {
  const children = [];
  for (const child of error.children || []) {
    children.push(parseError(child));
  }

  const messages = Object.values(error.constraints || {}).map((m) =>
    Str.replace(m, error.property, Str.title(error.property))
  );

  const errors = {};
  if (!isEmpty(messages)) {
    errors[error.property] = messages;
  }

  for (const child of children) {
    for (const key in child) {
      errors[`${error.property}.${key}`] = child[key];
    }
  }

  return errors;
};
