(function () {
    // --- 初始化 ---
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var SCREEN_WIDTH = canvas.width;
    var SCREEN_HEIGHT = canvas.height;

    // --- 顏色定義 (豐富漸層) ---
    var WATER_COLORS = [
        [8, 50, 120],
        [12, 80, 160],
        [20, 110, 200],
        [40, 150, 230],
        [80, 180, 245],
        [110, 200, 255],
        [80, 180, 245],
        [40, 150, 230],
        [20, 110, 200],
        [12, 80, 160],
        [8, 50, 120]
    ];

    // --- 角色與變數設定 ---
    var SHIP_SPEED = 15;
    var FINISH_X = SCREEN_WIDTH - 150;
    var SHIP_WIDTH = 120;
    var SHIP_HEIGHT = 60;

    // 單艘龍舟，畫面中央
    var boatX = 20;
    var boatY = (SCREEN_HEIGHT - SHIP_HEIGHT) / 2;

    var lastPlayer = null; // 追蹤上次按鍵的玩家 (1 或 2)，必須交替
    var frameCounter = 0;
    var gameOver = false;
    var winnerText = "";
    var winDuration = 0;
    var raceStartTime = 0;
    var raceStarted = false;

    // 時間戳記錄
    var p1Timestamps = [];
    var p2Timestamps = [];

    // Read player names from React
    var p1Name = window.__P1_NAME || "Player 1";
    var p2Name = window.__P2_NAME || "Player 2";

    // --- Load boat image ---
    var useImage = false;
    var boatImg = new Image();
    boatImg.onload = function () {
        useImage = true;
    };
    boatImg.src = "/games/dragon-boat/assets/boat.png";

    // --- 動態背景函式 ---
    function drawDynamicRiver(timeVal) {
        var sectionHeight = SCREEN_HEIGHT / WATER_COLORS.length;

        for (var i = 0; i < WATER_COLORS.length; i++) {
            var offset = Math.sin(timeVal * 0.03 + i * 0.6) * 15;
            var c = WATER_COLORS[i];
            var pulse = Math.sin(timeVal * 0.02 + i * 0.4) * 8;
            var r = Math.min(255, Math.max(0, c[0] + pulse));
            var g = Math.min(255, Math.max(0, c[1] + pulse));
            var b = Math.min(255, Math.max(0, c[2] + pulse * 0.5));
            ctx.fillStyle = "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
            ctx.fillRect(-50 + offset, i * sectionHeight, SCREEN_WIDTH + 100, sectionHeight + 1);
        }

        // 波浪紋理
        ctx.save();
        ctx.globalAlpha = 0.08;
        for (var w = 0; w < 12; w++) {
            var waveY = (w / 12) * SCREEN_HEIGHT;
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (var wx = -20; wx <= SCREEN_WIDTH + 20; wx += 4) {
                var wy = waveY + Math.sin(wx * 0.02 + timeVal * 0.04 + w * 1.2) * 6
                    + Math.sin(wx * 0.008 + timeVal * 0.02) * 4;
                if (wx === -20) ctx.moveTo(wx, wy);
                else ctx.lineTo(wx, wy);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // 光斑效果
        ctx.save();
        for (var s = 0; s < 20; s++) {
            var sx = ((s * 137.5 + timeVal * 0.3) % (SCREEN_WIDTH + 40)) - 20;
            var sy = ((s * 89.3 + timeVal * 0.15) % SCREEN_HEIGHT);
            var sparkleAlpha = (Math.sin(timeVal * 0.08 + s * 2.1) + 1) * 0.12;
            var sparkleSize = 1.5 + Math.sin(timeVal * 0.06 + s) * 1;
            ctx.fillStyle = "rgba(255, 255, 255, " + sparkleAlpha + ")";
            ctx.beginPath();
            ctx.arc(sx, sy, sparkleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 畫船 ---
    function drawBoat(x, y, floatOffset) {
        var bx = x;
        var by = y + floatOffset;

        if (useImage && boatImg) {
            ctx.drawImage(boatImg, bx, by, SHIP_WIDTH, SHIP_HEIGHT);
            return;
        }

        ctx.save();
        var color = "rgb(139, 69, 19)";
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(bx, by + SHIP_HEIGHT * 0.3);
        ctx.lineTo(bx + SHIP_WIDTH * 0.85, by + SHIP_HEIGHT * 0.1);
        ctx.lineTo(bx + SHIP_WIDTH, by + SHIP_HEIGHT * 0.5);
        ctx.lineTo(bx + SHIP_WIDTH * 0.85, by + SHIP_HEIGHT * 0.9);
        ctx.lineTo(bx, by + SHIP_HEIGHT * 0.7);
        ctx.closePath();
        ctx.fill();

        // 船身高光
        ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
        ctx.beginPath();
        ctx.moveTo(bx, by + SHIP_HEIGHT * 0.3);
        ctx.lineTo(bx + SHIP_WIDTH * 0.85, by + SHIP_HEIGHT * 0.1);
        ctx.lineTo(bx + SHIP_WIDTH, by + SHIP_HEIGHT * 0.5);
        ctx.lineTo(bx, by + SHIP_HEIGHT * 0.5);
        ctx.closePath();
        ctx.fill();

        // 船帆
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        var mastX = bx + SHIP_WIDTH * 0.45;
        ctx.beginPath();
        ctx.moveTo(mastX, by + SHIP_HEIGHT * 0.45);
        ctx.lineTo(mastX, by - SHIP_HEIGHT * 0.3);
        ctx.lineTo(mastX + SHIP_WIDTH * 0.25, by + SHIP_HEIGHT * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    // --- 船尾水花尾跡 ---
    function drawWake(bx, by, floatOffset, seed) {
        if (bx <= 22) return;
        ctx.save();
        for (var i = 0; i < 8; i++) {
            var trailX = bx - 10 - i * 12;
            if (trailX < 0) break;
            var trailY = by + floatOffset + Math.sin(seed * 0.12 + i * 0.8) * 3;
            var alpha = 0.3 - i * 0.035;
            var radius = 3 + i * 1.2;
            ctx.fillStyle = "rgba(200, 230, 255, " + Math.max(0, alpha) + ")";
            ctx.beginPath();
            ctx.arc(trailX, trailY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 畫終點線 ---
    function drawFinishLine() {
        var lineX = FINISH_X + 120;
        var cellSize = 10;
        for (var y = 0; y < SCREEN_HEIGHT; y += cellSize) {
            for (var col = 0; col < 2; col++) {
                var isWhite = ((Math.floor(y / cellSize) + col) % 2 === 0);
                ctx.fillStyle = isWhite ? "#fff" : "#222";
                ctx.fillRect(lineX + col * cellSize, y, cellSize, cellSize);
            }
        }
        ctx.strokeStyle = "rgba(240, 192, 64, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(lineX, 0, cellSize * 2, SCREEN_HEIGHT);
    }

    // --- 完成畫面 ---
    function drawWinScreen() {
        var grad = ctx.createRadialGradient(
            SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 50,
            SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH * 0.6
        );
        grad.addColorStop(0, "rgba(0, 0, 40, 0.5)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.8)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.save();
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "rgb(255, 215, 0)";
        ctx.font = "bold 48px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(winnerText, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "28px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Time: " + winDuration.toFixed(2) + "s", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
    }

    // --- HUD panel ---
    function drawHUD() {
        ctx.save();
        ctx.fillStyle = "rgba(0, 20, 60, 0.5)";
        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.arcTo(360, 4, 360, 60, 8);
        ctx.arcTo(360, 60, 8, 60, 8);
        ctx.arcTo(8, 60, 8, 4, 8);
        ctx.arcTo(8, 4, 360, 4, 8);
        ctx.closePath();
        ctx.fill();

        ctx.font = "18px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        ctx.fillStyle = "rgba(255, 220, 120, 0.9)";
        ctx.fillText("🚣 " + p1Name + " (左槳):  A 鍵", 16, 12);
        ctx.fillStyle = "rgba(180, 220, 255, 0.9)";
        ctx.fillText("🚣 " + p2Name + " (右槳):  L 鍵", 16, 36);
        ctx.restore();
    }

    // --- Keyboard events ---
    function onKey(e) {
        if (gameOver) return;

        var key = e.key.toLowerCase();
        var player = null;

        if (key === "a") {
            player = 1;
        } else if (key === "l") {
            player = 2;
        }

        if (player === null) return;

        // Start timer on first key press
        if (!raceStarted) {
            raceStarted = true;
            raceStartTime = Date.now();
        }

        // 必須交替：lastPlayer 不能和這次按的 player 相同
        if (player === lastPlayer) return;

        var elapsed = Date.now() - raceStartTime;

        // 記錄時間戳
        if (player === 1) {
            p1Timestamps.push(elapsed);
        } else {
            p2Timestamps.push(elapsed);
        }

        lastPlayer = player;

        if (boatX < FINISH_X) {
            boatX += SHIP_SPEED;
        }
    }

    document.addEventListener("keydown", onKey);

    // --- Listen for reset event from React ---
    function onGameReset() {
        boatX = 20;
        lastPlayer = null;
        gameOver = false;
        winnerText = "";
        winDuration = 0;
        raceStarted = false;
        raceStartTime = 0;
        p1Timestamps = [];
        p2Timestamps = [];
    }
    document.addEventListener("game-reset", onGameReset);

    // --- 遊戲主迴圈 ---
    function gameLoop() {
        if (!document.getElementById("gameCanvas")) {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener("game-reset", onGameReset);
            return;
        }

        frameCounter++;

        drawDynamicRiver(frameCounter);
        drawFinishLine();

        var floatEffect = Math.sin(frameCounter * 0.1) * 3;

        drawWake(boatX, boatY + SHIP_HEIGHT * 0.5, floatEffect, frameCounter);
        drawBoat(boatX, boatY, floatEffect);

        drawHUD();

        // Check finish
        if (!gameOver && boatX >= FINISH_X) {
            winnerText = "🎉 合作完成！";
            winDuration = (Date.now() - raceStartTime) / 1000;
            gameOver = true;
            document.dispatchEvent(new CustomEvent("game-over", {
                detail: {
                    duration_ms: Math.round(winDuration * 1000),
                    p1_timestamps: p1Timestamps.slice(),
                    p2_timestamps: p2Timestamps.slice(),
                }
            }));
        }

        if (gameOver) {
            drawWinScreen();
        }

        requestAnimationFrame(gameLoop);
    }

    gameLoop();
})();
