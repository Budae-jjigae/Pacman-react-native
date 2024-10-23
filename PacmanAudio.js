import Sound from 'react-native-sound';


export const PacmanAudio = function (game) {

    const files = {};         // 오디오 파일 객체
    let playing = [];         // 재생 중인 오디오 파일 배열

    // 오디오 파일을 로드하는 함수
    function load(name, path, cb) {
        const sound = new Sound(path, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('Failed to load the sound', error, 'for path:', path);
                return;
            }
            files[name] = sound;
            if (typeof cb === 'function') {
                cb();
            }
            console.log('Sound loaded:', name);
        });
    }

    // 모든 사운드를 중지시키는 함수
    function disableSound() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].stop(() => {});
            files[playing[i]].setCurrentTime(0);
        }
        playing = [];
    }

    // 재생이 끝났을 때 처리하는 함수
    function ended(name) {
        playing = playing.filter((item) => item !== name);
    }

    // 오디오 파일을 재생하는 함수
    function play(name) {
        if (!game.soundDisabled()) {
            playing.push(name);
            files[name].play(() => ended(name));  // 재생 후 종료 처리
        }
    }

    // 현재 재생 중인 사운드를 일시정지하는 함수
    function pause() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].pause();
        }
    }

    // 일시정지된 사운드를 다시 재생하는 함수
    function resume() {
        for (let i = 0; i < playing.length; i++) {
            files[playing[i]].play();
        }
    }

    return {
        "disableSound": disableSound,
        "load": load,
        "play": play,
        "pause": pause,
        "resume": resume
    };
};
