import * as fs from 'fs';
export type Config = {
    imageLocation: string;
    downsample: number; // Gets squared
    allowDissonance: boolean;
    noteLength: string;
    range: number;
    tempo: number;
    root: number;
    scale: number[]; // length = 12
    arp: boolean;
};
const configRaw = fs.readFileSync('./config.json', 'utf-8');
const configJSON = JSON.parse(configRaw);
const config = configJSON as Config;
export default config;