import { MAP, WALLS, BLOCK_TYPES } from './PacmanConstants';

function clone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    // 배열일 경우
    if (Array.isArray(obj)) {
        const arrCopy = [];
        obj.forEach((item, index) => {
            arrCopy[index] = clone(item); // 재귀적으로 배열 내부의 값 복사
        });
        return arrCopy;
    }

    // 객체일 경우
    const objCopy = {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            objCopy[key] = clone(obj[key]); // 재귀적으로 객체 내부의 값 복사
        }
    }
    return objCopy;
}

export const PacmanMap = function (size) {
    let height = null;
    let width = null;
    let blockSize = size;
    let pillSize = 0;
    let map = null;
    let ctx = null;

    function withinBounds(y, x) {
        return y >= 0 && y < height && x >= 0 && x < width;
    }

    function isWall(pos) {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === BLOCK_TYPES.WALL;
    }

    function isFloorSpace(pos) {
        if (!withinBounds(pos.y, pos.x)) {
            return false;
        }
        const piece = map[pos.y][pos.x];
        return piece === BLOCK_TYPES.EMPTY ||
            piece === BLOCK_TYPES.BISCUIT ||
            piece === BLOCK_TYPES.PILL;
    }
    
    async function drawWall(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";

        for (let i = 0; i < WALLS.length; i += 1) {
            const line = WALLS[i];
            ctx.beginPath();

            for (let j = 0; j < line.length; j += 1) {
                const p = line[j];

                if (p.move) {
                    ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
                } else if (p.line) {
                    ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
                } else if (p.curve) {
                    ctx.quadraticCurveTo(p.curve[0] * blockSize,
                        p.curve[1] * blockSize,
                        p.curve[2] * blockSize,
                        p.curve[3] * blockSize);
                }
            }
            ctx.stroke();
        }
    }

    function reset() {
        try{
            map = clone(MAP);
        } catch (error) {
            console.error("Error initializing PacmanMap:", error);
        }
        
        height = map.length;
        width = map[0].length;
    }

    function block(pos) {
        return map[pos.y][pos.x];
    }

    function setBlock(pos, type) {
        map[pos.y][pos.x] = type;
    }

    async function drawPills(canvas) {
        const ctx = canvas.getContext('2d');

        if (++pillSize > 30) {
            pillSize = 0;
        }

        for (let i = 0; i < height; i += 1) {
            for (let j = 0; j < width; j += 1) {
                if (map[i][j] === BLOCK_TYPES.PILL) {
                    ctx.beginPath();

                    ctx.fillStyle = "#000";
                    ctx.fillRect((j * blockSize), (i * blockSize),
                        blockSize, blockSize);

                    ctx.fillStyle = "#FFF";
                    ctx.arc((j * blockSize) + blockSize / 2,
                        (i * blockSize) + blockSize / 2,
                        Math.abs(5 - (pillSize / 3)),
                        0,
                        Math.PI * 2, false);
                    ctx.fill();
                    ctx.closePath();
                }
            }
        }
    }

    async function draw(canvas) {

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error("Canvas context를 가져오지 못했습니다.");
            return;
        }
        // if ctx is null
        

        const size = blockSize;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, canvas.width * size, canvas.height * size);


        await drawWall(canvas);


        for (let i = 0; i < height; i += 1) {
            for (let j = 0; j < width; j += 1) {
                await drawBlock(i, j, canvas);
            }
        }
    }

    async function drawBlock(y, x, canvas) {
        const ctx = canvas.getContext('2d');
        const layout = map[y][x];

        if (layout === BLOCK_TYPES.PILL) {
            return;
        }

        ctx.beginPath();

        if (layout === BLOCK_TYPES.EMPTY || layout === BLOCK_TYPES.BLOCK ||
            layout === BLOCK_TYPES.BISCUIT) {

            ctx.fillStyle = "#000";
            ctx.fillRect((x * blockSize), (y * blockSize),
                blockSize, blockSize);

            if (layout === BLOCK_TYPES.BISCUIT) {
                ctx.fillStyle = "#FFF";
                ctx.fillRect((x * blockSize) + (blockSize / 2.5),
                    (y * blockSize) + (blockSize / 2.5),
                    blockSize / 6, blockSize / 6);
            }
        }
        ctx.closePath();
    }

    reset();

    return {
        draw,
        drawBlock,
        drawPills,
        block,
        setBlock,
        reset,
        isWallSpace: isWall,
        isFloorSpace,
        height,
        width,
        blockSize
    };
};

