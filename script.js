// Переключение видимости инструкции при нажатии на кнопку
document.getElementById('toggleInstructionButton').addEventListener('click', function() {
    const instructionPanel = document.getElementById('instructionPanel');
    const isHidden = instructionPanel.classList.contains('hidden');

    if (isHidden) {
        instructionPanel.classList.remove('hidden');
        instructionPanel.classList.add('visible');
        this.textContent = 'Скрыть инструкцию'; // Меняем текст кнопки
    } else {
        instructionPanel.classList.remove('visible');
        instructionPanel.classList.add('hidden');
        this.textContent = 'Показать инструкцию'; // Меняем текст кнопки
    }
});

// Логика для свайпа
let touchStartX = 0;

document.getElementById('instructionPanel').addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
});

document.getElementById('instructionPanel').addEventListener('touchmove', function(e) {
    const touchEndX = e.touches[0].clientX;
    const distance = touchStartX - touchEndX;

    // Если пользователь свайпнул влево (больше 50 пикселей)
    if (distance > 50) {
        hideInstruction();
    }
});

// Функция для скрытия инструкции
function hideInstruction() {
    const instructionPanel = document.getElementById('instructionPanel');
    instructionPanel.classList.remove('visible');
    instructionPanel.classList.add('hidden');
    document.getElementById('toggleInstructionButton').textContent = 'Показать инструкцию'; // Меняем текст кнопки
}

// Исходный код для игры:

const canvas = document.getElementById('circleCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const clearCanvasButton = document.getElementById('clearCanvasButton');
let isDrawing = false;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
let drawnPoints = [];
let idealCircleRadius = 0;
let userStartPoint = null;
let userRadius = 0;
const snapRadius = 10;

// Для мобильных устройств
function getTouchPos(canvasDom, touchEvent) {
    const rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

// Нарисовать центральную точку
function drawCenterPoint() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'red';
    ctx.fill();
}

// Рассчитать расстояние между двумя точками
function calculateDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Рассчитать процент заполнения круга
function calculateFillPercentage() {
    let filledPixels = 0;
    let totalIdealPixels = 0;
    let penaltyPixels = 0;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

            const index = (y * canvas.width + x) * 4;
            const isInIdealCircle = distanceToCenter <= idealCircleRadius;
            const isInUserCircle = data[index + 1] > 0; // Проверяем зеленый канал

            if (isInIdealCircle) {
                totalIdealPixels++;
                if (isInUserCircle) {
                    filledPixels++;
                }
            } else if (isInUserCircle) {
                penaltyPixels++;
            }
        }
    }

    const fillPercentage = (filledPixels / totalIdealPixels) * 100;
    const penaltyPercentage = (penaltyPixels / totalIdealPixels) * 100;

    return fillPercentage - penaltyPercentage;
}

// Начало рисования (мышь)
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    userStartPoint = { x: e.offsetX, y: e.offsetY };
    drawnPoints = [userStartPoint];
});

// Рисование линии за мышью
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const x = e.offsetX;
    const y = e.offsetY;
    drawnPoints.push({ x, y });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем центральную точку
    drawCenterPoint();

    // Рисуем круг пользователя
    ctx.beginPath();
    ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
    for (let i = 1; i < drawnPoints.length; i++) {
        ctx.lineTo(drawnPoints[i].x, drawnPoints[i].y);
    }
    ctx.strokeStyle = '#4d79ff';
    ctx.lineWidth = 2;
    ctx.stroke();
});

// Завершение рисования круга (мышь)
canvas.addEventListener('mouseup', () => {
    finishDrawing();
});

// Для сенсорных экранов (начало рисования)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Предотвращаем нежелательные действия (например, прокрутку страницы)
    const touchPos = getTouchPos(canvas, e);
    isDrawing = true;
    userStartPoint = { x: touchPos.x, y: touchPos.y };
    drawnPoints = [userStartPoint];
});

// Для сенсорных экранов (рисование)
canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    const touchPos = getTouchPos(canvas, e);
    drawnPoints.push({ x: touchPos.x, y: touchPos.y });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Рисуем центральную точку
    drawCenterPoint();

    // Рисуем круг пользователя
    ctx.beginPath();
    ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
    for (let i = 1; i < drawnPoints.length; i++) {
        ctx.lineTo(drawnPoints[i].x, drawnPoints[i].y);
    }
    ctx.strokeStyle = '#4d79ff';
    ctx.lineWidth = 2;
    ctx.stroke();
});

// Завершение рисования круга (сенсорные устройства)
canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    finishDrawing();
});

// Завершение рисования круга (общая функция для сенсорных и мышиных событий)
function finishDrawing() {
    isDrawing = false;

    const lastPoint = drawnPoints[drawnPoints.length - 1];
    const distanceToStart = calculateDistance(lastPoint.x, lastPoint.y, userStartPoint.x, userStartPoint.y);

    // Если круг не завершён, очищаем холст
    if (drawnPoints.length < 5 || distanceToStart > snapRadius) {
        clearCanvas();
        scoreDisplay.textContent = 'Circle not completed!';
        return;
    }

    const firstPoint = drawnPoints[0];
    userRadius = calculateDistance(firstPoint.x, firstPoint.y, centerX, centerY);
    idealCircleRadius = userRadius;

    fillUserCircle();
    drawIdealCircle();

    const accuracy = calculateFillPercentage();
    updateScoreDisplay(accuracy);
}

// Функция очистки холста
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    scoreDisplay.textContent = 'Your accuracy: 0%';
    scoreDisplay.className = '';
    drawnPoints = [];
    idealCircleRadius = 0;
    userRadius = 0;
    userStartPoint = null;
    drawCenterPoint();
}

// Заполняем нарисованный круг пользователя
function fillUserCircle() {
    ctx.beginPath();
    ctx.moveTo(drawnPoints[0].x, drawnPoints[0].y);
    for (let i = 1; i < drawnPoints.length; i++) {
        ctx.lineTo(drawnPoints[i].x, drawnPoints[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(77, 121, 255, 0.3)';
    ctx.fill();
}

// Рисуем идеальный круг
function drawIdealCircle() {
    ctx.beginPath();
    ctx.arc(centerX, centerY, idealCircleRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#003c8f';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = 'rgba(77, 121, 255, 0.1)';
    ctx.fill();
}

// Обновляем текст точности с цветами
function updateScoreDisplay(accuracy) {
    if (accuracy < 50) {
        scoreDisplay.className = 'low-accuracy';
    } else if (accuracy < 80) {
        scoreDisplay.className = 'medium-accuracy';
    } else {
        scoreDisplay.className = 'high-accuracy';
    }
    scoreDisplay.textContent = `Your accuracy: ${accuracy.toFixed(2)}%`;
}

// Очистка холста через кнопку
clearCanvasButton.addEventListener('click', clearCanvas);

// Первоначальный рисунок центральной точки
drawCenterPoint();
