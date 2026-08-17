import lowerArchUrl from '../assets/LowerArch.stl?url';
import upperArchUrl from '../assets/UpperArch.stl?url';

async function urlToFile(
  url: string,
  name: string,
  type: string,
): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load default asset ${name} (${response.status})`);
  }
  const blob = await response.blob();
  return new File([blob], name, { type });
}

/** Demo upper/lower arches shipped with the remote. */
export async function loadDefaultArchFiles(): Promise<{
  upper: File;
  lower: File;
}> {
  const [upper, lower] = await Promise.all([
    urlToFile(upperArchUrl, 'UpperArch.stl', 'model/stl'),
    urlToFile(lowerArchUrl, 'LowerArch.stl', 'model/stl'),
  ]);
  return { upper, lower };
}
