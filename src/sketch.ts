import p5 from 'p5';
import { FileClient, getCanvasImage } from 'p5-file-client';
import { Grid, GridPoint } from './grid';

const s = (p: p5) => {
    const CANVAS_WIDTH = 500;
    const CANVAS_HEIGHT = 500;

    const SHAPE_GRID_DENSITY = 20;
    const DOT_GRID_DENSITY = 40;
    const SHAPE_GRID_AMOUNT = 3;
    const DOT_GRID_AMOUNT = 1;

    const LINE_THICKNESS = 20;

    let fileClient: FileClient;
    let shapeGrid: Grid;
    let dotGrid: Grid;

    p.setup = () => {
        const canvas = p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
        canvas.parent('sketch');
        p.ellipseMode(p.CENTER);
        p.colorMode(p.HSB, 360, 100, 100);
        p.noLoop();

        fileClient = new FileClient(
            undefined,
            undefined,
            '/home/vadim/Projects/creative-coding/p5-projects/open-grid/progress',
        );

        shapeGrid = new Grid(SHAPE_GRID_DENSITY, SHAPE_GRID_DENSITY, CANVAS_WIDTH, CANVAS_HEIGHT);
        dotGrid = new Grid(DOT_GRID_DENSITY, DOT_GRID_DENSITY, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    p.draw = () => {
        p.background(255);

        p.fill('#0000ff');
        p.noStroke();

        // DOTS
        iterator(DOT_GRID_AMOUNT, () => {
            const slicedGrid = randomGridSlice(dotGrid, { minWidth: 4, maxWidth: 8, minHeight: 20, maxHeight: 36 });
            p.fill(0, 0, 0);
            slicedGrid.draw((x: number, y: number) => p.ellipse(x, y, 3, 3));
        });

        // SHAPES
        for (let i = 0; i < SHAPE_GRID_AMOUNT; i++) {
            const mainShape = i === 1;
            const slicedGrid = randomGridSlice(shapeGrid, {
                minWidth: mainShape ? 8 : 4,
                maxWidth: mainShape ? 16 : 8,
                minHeight: mainShape ? 16 : 4,
                maxHeight: mainShape ? 20 : 8,
            });

            // Draw the bg
            let bgGraphics = p.createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
            bgGraphics.colorMode(bgGraphics.HSB, 360, 100, 100);
            if (mainShape) {
                //bgGraphics = drawImageWithinGrid(bgGraphics, slicedGrid);
                bgGraphics = drawLineBG(bgGraphics);
            } else {
                bgGraphics.background(randomInt(0, 361), 75, 100);
            }

            // Draw the mask
            const maskGraphics = p.createGraphics(CANVAS_WIDTH, CANVAS_HEIGHT);
            maskGraphics.fill(0);
            maskGraphics.beginShape();
            getRandomShape(slicedGrid).forEach((point) => {
                maskGraphics.vertex(point.x, point.y);
            });
            maskGraphics.endShape(p.CLOSE);

            // Mask the BG
            const bgImage = bgGraphics.get();
            bgImage.mask(maskGraphics.get());
            //Draw the masked image
            p.image(bgImage, 0, 0);
        }

        // EXPORT
        const image64 = getCanvasImage('sketch');
        fileClient.exportImage64(image64, '.png', 'open-grid');
    };

    const getRandomShape = (grid: Grid): Array<GridPoint> => {
        const q1 = getPointFromSlice(grid, 0, Math.floor(grid.amountY / 2), 0, Math.floor(grid.amountX / 2));
        const q2 = getPointFromSlice(
            grid,
            0,
            Math.floor(grid.amountY / 2),
            Math.floor(grid.amountX / 2) + 1,
            grid.amountX - 1,
        );
        const q3 = getPointFromSlice(
            grid,
            Math.floor(grid.amountY / 2),
            grid.amountY - 1,
            Math.floor(grid.amountX / 2) + 1,
            grid.amountX - 1,
        );
        const q4 = getPointFromSlice(
            grid,
            Math.floor(grid.amountY / 2),
            grid.amountY - 1,
            0,
            Math.floor(grid.amountX / 2),
        );

        return [q1, q2, q3, q4];
    };

    const getPointFromSlice = (
        grid: Grid,
        startYIndex: number,
        stopYIndex: number,
        startXIndex: number,
        stopXIndex: number,
    ): GridPoint => {
        const slice = grid.slice(startYIndex, stopYIndex, startXIndex, stopXIndex);
        const slicedGrid = new Grid(slice[0].length, slice.length, 0, 0);
        slicedGrid.set(slice);
        const randomPoint = slicedGrid.getRandomPoint();
        return randomPoint;
    };

    const randomGridSlice = (
        grid: Grid,
        {
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
        }: {
            minWidth: number;
            maxWidth: number;
            minHeight: number;
            maxHeight: number;
        },
    ): Grid => {
        // Get a portion a the grid to construct the shape
        // TODO better adjustable max width
        const indexYStart = randomInt(1, grid.amountY - minHeight - 1);
        const indexYMinEnd = indexYStart + minHeight;
        const indexYMaxEnd = Math.min(indexYStart + maxHeight, grid.amountY - 1);
        const indexYEnd = randomInt(indexYMinEnd, indexYMaxEnd);

        const indexXStart = randomInt(1, grid.amountX - minWidth - 1);
        const indexXMinEnd = indexXStart + minWidth;
        const indexXMaxEnd = Math.min(indexXStart + maxWidth, grid.amountX - 1);
        const indexXEnd = randomInt(indexXMinEnd, indexXMaxEnd);

        const slice = grid.slice(indexYStart, indexYEnd, indexXStart, indexXEnd);
        const slicedGrid = new Grid(slice[0].length, slice.length, 0, 0);
        slicedGrid.set(slice);
        return slicedGrid;
    };

    // GRAPHICS
    const drawLineBG = (grapics: p5.Graphics): p5.Graphics => {
        const hue = randomInt(0, 361);
        // grapics.background(hue, 50, 100);
        grapics.fill(hue, 100, 100);
        grapics.noStroke();
        iterator(Math.floor(grapics.height / LINE_THICKNESS), (index: number) => {
            grapics.rect(0, 2 * index * LINE_THICKNESS, grapics.width, LINE_THICKNESS);
        });
        return grapics;
    };

    // UTILITES
    const randomInt = (min: number, max: number): number => {
        return Math.floor(Math.random() * (max - min)) + min;
    };

    const iterator = (amount: number, func: (index: number) => void) => {
        Array(amount)
            .fill(0)
            .forEach((e, i) => func(i));
    };

    const chance = (n: number): boolean => Math.random() < n;

    // EVENTS
    p.mouseClicked = () => {
        p.redraw();
    };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const myP5 = new p5(s);
