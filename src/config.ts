export type Config = {
    imageLocation: string;
    downsample: number;
    allowDissonance: boolean;
    noteLength: string;
    range: number;
    tempo: number;
    root: number;
    scale: number[];
    arp: boolean;
};
const config : Config = {
    imageLocation: './../data/test.jpg',
    downsample: 2048 * 8,
    noteLength: '32',
    allowDissonance: false,
    range: 36,
    tempo: 120,
    root: 60,
    scale: [1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1],
    arp: true
};
export default config;