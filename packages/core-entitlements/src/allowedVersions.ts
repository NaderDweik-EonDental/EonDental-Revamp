import semver from 'semver';

export function highestAllowedVersion(versions: string[]): string | null {
  const valid = versions.filter((version) => Boolean(semver.valid(version)));
  if (valid.length === 0) {
    return null;
  }
  return valid.sort(semver.compare)[valid.length - 1] ?? null;
}

/** Use the assigned version if it is allowed; otherwise the highest allowed. */
export function pickAllowedVersion(
  requested: string | undefined,
  allowedVersions: string[],
): string | null {
  const highest = highestAllowedVersion(allowedVersions);
  if (!highest) {
    return null;
  }
  if (requested && allowedVersions.includes(requested)) {
    return requested;
  }
  return highest;
}
