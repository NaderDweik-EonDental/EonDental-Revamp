import naderTestBeforeUrl from '../assets/naderTestBefore.png';

/** Demo smile photo shipped with the remote. */
export async function loadDefaultSmilePhoto(): Promise<File> {
  const response = await fetch(naderTestBeforeUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load default smile photo (${response.status})`,
    );
  }
  const blob = await response.blob();
  return new File([blob], 'naderTestBefore.png', { type: 'image/png' });
}
