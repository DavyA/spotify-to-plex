import { spawn } from 'node:child_process';

const DEFAULT_COMMAND = process.env.TIDAL_DL_NG_COMMAND ?? '';
let warnedMissingCommand = false;

const buildUrl = (type: 'track' | 'album', id: string): string => {
    const base = 'https://tidal.com';
    const path = type === 'track' ? 'track' : 'album';

    return `${base}/${path}/${id}`;
};

const runDownloader = async (type: 'track' | 'album', ids: string[]): Promise<void> => {
    if (!DEFAULT_COMMAND) {
        if (!warnedMissingCommand) {
            console.warn('[tidal-dl-ng] Skipping downloads because TIDAL_DL_NG_COMMAND is not set.');
            warnedMissingCommand = true;
        }
        return;
    }

    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (uniqueIds.length === 0) {
        return;
    }

    for (const id of uniqueIds) {
        try {
            await new Promise<void>((resolve, reject) => {
                const child = spawn(DEFAULT_COMMAND, ['dl', buildUrl(type, id)], {
                    shell: true,
                    stdio: 'inherit',
                });

                child.on('close', (code) => {
                    if (code && code !== 0) {
                        console.warn(
                            `[tidal-dl-ng] Downloader exited with code ${code} for ${type} ${id}`,
                        );
                    }
                    resolve();
                });

                child.on('error', (err) => {
                    console.warn(`[tidal-dl-ng] Failed to run downloader for ${type} ${id}`, err);
                    resolve();
                });
            });
        } catch (error) {
            console.warn(`[tidal-dl-ng] Unexpected error while downloading ${type} ${id}`, error);
        }
    }
};

export const downloadTidalTracks = (ids: string[]): Promise<void> => runDownloader('track', ids);
export const downloadTidalAlbums = (ids: string[]): Promise<void> => runDownloader('album', ids);
