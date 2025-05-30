import { exec, type ExecException } from 'child_process';

import { DEFAULTDURATION } from './download-asset.js';

export async function getDimension(filename: string): Promise<readonly [number, number] | undefined> {
  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 ${filename}`,
      (error: Readonly<ExecException | null>, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }
        const widthAndHeight = stdout.trim();

        if (widthAndHeight === 'N/A' || widthAndHeight === '') {
          resolve(undefined);
        } else {
          const widthAndHeightSplit: readonly string[] = widthAndHeight.split('x');
          const width = Number(widthAndHeightSplit[0]);
          const height = Number(widthAndHeightSplit[1]);

          resolve([width, height]);
        }
      }
    );
  });
}

export async function getDuration(filename: string): Promise<number | undefined> {
  if (filename.startsWith('http://') || filename.startsWith('https://')) filename = 'cache:' + filename;

  return new Promise((resolve) => {
    exec(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=noprint_wrappers=1:nokey=1 "${filename}"`,
      (error: Readonly<ExecException | null>, stdout) => {
        if (error) {
          resolve(undefined);
          return;
        }
        const duration = stdout.trim();
        // Check if duration is "N/A" or empty, and use a default value
        if (duration === 'N/A' || duration === '') {
          resolve(parseFloat(String(DEFAULTDURATION)));
          //reject(new Error('Duration is either N/A or empty.')); // or any default value you prefer
        } else {
          resolve(parseFloat(duration));
        }
      }
    );
  });
}
