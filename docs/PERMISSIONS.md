# Permissions

## Status

Current status: **foundation only**.

Nestly now has a reusable capability model in:

- `src/lib/cloud/authorization.ts`

Roles:

- `owner`
- `admin`
- `member`
- `viewer`

Capabilities include:

- `familySpace.view`
- `members.invite`
- `members.manageRoles`
- `tasks.assign`
- `finance.view`
- `documents.upload`
- `permissions.manage`

Use:

```ts
can(membership, "tasks.assign", { familySpaceId })
assertCapability(membership, "permissions.manage", { familySpaceId })
```

Do not scatter checks such as `role === "admin"` across UI components.

## Important Security Rule

Client UI hiding is not security.

Every sensitive production operation must validate:

- authenticated user
- active membership
- Family Space ID
- required capability
- record visibility
- record ownership where relevant

## Current Limitations

- Permission UI is still local/planning oriented.
- No server authorization endpoint exists yet.
- No RLS policy is active yet.
- Search, Assistant and Command Center still need backend permission filtering
  before closed beta.
