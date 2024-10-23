import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Button, Alert, Dimensions  } from 'react-native';
import Canvas from 'react-native-canvas';
import PACMAN from './Pacman'; // Pacman 게임 로직이 포함된 파일

const App = () => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dialogText, setDialogText] = useState("");
  const { width, height } = Dimensions.get('window');
  const canvasWidth = width * 0.9;  // 화면 너비의 90%
  const canvasHeight = height * 0.8;  // 화면 높이의 80%
  const blockSize = 18;

  useEffect(() => {
    const initPacman = async () => {
        const canvas = canvasRef.current;
        if (canvas) {

            canvas.width = width;  // 원하는 캔버스의 내부 넓이
            canvas.height = height;  // 원하는 캔버스의 내부 높이
            try {
                ctx = await canvas.getContext('2d');

                
            } catch (error) {
                console.error('Canvas context 초기화 실패:', error);
            }

            PACMAN.init(canvas, './assets/', setScore, setDialogText, blockSize);  // setScore와 함께 canvas 전달


        } else {
            console.error('Canvas가 존재하지 않습니다.');
        }
    };

    initPacman();  // 캔버스 초F기화 실행
}, [canvasRef]);

  const showDialog = (text) => {
    setDialogText(text);
  };
  // 게임 시작
  const handleStartGame = () => {
    PACMAN.startNewGame(canvasRef.current);
  };

  // 사운드 켜기/끄기
  const handleToggleSound = async () => {
    await PACMAN.toggleSound(); // Pacman.js에서 사운드 처리 함수 구현
    Alert.alert('Sound toggled');
  };

  // 게임 일시정지/재개
  const handlePauseResume = () => {
    if (isPaused) {
      PACMAN.resumeGame(canvasRef.current, showDialog);
      setIsPaused(false);
    } else {
      PACMAN.pauseGame(canvasRef.current, showDialog);
      setIsPaused(true);
    }
  };

  return (
    <View style={styles.container}>
      <Canvas ref={canvasRef} style={{
        width: canvasWidth  , 
        height: canvasHeight,
        borderWidth: 2,
        borderColor: 'red'
          }} />
      <Text style={styles.scoreText}>Score: {score}</Text>
      {dialogText ? (
        <Text style={styles.dialogText}>{dialogText}</Text>
      ) : null}
      {/* 게임 제어를 위한 버튼들 */}
      <View style={styles.buttonContainer}>
        <Button title="Start New Game" onPress={handleStartGame} />
        <Button title="Toggle Sound" onPress={handleToggleSound} />
        <Button title={isPaused ? "Resume Game" : "Pause Game"} onPress={handlePauseResume} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  canvas: {
    width: 400,  // Pacman의 캔버스 크기
    height: 600 ,
    botrderWidth: 1,
    
  },
  scoreText: {
    color: '#FFF',
    fontSize: 20,
    marginTop: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 0,
  },
  dialogText: {
    color: '#FFFF00',
    fontSize: 14,
    textAlign: 'center', // 텍스트를 가로로 중앙 정렬
    fontFamily: 'BDCartoonShoutRegular', // 커스텀 폰트
  },
});

export default App;
