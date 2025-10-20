import { Type, type Static } from "@sinclair/typebox";

export const HeaderSfCurrentUser = "sf-context-current-user";
export const HeaderSfUserToken = "sf-context-current-user-token";
export const SfContextHeadersSchema = Type.Object({
  [HeaderSfCurrentUser]: Type.Optional(Type.String()),
  [HeaderSfUserToken]: Type.Optional(Type.String()),
});

export type SfContextHeaders = Static<typeof SfContextHeadersSchema>;
