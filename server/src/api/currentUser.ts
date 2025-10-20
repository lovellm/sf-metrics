import runQuery from "../sf/runQuery.js";
import { FastifyRequest } from "fastify";
import { RequestError } from "../errors.js";
import { Type, type Static } from "@sinclair/typebox";

export const UserResultSchema = Type.Object({
  user: Type.String(),
  roles: Type.Array(Type.String()),
});
export type UserResult = Static<typeof UserResultSchema>;

export const UserRequestSchema = Type.Object({
  roles: Type.Optional(Type.Array(Type.String())),
});
export type UserRequest = Static<typeof UserRequestSchema>;

/** convert a QueryDefinition to a SQL string */
export default async function currentUser(
  request: FastifyRequest,
  roles?: string[],
): Promise<UserResult> {
  let sql = "SELECT CURRENT_USER(), null as ROLES";
  if (roles && roles.length > 0) {
    sql += `
UNION ALL
SELECT null, ROLE_NAME
FROM (VALUES
  ${roles
    .map((role) => {
      if (typeof role !== "string" || /[^a-zA-Z0-9_-]/.test(role)) {
        throw new RequestError(
          "if roles are given, they must all be strings meeting [a-zA-Z0-9_-]",
        );
      }
      return `('${role.toUpperCase()}')`;
    })
    .join(",")}
) as r (ROLE_NAME)
WHERE IS_ROLE_IN_SESSION(r.ROLE_NAME)
`;
  }
  sql += ";";
  const resultData = await runQuery<[string, string]>(sql, {
    request: request,
    asUser: true,
  });

  const userData: UserResult = {
    user: "",
    roles: [],
  };
  if (resultData) {
    resultData.forEach((row) => {
      if (row[0]) {
        userData.user = row[0];
      }
      if (row[1]) {
        userData.roles.push(row[1]);
      }
    });
  }

  return userData;
}
