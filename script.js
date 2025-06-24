// 取得 HTML 元素
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const player_scoreDisplay = document.getElementById('playerScore');
const ai_scoreDisplay = document.getElementById('aiScore');
const startButton = document.getElementById('startButton');
const difficultySelection = document.getElementById('difficultySelection');
const difficultyButtons = document.querySelectorAll('.difficulty-button');

// 遊戲設定
const gridSize = 20; // 每個遊戲方塊的大小 (像素)
const canvasWidth = gameCanvas.width;
const canvasHeight = gameCanvas.height;

// 玩家蛇和 AI 蛇的數據結構
let playerSnake = [];
let aiSnake = [];
let food = {}; // 食物的座標

let playerScore = 0;
let aiScore = 0;

let playerDirection = 'right'; // 玩家蛇的初始方向
let aiDirection = 'down';     // AI 蛇的初始方向

let changingPlayerDirection = false; // 防止玩家蛇連續改變方向
let gameInterval;
let gameSpeed = 150; // 遊戲速度 (毫秒), 數值越小速度越快
let currentDifficulty = 'medium'; // 預設難度

let gameActive = false; // 追蹤遊戲是否正在進行中

// 難度設定
const difficultySettings = {
    easy: { speed: 200, aiUpdateFreq: 3 },  // 慢速，AI 每 3 步計算一次
    medium: { speed: 150, aiUpdateFreq: 2 }, // 中速，AI 每 2 步計算一次
    hard: { speed: 100, aiUpdateFreq: 1 }   // 快速，AI 每 1 步計算一次 (每幀計算)
};
let aiMoveCounter = 0; // 用於控制 AI 更新頻率的計數器

// --- 遊戲初始化與重設 ---
function initializeGame() {
    gameActive = true;
    startButton.style.display = 'none'; // 遊戲開始後隱藏開始按鈕
    difficultySelection.style.display = 'none'; // 隱藏難易度選擇

    // 根據選擇的難度設定遊戲速度
    gameSpeed = difficultySettings[currentDifficulty].speed;
    aiMoveCounter = 0; // 重置 AI 計數器

    playerSnake = [
        { x: 5 * gridSize, y: 5 * gridSize }
    ];
    playerScore = 0;
    player_scoreDisplay.textContent = `玩家分數: ${playerScore}`;
    playerDirection = 'right';
    changingPlayerDirection = false;

    aiSnake = [
        { x: (canvasWidth / gridSize - 6) * gridSize, y: (canvasHeight / gridSize - 6) * gridSize }
    ];
    aiScore = 0;
    ai_scoreDisplay.textContent = `電腦分數: ${aiScore}`;
    aiDirection = 'up';

    generateFood();

    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, gameSpeed);

    drawGame(); // 繪製初始遊戲畫面
}

// 繪製遊戲的所有元素
function drawGame() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // 清除畫布
    drawFood(); // 繪製食物
    // 玩家蛇：深綠頭，淺綠身
    drawSnake(playerSnake, '#388E3C', '#A5D6A7', playerDirection, '玩家');
    // AI 蛇：藍綠頭，更淺藍綠身
    drawSnake(aiSnake, '#0097A7', '#80DEEA', aiDirection, '電腦');
}

// --- 繪製遊戲元素 (精緻化與簡化) ---

// 繪製圓角矩形，用於蛇身和介面背景
function drawRoundedRect(x, y, width, height, radius, color, strokeColor = 'rgba(0,0,0,0.05)', strokeWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
}

// 繪製蛇 (帶造型，新增 text 參數)
function drawSnake(snakeBody, headColor, bodyColor, currentDirection, text) {
    snakeBody.forEach((segment, index) => {
        const x = segment.x;
        const y = segment.y;

        if (index === 0) {
            // 繪製蛇頭 (使用圓角矩形)
            drawRoundedRect(x, y, gridSize, gridSize, gridSize * 0.2, headColor, 'rgba(0,0,0,0.1)', 1);

            // 繪製簡化版眼睛 (兩個黑點)
            ctx.fillStyle = 'black';
            const eyeRadius = gridSize * 0.1;
            const eyeOffset = gridSize * 0.3;

            let eye1X, eye1Y, eye2X, eye2Y;

            switch (currentDirection) {
                case 'up':
                    eye1X = x + eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + gridSize - eyeOffset;
                    eye2Y = y + eyeOffset;
                    break;
                case 'down':
                    eye1X = x + eyeOffset;
                    eye1Y = y + gridSize - eyeOffset;
                    eye2X = x + gridSize - eyeOffset;
                    eye2Y = y + gridSize - eyeOffset;
                    break;
                case 'left':
                    eye1X = x + eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + eyeOffset;
                    eye2Y = y + gridSize - eyeOffset;
                    break;
                case 'right':
                    eye1X = x + gridSize - eyeOffset;
                    eye1Y = y + eyeOffset;
                    eye2X = x + gridSize - eyeOffset;
                    eye2Y = y + gridSize - eyeOffset;
                    break;
            }

            ctx.beginPath();
            ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            // 在蛇頭上方顯示文字
            ctx.fillStyle = 'white'; // 文字顏色
            ctx.font = 'bold 12px "Segoe UI", sans-serif'; // 文字大小和字體
            ctx.textAlign = 'center'; // 文字居中
            ctx.textBaseline = 'middle'; // 文字垂直居中

            let textYOffset = 0;
            switch(currentDirection) {
                case 'up': textYOffset = -gridSize * 0.4; break;
                case 'down': textYOffset = gridSize * 1.4; break;
                case 'left':
                case 'right': textYOffset = -gridSize * 0.4; break;
            }
            ctx.fillText(text, x + gridSize / 2, y + textYOffset);

        } else {
            // 繪製蛇身 (使用圓角矩形)
            drawRoundedRect(x, y, gridSize, gridSize, gridSize * 0.2, bodyColor, 'rgba(0,0,0,0.05)', 1);
        }
    });
}

// 繪製食物 (簡化為一個圓形)
function drawFood() {
    const x = food.x;
    const y = food.y;
    const foodRadius = gridSize * 0.4;

    ctx.beginPath();
    ctx.arc(x + gridSize / 2, y + gridSize / 2, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFC107'; // 黃色
    ctx.fill();
    ctx.strokeStyle = '#FF8F00'; // 深黃色邊框
    ctx.lineWidth = 2;
    ctx.stroke();

    // 簡單反光
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x + gridSize * 0.7, y + gridSize * 0.3, foodRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
}


function generateFood() {
    let newFoodX, newFoodY;
    let collisionDetected;

    do {
        newFoodX = Math.floor(Math.random() * (canvasWidth / gridSize)) * gridSize;
        newFoodY = Math.floor(Math.random() * (canvasHeight / gridSize)) * gridSize;

        collisionDetected = false;
        for (let i = 0; i < playerSnake.length; i++) {
            if (playerSnake[i].x === newFoodX && playerSnake[i].y === newFoodY) {
                collisionDetected = true;
                break;
            }
        }
        if (!collisionDetected) {
            for (let i = 0; i < aiSnake.length; i++) {
                if (aiSnake[i].x === newFoodX && aiSnake[i].y === newFoodY) {
                    collisionDetected = true;
                    break;
                }
            }
        }
    } while (collisionDetected);

    food = { x: newFoodX, y: newFoodY };
}

// --- 遊戲邏輯 ---

function moveSnake(snakeBody, currentDirection, isPlayer) {
    const head = { x: snakeBody[0].x, y: snakeBody[0].y };

    switch (currentDirection) {
        case 'up':
            head.y -= gridSize;
            break;
        case 'down':
            head.y += gridSize;
            break;
        case 'left':
            head.x -= gridSize;
            break;
        case 'right':
            head.x += gridSize;
            break;
    }

    // 處理碰壁穿越
    if (head.x < 0) {
        head.x = canvasWidth - gridSize;
    } else if (head.x >= canvasWidth) {
        head.x = 0;
    }
    if (head.y < 0) {
        head.y = canvasHeight - gridSize;
    } else if (head.y >= canvasHeight) {
        head.y = 0;
    }

    snakeBody.unshift(head);

    const didEatFood = head.x === food.x && head.y === food.y;
    if (didEatFood) {
        if (isPlayer) {
            playerScore += 10;
            player_scoreDisplay.textContent = `玩家分數: ${playerScore}`;
        } else {
            aiScore += 10;
            ai_scoreDisplay.textContent = `電腦分數: ${aiScore}`;
        }
        generateFood();
    } else {
        snakeBody.pop();
    }
}

// AI 蛇的移動邏輯 (根據難度調整更新頻率)
function moveAISnake() {
    aiMoveCounter++;
    // 只有當計數器達到難度設定的頻率時，才重新計算 AI 方向
    if (aiMoveCounter % difficultySettings[currentDifficulty].aiUpdateFreq !== 0) {
        // 如果不更新，AI 沿用上一次的方向
        return;
    }
    aiMoveCounter = 0; // 重置計數器

    const aiHead = aiSnake[0];
    let possibleMoves = [];
    const directions = ['up', 'down', 'left', 'right'];

    // 確保 AI 不會立即反向移動
    const forbiddenDir = {
        'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left'
    }[aiDirection];

    directions.forEach(dir => {
        if (dir === forbiddenDir) return; // 避免反向

        let nextX = aiHead.x;
        let nextY = aiHead.y;
        switch (dir) {
            case 'up': nextY -= gridSize; break;
            case 'down': nextY += gridSize; break;
            case 'left': nextX -= gridSize; break;
            case 'right': nextX += gridSize; break;
        }

        // 處理穿越後的實際座標
        if (nextX < 0) nextX = canvasWidth - gridSize;
        else if (nextX >= canvasWidth) nextX = 0;
        if (nextY < 0) nextY = canvasHeight - gridSize;
        else if (nextY >= canvasHeight) nextY = 0;

        let willCollide = false;
        // 檢查是否會撞到 AI 蛇自己 (不考慮即將消失的尾巴)
        for (let i = 0; i < aiSnake.length - 1; i++) {
            if (nextX === aiSnake[i].x && nextY === aiSnake[i].y) {
                willCollide = true;
                break;
            }
        }
        // 檢查是否會撞到玩家蛇 (所有節點)
        if (!willCollide) {
            for (let i = 0; i < playerSnake.length; i++) {
                if (nextX === playerSnake[i].x && nextY === playerSnake[i].y) {
                    willCollide = true;
                    break;
                }
            }
        }
        
        if (!willCollide) {
            possibleMoves.push(dir);
        }
    });

    if (possibleMoves.length === 0) {
        // 如果沒有安全的路徑，AI 仍然可能死亡。這裡讓它隨機選一個方向
        aiDirection = directions[Math.floor(Math.random() * directions.length)];
        return;
    }

    let bestMove = possibleMoves[0];
    let minDistance = Infinity;

    possibleMoves.forEach(dir => {
        let nextX = aiHead.x;
        let nextY = aiHead.y;
        switch (dir) {
            case 'up': nextY -= gridSize; break;
            case 'down': nextY += gridSize; break;
            case 'left': nextX -= gridSize; break;
            case 'right': nextX += gridSize; break;
        }

        // 處理穿越後的距離計算
        if (nextX < 0) nextX = canvasWidth - gridSize;
        else if (nextX >= canvasWidth) nextX = 0;
        if (nextY < 0) nextY = canvasHeight - gridSize;
        else if (nextY >= canvasHeight) nextY = 0;
        
        const dist = Math.abs(nextX - food.x) + Math.abs(nextY - food.y); // 曼哈頓距離
        if (dist < minDistance) {
            minDistance = dist;
            bestMove = dir;
        }
    });
    
    aiDirection = bestMove;
}


function checkCollision(snakeHead, snakeBody, otherSnakeBody) {
    for (let i = 1; i < snakeBody.length; i++) {
        if (snakeHead.x === snakeBody[i].x && snakeHead.y === snakeBody[i].y) {
            return true;
        }
    }
    for (let i = 0; i < otherSnakeBody.length; i++) {
        if (snakeHead.x === otherSnakeBody[i].x && snakeHead.y === otherSnakeBody[i].y) {
            return true;
        }
    }
    return false;
}

// --- 遊戲主循環 ---
function gameLoop() {
    if (!gameActive) return;

    moveAISnake(); // AI 根據頻率移動

    moveSnake(playerSnake, playerDirection, true);
    moveSnake(aiSnake, aiDirection, false);

    const playerLost = checkCollision(playerSnake[0], playerSnake, aiSnake);
    const aiLost = checkCollision(aiSnake[0], aiSnake, playerSnake);

    if (playerLost || aiLost) {
        clearInterval(gameInterval);
        gameActive = false;
        displayEndScreen(playerLost, aiLost);
        return;
    }

    changingPlayerDirection = false;
    drawGame();
}

// --- 遊戲結束介面 ---
function displayEndScreen(playerLost, aiLost) {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight); // 清空畫布

    let resultText = '';
    let textColor = '';
    let bgColor = '';

    if (playerLost && aiLost) {
        resultText = '平手！';
        textColor = '#607D8B'; // 藍灰色
        bgColor = 'rgba(236, 239, 241, 0.9)'; // 淺藍灰
    } else if (playerLost) {
        resultText = '你輸了！';
        textColor = '#D32F2F'; // 紅色
        bgColor = 'rgba(255, 235, 238, 0.9)'; // 淺紅
    } else if (aiLost) {
        resultText = '你贏了！';
        textColor = '#388E3C'; // 深綠色
        bgColor = 'rgba(232, 245, 233, 0.9)'; // 淺綠
    }

    // 繪製半透明背景卡片
    ctx.fillStyle = bgColor;
    ctx.roundRect(canvasWidth * 0.1, canvasHeight * 0.2, canvasWidth * 0.8, canvasHeight * 0.6, 20);
    ctx.fill();
    ctx.strokeStyle = textColor;
    ctx.lineWidth = 3;
    ctx.stroke();


    // 顯示結果文字
    ctx.fillStyle = textColor;
    ctx.font = 'bold 50px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(resultText, canvasWidth / 2, canvasHeight / 2 - 60);

    // 顯示分數
    ctx.fillStyle = '#333333';
    ctx.font = 'normal 28px "Segoe UI", sans-serif';
    ctx.fillText(`玩家分數: ${playerScore}`, canvasWidth / 2, canvasHeight / 2 + 10);
    ctx.fillText(`電腦分數: ${aiScore}`, canvasWidth / 2, canvasHeight / 2 + 50);

    // 重新開始按鈕
    startButton.textContent = '重新開始';
    startButton.style.display = 'block';
    difficultySelection.style.display = 'flex'; // 重新顯示難易度選擇
}


// --- 事件監聽器 ---

function changePlayerDirection(event) {
    if (!gameActive || changingPlayerDirection) return;

    const keyPressed = event.keyCode;
    const goingUp = playerDirection === 'up';
    const goingDown = playerDirection === 'down';
    const goingLeft = playerDirection === 'left';
    const goingRight = playerDirection === 'right';

    const LEFT_KEY = 37;
    const UP_KEY = 38;
    const RIGHT_KEY = 39;
    const DOWN_KEY = 40;

    if (keyPressed === LEFT_KEY && !goingRight) {
        playerDirection = 'left';
        changingPlayerDirection = true;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        playerDirection = 'up';
        changingDirection = true;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        playerDirection = 'right';
        changingDirection = true;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        playerDirection = 'down';
        changingDirection = true;
    }
}

startButton.addEventListener('click', () => {
    initializeGame();
});

// 難易度按鈕事件監聽
difficultyButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 移除所有按鈕的 active 類
        difficultyButtons.forEach(btn => btn.classList.remove('active'));
        // 為當前點擊的按鈕添加 active 類
        button.classList.add('active');
        // 更新當前難度
        currentDifficulty = button.dataset.difficulty;
    });
});


document.addEventListener('keydown', changePlayerDirection);

// --- 初始畫面設定 ---
// 修正：為 CanvasRenderingContext2D 添加 roundRect 方法，某些瀏覽器可能需要此 Polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
        if (typeof radius === 'undefined') {
            radius = 5; // Default radius
        }
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y); // <-- 這裡原代碼錯誤修正：ctx.quadraticCurveTo
        this.closePath();
        return this;
    };
}


window.onload = () => {
    playerSnake = [{ x: 5 * gridSize, y: 5 * gridSize }];
    aiSnake = [{ x: (canvasWidth / gridSize - 6) * gridSize, y: (canvasHeight / gridSize - 6) * gridSize }];
    generateFood();

    drawInitialGreeting();
};

function drawInitialGreeting() {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    // 繪製初始畫面的蛇，帶有文字
    drawSnake(playerSnake, '#388E3C', '#A5D6A7', 'right', '玩家');
    drawSnake(aiSnake, '#0097A7', '#80DEEA', 'up', '電腦');
    drawFood();

    // 繪製歡迎介面背景卡片
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; /* 更不透明 */
    ctx.roundRect(canvasWidth * 0.1, canvasHeight * 0.2, canvasWidth * 0.8, canvasHeight * 0.6, 20);
    ctx.fill();
    ctx.strokeStyle = '#BDBDBD'; /* 淺灰色邊框 */
    ctx.lineWidth = 2;
    ctx.stroke();

    // 顯示歡迎訊息和操作提示
    ctx.fillStyle = '#4CAF50'; /* 主題綠色 */
    ctx.font = 'bold 45px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('貪食蛇人機對戰', canvasWidth / 2, canvasHeight / 2 - 80);

    ctx.fillStyle = '#333333';
    ctx.font = 'normal 26px "Segoe UI", sans-serif';
    ctx.fillText('選擇難度，擊敗電腦！', canvasWidth / 2, canvasHeight / 2);

    ctx.font = 'normal 20px "Segoe UI", sans-serif';
    ctx.fillText('玩家使用箭頭鍵控制', canvasWidth / 2, canvasHeight / 2 + 40);


    startButton.textContent = '開始遊戲';
    startButton.style.display = 'block';
    difficultySelection.style.display = 'flex'; // 顯示難易度選擇
}