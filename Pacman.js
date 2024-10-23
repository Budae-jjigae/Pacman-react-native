import { PacmanAudio } from './PacmanAudio';
import { PacmanMap } from './PacmanMap';
import { PacmanGhost } from './PacmanGhost';
import { PacmanUser } from './PacmanUser';
import { GAME_STATES, PACMAN_CONFIG } from './PacmanConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PACMAN = (function () {

    let state = GAME_STATES.WAITING,
        audio = null,
        ghosts = [],
        ghostSpecs = ["#00FFDE", "#FF0000", "#FFB8DE", "#FFB847"],
        eatenCount = 0,
        level = 0,
        tick = 0,
        ghostPos, userPos,
        stateChanged = true,
        timerStart = null,
        lastTime = 0,
        map = null,
        user = null;

    let score = 0; // 상태 관리를 위해 useState를 대체

    function getTick() { 
        return tick;
    }

    async function soundDisabled() {
        const soundStatus = await AsyncStorage.getItem("soundDisabled");
        return soundStatus === "true";
    }

    function dialog(text, updateDialog) {
        updateDialog(text);  // This will update the dialog in the React Native compone, updateDialog);
    }

    function startLevel() {
        user.resetPosition();
        ghosts.forEach(ghost => ghost.reset());
        audio.play("start");
        timerStart = tick;
        setState(GAME_STATES.COUNTDOWN);
    }

    function startNewGame(canvas) {
        setState(GAME_STATES.WAITING);
        level = 1;
        user.reset();
        map.reset();
        map.draw(canvas);  // canvas를 매개변수로 받음
        startLevel();
    }

    async function toggleSound() {
        const isSoundDisabled = await soundDisabled();
        if (isSoundDisabled) {
            audio.enableSound();
        } else {
            audio.disableSound();
        }
    }
    
    function pauseGame(canvas, updateDialog) {
        stored = state;
        setState(GAME_STATES.PAUSE);
        audio.pause();
        map.draw(canvas);
        dialog("Paused", updateDialog);
    }
    
    function resumeGame(canvas, updateDialog) {
        setState(stored);
        audio.resume();
        map.draw(canvas);
        dialog("", updateDialog);
    }

    function handleKeyDown(direction) {
        if (state !== GAME_STATES.PAUSE) {
            user.handleMove(direction);
        }
    }

    function loseLife() {
        setState(GAME_STATES.WAITING);
        user.loseLife();
        if (user.getLives() > 0) {
            startLevel();
        }
    }

    function setState(newState) {
        state = newState;
        stateChanged = true;
    }

    function collided(user, ghost) {
        return (Math.sqrt(Math.pow(ghost.x - user.x, 2) + 
                          Math.pow(ghost.y - user.y, 2))) < 10;
    }

    function drawFooter(canvas) {
        const ctx = canvas.getContext('2d');
        const topLeft = (map.height * map.blockSize),
            textBase = topLeft + 17;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, topLeft, (map.width * map.blockSize), 30);

        ctx.fillStyle = "#FFFF00";
        ctx.font = "14px BDCartoonShoutRegular";
        ctx.fillText(`Score: ${user.theScore()}`, 30, textBase);
        ctx.fillText(`Level: ${level}`, 260, textBase);
    }

    function mainDraw(canvas, setScore) {
        const ctx = canvas.getContext('2d');
        let u;
        ghostPos = ghosts.map(ghost => ghost.move(ctx));
        u = user.move(ctx);

        ghostPos.forEach(ghostPos => redrawBlock(ghostPos.old));
        redrawBlock(u.old);

        ghostPos.forEach(ghostPos => ghosts.draw(ctx));
        user.draw(ctx);

        userPos = u["new"];

        ghostPos.forEach((ghostPos, i) => {
            if (collided(userPos, ghostPos["new"])) {
                if (ghosts[i].isVunerable()) {
                    audio.play("eatghost");
                    ghosts[i].eat();
                    eatenCount += 1;
                    const nScore = eatenCount * 50;
                    user.addScore(nScore);
                    score = user.theScore();  // 점수 업데이트
                    setScore(score); // App.js에서 관리하는 상태 업데이트
                    setState(GAME_STATES.EATEN_PAUSE);
                    timerStart = tick;
                } else if (ghosts[i].isDangerous()) {
                    audio.play("die");
                    setState(GAME_STATES.DYING);
                    timerStart = tick;
                }
            }
        });
    }
    function redrawBlock(pos) {
        map.drawBlock(Math.floor(pos.y/10), Math.floor(pos.x/10), ctx);
        map.drawBlock(Math.ceil(pos.y/10), Math.ceil(pos.x/10), ctx);
    }

    function mainLoop(canvas, setScore, updateDialog) {
        if (state !== GAME_STATES.PAUSE) {
            tick += 1;
        }

        map.drawPills(canvas);

        if (state === GAME_STATES.PLAYING) {
            mainDraw(canvas, setScore);
        } else if (state === GAME_STATES.WAITING && stateChanged) {
            stateChanged = false;
            map.draw(canvas);
            dialog("Press N to start a New game", updateDialog);
        } else if (state === GAME_STATES.EATEN_PAUSE && (tick - timerStart) > (PACMAN_CONFIG.FPS / 3)) {
            map.draw(canvas);
            setState(GAME_STATES.PLAYING);
        } else if (state === GAME_STATES.DYING && (tick - timerStart > (PACMAN_CONFIG.FPS * 2))) {
            loseLife();
        } else if (state === GAME_STATES.COUNTDOWN) {
            const diff = 5 + Math.floor((timerStart - tick) / PACMAN_CONFIG.FPS);
            if (diff === 0) {
                map.draw(canvas);
                setState(GAME_STATES.PLAYING);
            } else if (diff !== lastTime) {
                lastTime = diff;
                map.draw(canvas);
                dialog(`Starting in: ${diff}`, updateDialog);
            }
        }

        drawFooter(canvas);
    }

    function init(canvas, root, setScore, updateDialog, blocksize) {
        const blockSize = blocksize;
        try {
            audio = new PacmanAudio({ soundDisabled });
        } catch (error) {
            console.error("Error initializing PacmanAudio:", error);
        }

        try {
            map = new PacmanMap(blockSize);
        } catch (error) {
            console.error("Error initializing PacmanMap:", error);
        }

        try {
            user = new PacmanUser({
            completedLevel,
            eatenPill
            }, map);
        } catch (error) {
            console.error("Error initializing PacmanUser:", error);
        }
        
        
        if (!map || !user || !map.blockSize) {
            console.error("map, game, 또는 blockSize가 정의되지 않았습니다.");
            return;
        }

        
        ghostSpecs.forEach((color, i) => {
            const ghost = new PacmanGhost(getTick, map, color);
            ghosts.push(ghost);

        });
        
    

        map.draw(canvas);
        dialog("Loading ...", updateDialog);

        const audio_files = [
            ["start", "opening_song.mp3"],
            ["die", "die.mp3"],
            ["eatghost", "eatghost.mp3"],
            ["eatpill", "eatpill.mp3"],
            ["eating", "eating_short.mp3"]
        ];

        load(audio_files, () => loaded(canvas, setScore, updateDialog));
    }

    function eatenPill() {
        audio.play("eatpill");
        timerStart = tick;
        eatenCount = 0;
        for (i = 0; i < ghosts.length; i += 1) {
            ghosts[i].makeEatable(ctx);
        }        
    };

    function load(arr, callback) {
        if (arr.length === 0) {
            callback();
        } else {
            const x = arr.pop();
            audio.load(x[0], x[1], () => load(arr, callback));
        }
    }

    function completedLevel() {
        setState(WAITING);
        level += 1;
        map.reset();
        user.newLevel();
        startLevel();
    };

    function loaded(canvas, setScore, updateDialog) {
        if (!canvas) {
            console.error('Canvas is not passed correctly');
        }
        if (!setScore) {
            console.error('setScore is not passed correctly');
        }
        if (!updateDialog) {
            console.error('updateDialog is not passed correctly');
        }
        dialog("Press N to Start", updateDialog);
        timer = setInterval(() => mainLoop(canvas, setScore, updateDialog), 1000 / PACMAN_CONFIG.FPS);
    }

    return {
        init,
        handleKeyDown,
        startNewGame,
        toggleSound,
        pauseGame,
        resumeGame
    };
}());

export default PACMAN;
