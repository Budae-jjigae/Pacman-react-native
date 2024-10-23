import { BLOCK_TYPES, DIRECTIONS} from './PacmanConstants';

export const PacmanUser = function (game, map) {

    let position = null;
    let direction = null;
    let eaten = null;
    let due = null;
    let lives = null;
    let score = 5;
    let keyMap = {
        LEFT: DIRECTIONS.LEFT,
        UP:  DIRECTIONS.UP,
        RIGHT:  DIRECTIONS.RIGHT,
        DOWN:  DIRECTIONS.DOWN
    };

    function addScore(nScore) {
        score += nScore;
        if (score >= 10000 && score - nScore < 10000) {
            lives += 1;
        }
    }

    function theScore() {
        return score;
    }

    function loseLife() {
        lives -= 1;
    }

    function getLives() {
        return lives;
    }

    function initUser() {
        score = 0;
        lives = 3;
        newLevel();
    }

    function newLevel() {
        resetPosition();
        eaten = 0;
    }

    function resetPosition() {
        position = { x: 90, y: 120 };
        direction = DIRECTIONS.LEFT;
        due = DIRECTIONS.LEFT;
    }

    function reset() {
        initUser();
        resetPosition();
    }

    function handleMove(direction) {
        due = keyMap[direction];
    }

    function getNewCoord(dir, current) {
        return {
            x: current.x + (dir === DIRECTIONS.LEFT ? -2 : dir ===  DIRECTIONS.RIGHT ? 2 : 0),
            y: current.y + (dir ===  DIRECTIONS.DOWN ? 2 : dir ===  DIRECTIONS.UP ? -2 : 0)
        };
    }

    function onWholeSquare(x) {
        return x % 10 === 0;
    }

    function pointToCoord(x) {
        return Math.round(x / 10);
    }

    function nextSquare(x, dir) {
        const rem = x % 10;
        if (rem === 0) {
            return x;
        } else if (dir ===  DIRECTIONS.RIGHT || dir ===  DIRECTIONS.DOWN) {
            return x + (10 - rem);
        } else {
            return x - rem;
        }
    }

    function next(pos, dir) {
        return {
            y: pointToCoord(nextSquare(pos.y, dir)),
            x: pointToCoord(nextSquare(pos.x, dir))
        };
    }

    function onGridSquare(pos) {
        return onWholeSquare(pos.y) && onWholeSquare(pos.x);
    }

    function isOnSamePlane(due, dir) {
        return ((due === DIRECTIONS.LEFT || due ===  DIRECTIONS.RIGHT) && (dir === DIRECTIONS.LEFT || dir ===  DIRECTIONS.RIGHT)) ||
            ((due ===  DIRECTIONS.UP || due ===  DIRECTIONS.DOWN) && (dir ===  DIRECTIONS.UP || dir ===  DIRECTIONS.DOWN));
    }

    function move(canvas) {
        let npos = null;
        let nextWhole = null;
        let oldPosition = position;
        let block = null;

        if (due !== direction) {
            npos = getNewCoord(due, position);

            if (isOnSamePlane(due, direction) ||
                (onGridSquare(position) && map.isFloorSpace(next(npos, due)))) {
                direction = due;
            } else {
                npos = null;
            }
        }

        if (npos === null) {
            npos = getNewCoord(direction, position);
        }

        if (onGridSquare(position) && map.isWallSpace(next(npos, direction))) {
            direction = DIRECTIONS.NONE;
        }

        if (direction === DIRECTIONS.NONE) {
            return { new: position, old: position };
        }

        if (npos.y === 100 && npos.x >= 190 && direction ===  DIRECTIONS.RIGHT) {
            npos = { y: 100, x: -10 };
        }

        if (npos.y === 100 && npos.x <= -12 && direction === DIRECTIONS.LEFT) {
            npos = { y: 100, x: 190 };
        }

        position = npos;
        nextWhole = next(position, direction);

        block = map.block(nextWhole);

        if ((isMidSquare(position.y) || isMidSquare(position.x)) &&
            (block === BLOCK_TYPES.BISCUIT || block === BLOCK_TYPES.PILL)) {

            map.setBlock(nextWhole, BLOCK_TYPES.EMPTY);
            addScore(block === BLOCK_TYPES.BISCUIT ? 10 : 50);
            eaten += 1;

            if (eaten === 182) {
                game.completedLevel();
            }

            if (block === BLOCK_TYPES.PILL) {
                game.eatenPill();
            }
        }

        return {
            new: position,
            old: oldPosition
        };
    }

    function isMidSquare(x) {
        const rem = x % 10;
        return rem > 3 || rem < 7;
    }

    function calcAngle(dir, pos) {
        if (dir ===  DIRECTIONS.RIGHT && (pos.x % 10 < 5)) {
            return { start: 0.25, end: 1.75, direction: false };
        } else if (dir ===  DIRECTIONS.DOWN && (pos.y % 10 < 5)) {
            return { start: 0.75, end: 2.25, direction: false };
        } else if (dir ===  DIRECTIONS.UP && (pos.y % 10 < 5)) {
            return { start: 1.25, end: 1.75, direction: true };
        } else if (dir === DIRECTIONS.LEFT && (pos.x % 10 < 5)) {
            return { start: 0.75, end: 1.25, direction: true };
        }
        return { start: 0, end: 2, direction: false };
    }

    async function draw(canvas) {
        if (!canvas) {
            console.error('Canvas가 정의되지 않았습니다.');
            return;
        }
        const ctx = canvas.getContext('2d');
        const s = map.blockSize;
        const angle = calcAngle(direction, position);

        ctx.fillStyle = "#FFFF00";

        ctx.beginPath();
        ctx.moveTo(((position.x / 10) * s) + s / 2, ((position.y / 10) * s) + s / 2);

        ctx.arc(((position.x / 10) * s) + s / 2,
            ((position.y / 10) * s) + s / 2,
            s / 2, Math.PI * angle.start,
            Math.PI * angle.end, angle.direction);

        ctx.fill();
    }

    function drawDead(canvas, amount) {
        const ctx = canvas.getContext('2d');
        const size = map.blockSize;
        const half = size / 2;

        if (amount >= 1) {
            return;
        }

        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.moveTo(((position.x / 10) * size) + half,
            ((position.y / 10) * size) + half);

        ctx.arc(((position.x / 10) * size) + half,
            ((position.y / 10) * size) + half,
            half, 0, Math.PI * 2 * amount, true);

        ctx.fill();
    }

    initUser();

    return {
        draw,
        drawDead,
        loseLife,
        getLives,
        score,
        addScore,
        theScore,
        handleMove, // 변경된 부분: 터치/버튼 입력 처리
        move,
        newLevel,
        reset,
        resetPosition
    };
};
