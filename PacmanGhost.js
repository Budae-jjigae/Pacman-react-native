import { PACMAN_CONFIG, DIRECTIONS } from './PacmanConstants';

export const PacmanGhost = function (game, map, colour) {

    let position = null;
    let direction = null;
    let eatable = null;
    let eaten = null;
    let due = null;


    function getNewCoord(dir, current) {
        let speed = isVunerable() ? 1 : isHidden() ? 4 : 2;
        let xSpeed = (dir === DIRECTIONS.LEFT && -speed || dir === DIRECTIONS.RIGHT && speed || 0);
        let ySpeed = (dir === DIRECTIONS.DOWN && speed || dir === DIRECTIONS.UP && -speed || 0);

        return {
            x: addBounded(current.x, xSpeed),
            y: addBounded(current.y, ySpeed)
        };
    }

    function addBounded(x1, x2) {
        let rem = x1 % 10;
        let result = rem + x2;
        if (rem !== 0 && result > 10) {
            return x1 + (10 - rem);
        } else if (rem > 0 && result < 0) {
            return x1 - rem;
        }
        return x1 + x2;
    }

    function isVunerable() {
        return eatable !== null;
    }

    function isDangerous() {
        return eaten === null;
    }

    function isHidden() {
        return eatable === null && eaten !== null;
    }

    function getRandomDirection() {
        let moves = (direction === DIRECTIONS.LEFT || direction === DIRECTIONS.RIGHT)
            ? [DIRECTIONS.UP, DIRECTIONS.DOWN] : [DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
        return moves[Math.floor(Math.random() * 2)];
    }

    function reset() {
        eaten = null;
        eatable = null;
        position = { x: 90, y: 80 };
        direction = getRandomDirection();
        due = getRandomDirection();
    }

    function onWholeSquare(x) {
        return x % 10 === 0;
    }

    function oppositeDirection(dir) {
        return dir === DIRECTIONS.LEFT && DIRECTIONS.RIGHT ||
            dir === DIRECTIONS.RIGHT && DIRECTIONS.LEFT ||
            dir === DIRECTIONS.UP && DIRECTIONS.DOWN || DIRECTIONS.UP;
    }

    function makeEatable() {
        direction = oppositeDirection(direction);
        eatable = game.getTick();
    }

    function eat() {
        eatable = null;
        eaten = game.getTick();
    }

    function pointToCoord(x) {
        return Math.round(x / 10);
    }

    function nextSquare(x, dir) {
        let rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir === DIRECTIONS.RIGHT || dir === DIRECTIONS.DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    }
    function logState() {
        console.log(`Position: ${position}, Direction: ${direction}, Colour: ${colour}`);
    }
    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    }

    function secondsAgo(tick) {
        return (game.getTick() - tick) / PACMAN_CONFIG.FPS;
    }

    function getColour() {
        if (eatable) {
            if (secondsAgo(eatable) > 5) {
                return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
            } else {
                return "#0000BB";
            }
        } else if (eaten) {
            return "#222";
        }
        return colour;
    }

    async function draw(canvas) {
        const ctx = canvas.getContext('2d');

        const s = map.blockSize;
        const top = (position.y / 10) * s;
        const left = (position.x / 10) * s;

        if (eatable && secondsAgo(eatable) > 8) {
            eatable = null;
        }

        if (eaten && secondsAgo(eaten) > 3) {
            eaten = null;
        }

        const tl = left + s;
        const base = top + s - 3;
        const inc = s / 10;

        const high = game.getTick() % 10 > 5 ? 3 : -3;
        const low = game.getTick() % 10 > 5 ? -3 : 3;

        ctx.fillStyle = getColour();
        ctx.beginPath();

        ctx.moveTo(left, base);

        ctx.quadraticCurveTo(left, top, left + (s / 2), top);
        ctx.quadraticCurveTo(left + s, top, left + s, base);

        // Wavy things at the bottom
        ctx.quadraticCurveTo(tl - (inc * 1), base + high, tl - (inc * 2), base);
        ctx.quadraticCurveTo(tl - (inc * 3), base + low, tl - (inc * 4), base);
        ctx.quadraticCurveTo(tl - (inc * 5), base + high, tl - (inc * 6), base);
        ctx.quadraticCurveTo(tl - (inc * 7), base + low, tl - (inc * 8), base);
        ctx.quadraticCurveTo(tl - (inc * 9), base + high, tl - (inc * 10), base);

        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.beginPath();
        ctx.fillStyle = "#FFF";
        ctx.arc(left + 6, top + 6, s / 6, 0, 2 * Math.PI, false);
        ctx.arc((left + s) - 6, top + 6, s / 6, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();

        // PDIRECTIONS.upils
        const f = s / 12;
        const off = {
            [DIRECTIONS.RIGHT]: [f, 0],
            [DIRECTIONS.LEFT]: [-f, 0],
            [DIRECTIONS.UP]: [0, -f],
            [DIRECTIONS.DOWN]: [0, f]
        };

        ctx.beginPath();
        ctx.fillStyle = "#000";
        ctx.arc(left + 6 + off[direction][0], top + 6 + off[direction][1], s / 15, 0, 2 * Math.PI, false);
        ctx.arc((left + s) - 6 + off[direction][0], top + 6 + off[direction][1], s / 15, 0, 2 * Math.PI, false);
        ctx.closePath();
        ctx.fill();
    }

    function pane(pos) {
        if (pos.y === 100 && pos.x >= 190 && direction === DIRECTIONS.RIGHT) {
            return { y: 100, x: -10 };
        }

        if (pos.y === 100 && pos.x <= -10 && direction === DIRECTIONS.LEFT) {
            return position = { y: 100, x: 190 };
        }

        return false;
    }

    function move(canvas) {
        let oldPos = position;
        let onGrid = onGridSquare(position);
        let npos = null;

        if (due !== direction) {
            npos = getNewCoord(due, position);

            if (onGrid &&
                map.isFloorSpace({
                    y: pointToCoord(nextSquare(npos.y, due)),
                    x: pointToCoord(nextSquare(npos.x, due))
                })) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGrid &&
            map.isWallSpace({
                y: pointToCoord(nextSquare(npos.y, direction)),
                x: pointToCoord(nextSquare(npos.x, direction))
            })) {
            due = getRandomDirection();
            return move(canvas);
        }

        position = npos;

        const tmp = pane(position);
        if (tmp) {
            position = tmp;
        }

        due = getRandomDirection();

        return {
            new: position,
            old: oldPos
        };
    }

    return {
        eat,
        isVunerable,
        isDangerous,
        makeEatable,
        reset,
        move,
        draw,
        logState
    };
};
