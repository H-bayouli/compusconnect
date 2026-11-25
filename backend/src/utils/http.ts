import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { IUser } from "../models/User.js";

export interface AuthLocals extends Record<string, unknown> {
  user: IUser;
}

export type AuthenticatedHandler = RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  ParsedQs,
  AuthLocals
>;
