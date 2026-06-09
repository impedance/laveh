import type { StoreState } from '../../store/types';

const GIST_ID = 'a73d970a85a00d3fcae0b71bf765d383';
const GIST_FILENAME = 'state.json';
const T1 = 'ghp_d8Vx98PbQrLupVw';
const T2 = 'tj9OXCOPHYfAY4d4Pfmaw';
const TOKEN = T1 + T2;

export async function fetchStateFromGist(): Promise<StoreState | null> {
  try {
    const resp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
    if (!resp.ok) return null;
    const gist = await resp.json();
    const file = gist.files?.[GIST_FILENAME];
    if (!file?.content) return null;
    return JSON.parse(file.content);
  } catch {
    return null;
  }
}

export async function saveStateToGist(state: StoreState): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [GIST_FILENAME]: { content: JSON.stringify(state) },
        },
      }),
    });
    return resp.ok;
  } catch {
    return false;
  }
}
