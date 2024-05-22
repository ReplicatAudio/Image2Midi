import * as fs from 'fs';
import MidiWriter from 'midi-writer-js';
import Jimp, * as jimp from 'jimp';
/*

    1 : whole
    2 : half
    d2 : dotted half
    dd2 : double dotted half
    4 : quarter
    4t : quarter triplet
    d4 : dotted quarter
    dd4 : double dotted quarter
    8 : eighth
    8t : eighth triplet
    d8 : dotted eighth
    dd8 : double dotted eighth
    16 : sixteenth
    16t : sixteenth triplet
    32 : thirty-second
    64 : sixty-fourth
    Tn : where n is an explicit number of ticks (T128 = 1 beat)

*/
type Config = {
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

type RgbValue = {
    r: number;
    g: number;
    b: number;
};

class Util {
    static normalize(arr: number[], min: number, max: number): number[] {
        if (arr.length === 0) return arr; // Return the input array if it's empty
        const normalizedRange = max - min; // Calculate the range of the output values
        const normalizedValues = arr.map((value) => {
            return ((value - Math.min(...arr)) / (Math.max(...arr) - Math.min(...arr))) * normalizedRange + min;
        });
        return normalizedValues;
    }
    static parseImgData(rgbData: RgbValue[], downsample: number): number[] {
        let out: number[] = [];
        for (let [index, item] of rgbData.entries()) {
            if (index % downsample !== 0) continue;
            out.push(item.r);
            out.push(item.g);
            out.push(item.b);
            //out.push(item.r + item.b + item.g);
        }
        return out;
    }
    static async getRgbValuesFromImage(filePath: string): Promise<RgbValue[]> {
        try {
            const image = await jimp.read(filePath);
            const width = image.getWidth();
            const height = image.getHeight();
            const rgbValues: RgbValue[] = [];
    
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const color = image.getPixelColor(x, y);
                    // const rgb: RgbValue = {
                    //     r: (color >> 16) & 0xFF,
                    //     g: (color >> 8) & 0xFF,
                    //     b: color & 0xFF,
                    // };
                    const rgba = Jimp.intToRGBA(image.getPixelColor(x,y));
                    const rgb : RgbValue = {
                        r: rgba.r,
                        g: rgba.g,
                        b: rgba.b
                    };
                    rgbValues.push(rgb);
                }
            }
    
            return rgbValues;
        } catch (error) {
            console.error(`Error reading image file: ${filePath}`);
            throw error;
        }
    }
}

class Sonic {
    private config: Config;
    private normData: number[] = [];
    private track: any;
    constructor(config: Config) {
        this.config = config;
        this.start();
    }
    private async start(): Promise<void> {
        await this.init();
        this.initTrack();
        this.build();
        this.writeFile();
    }
    private async init(): Promise<void> {
        if (this.config.scale.length !== 12) {
            console.log('Bad scale - Got ' + this.config.scale.length + ' expected 12');
            process.exit(1);
        }
        const rawData = await Util.getRgbValuesFromImage(this.config.imageLocation);
        console.log(rawData);
        // process.exit();
        const parsedData = Util.parseImgData(rawData, this.config.downsample);
        console.log(parsedData);
        // process.exit();
        this.normData = Util.normalize(parsedData, 0, this.config.range);
    }
    private initTrack(): void {
        this.track = new MidiWriter.Track();
        this.track.setTempo(this.config.tempo);
        // Define an instrument (optional):
        this.track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
    }
    private build(): void {
        let tick = 0;
        for (let [index, item] of this.normData.entries()) {
            // 3 notes at a time to make chords
            if (index % 3 !== 0) continue;
            let notes = [];
            for (let i = 0; i < 3; i++) {
                let note = Math.floor(this.config.root + this.normData[index + i]);
                // If we are not in scale move up one semitone (note)
                // Offset by three to get to C
                const scalePos = note % 12;
                if (this.config.scale[scalePos] !== 1) {
                    note += 1;
                }
                // Remove dissonance
                if (!this.config.allowDissonance) {
                    if (i > 0) {
                        const lastNote = notes[i - 1];
                        if (Math.abs(note - lastNote) <= 2) {
                            note = lastNote;// ignore
                        }
                    }
                    notes.push(note);
                }
            }
            console.log(tick + ' - ' + notes + ' - ' + index + '/' + this.normData.length);
            let event = new MidiWriter.NoteEvent({ 
                pitch: notes, 
                duration: this.config.noteLength, 
                sequential: true
            });
            // No tick on arp
            if (!this.config.arp) event.tick = tick;
            // 128 ticks = 1 beat
            tick += 128
            this.track.addEvent(event);
        }
    }
    private writeFile(): void {
        console.log('Writing file...');
        const write = new MidiWriter.Writer(this.track);
        fs.writeFileSync('./../out/' + Date.now() + '.mid', write.buildFile());
    }
}

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

const sonic = new Sonic(config);
