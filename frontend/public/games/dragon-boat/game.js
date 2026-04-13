(function () {
    // --- 初始化 ---
    var canvas = document.getElementById("gameCanvas");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var SCREEN_WIDTH = canvas.width;   // 1000
    var SCREEN_HEIGHT = canvas.height; // 600

    // --- 顏色定義 (豐富漸層) ---
    var WATER_COLORS = [
        [8, 50, 120],     // 深海藍
        [12, 80, 160],    // 深藍
        [20, 110, 200],   // 中藍
        [40, 150, 230],   // 亮藍
        [80, 180, 245],   // 淺藍
        [110, 200, 255],  // 天空藍
        [80, 180, 245],   // 淺藍
        [40, 150, 230],   // 亮藍
        [20, 110, 200],   // 中藍
        [12, 80, 160],    // 深藍
        [8, 50, 120]      // 深海藍
    ];

    // --- 角色與變數設定 ---
    var SHIP_SPEED = 15;
    var FINISH_X = SCREEN_WIDTH - 150;
    var SHIP_WIDTH = 120;
    var SHIP_HEIGHT = 60;

    var p1X = 20, p1Y = 130;
    var p2X = 20, p2Y = 350;
    var p1LastKey = null;
    var p2LastKey = null;
    var frameCounter = 0;
    var gameOver = false;
    var winnerText = "";
    var winDuration = 0;
    var raceStartTime = 0;
    var raceStarted = false;
    var countdownSeconds = 5;
    var countdownEndTime = Date.now() + countdownSeconds * 1000;

    // Read player names from React (set on window before script loads)
    var p1Name = window.__P1_NAME || "Player 1";
    var p2Name = window.__P2_NAME || "Player 2";
    var p1User = window.__P1_USER || p1Name;
    var p2User = window.__P2_USER || p2Name;
    var EVENTS = window.__DRAGON_BOAT_EVENTS || {
        RACE_START: "race-start",
        GAME_OVER: "game-over",
        GAME_RESET: "game-reset",
        RACE_RESET: "race-reset",
    };

    // --- Load boat images ---
    var useImage = false;
    var ship1Img = new Image();
    var ship2Canvas = document.createElement("canvas");
    ship2Canvas.width = SHIP_WIDTH;
    ship2Canvas.height = SHIP_HEIGHT;

    ship1Img.onload = function () {
        useImage = true;
        // Create red-tinted boat for player 2
        var sctx = ship2Canvas.getContext("2d");
        sctx.drawImage(ship1Img, 0, 0, SHIP_WIDTH, SHIP_HEIGHT);
        // Red overlay (simulates pygame BLEND_RGB_MULT)
        sctx.globalCompositeOperation = "multiply";
        sctx.fillStyle = "rgb(255, 150, 150)";
        sctx.fillRect(0, 0, SHIP_WIDTH, SHIP_HEIGHT);
        sctx.globalCompositeOperation = "destination-in";
        sctx.drawImage(ship1Img, 0, 0, SHIP_WIDTH, SHIP_HEIGHT);
        sctx.globalCompositeOperation = "source-over";
    };
    ship1Img.src = "/games/dragon-boat/assets/boat.png";

    // --- 動態背景函式 (增強版) ---
    function drawDynamicRiver(timeVal) {
        var sectionHeight = SCREEN_HEIGHT / WATER_COLORS.length;

        for (var i = 0; i < WATER_COLORS.length; i++) {
            var offset = Math.sin(timeVal * 0.03 + i * 0.6) * 15;
            var c = WATER_COLORS[i];
            // 微妙的顏色脈動
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

        // 賽道分隔線（淡金色虛線）
        ctx.save();
        ctx.setLineDash([12, 8]);
        ctx.strokeStyle = "rgba(240, 200, 100, 0.25)";
        ctx.lineWidth = 2;
        var lineOffset = Math.sin(timeVal * 0.03) * 6;
        ctx.beginPath();
        ctx.moveTo(0, SCREEN_HEIGHT / 2 + lineOffset);
        ctx.lineTo(SCREEN_WIDTH, SCREEN_HEIGHT / 2 + lineOffset);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    // --- 畫船 (圖片或多邊形) ---
    function drawBoat(x, y, color, floatOffset, img) {
        var bx = x;
        var by = y + floatOffset;

        if (useImage && img) {
            ctx.drawImage(img, bx, by, SHIP_WIDTH, SHIP_HEIGHT);
            return;
        }

        ctx.save();

        // 船身
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
    function drawWake(boatX, boatY, floatOffset, seed) {
        if (boatX <= 22) return; // 船沒動就不畫
        ctx.save();
        for (var i = 0; i < 8; i++) {
            var trailX = boatX - 10 - i * 12;
            if (trailX < 0) break;
            var trailY = boatY + floatOffset + Math.sin(seed * 0.12 + i * 0.8) * 3;
            var alpha = 0.3 - i * 0.035;
            var radius = 3 + i * 1.2;
            ctx.fillStyle = "rgba(200, 230, 255, " + Math.max(0, alpha) + ")";
            ctx.beginPath();
            ctx.arc(trailX, trailY, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    // --- 畫終點線 (旗幟風格) ---
    function drawFinishLine() {
        var lineX = FINISH_X + 120;
        var cellSize = 10;
        // 棋盤格終點線
        for (var y = 0; y < SCREEN_HEIGHT; y += cellSize) {
            for (var col = 0; col < 2; col++) {
                var isWhite = ((Math.floor(y / cellSize) + col) % 2 === 0);
                ctx.fillStyle = isWhite ? "#fff" : "#222";
                ctx.fillRect(lineX + col * cellSize, y, cellSize, cellSize);
            }
        }
        // 金色邊框
        ctx.strokeStyle = "rgba(240, 192, 64, 0.6)";
        ctx.lineWidth = 2;
        ctx.strokeRect(lineX, 0, cellSize * 2, SCREEN_HEIGHT);
    }

    function drawFinishSprintZone() {
        var zoneWidth = Math.floor(SCREEN_WIDTH * 0.1);
        var zoneX = FINISH_X - zoneWidth + 110;
        var pulse = 0.12 + ((Math.sin(frameCounter * 0.12) + 1) * 0.08);

        ctx.save();
        var grad = ctx.createLinearGradient(zoneX, 0, zoneX + zoneWidth, 0);
        grad.addColorStop(0, "rgba(255, 205, 90, 0)");
        grad.addColorStop(0.5, "rgba(255, 205, 90, " + pulse + ")");
        grad.addColorStop(1, "rgba(255, 205, 90, 0.28)");
        ctx.fillStyle = grad;
        ctx.fillRect(zoneX, 0, zoneWidth, SCREEN_HEIGHT);

        ctx.strokeStyle = "rgba(255, 225, 140, 0.36)";
        ctx.setLineDash([10, 8]);
        ctx.lineWidth = 2;
        ctx.strokeRect(zoneX, 8, zoneWidth, SCREEN_HEIGHT - 16);
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255, 245, 200, 0.9)";
        ctx.font = "bold 14px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("SPRINT ZONE", zoneX + zoneWidth / 2, 24);
        ctx.restore();
    }

    function drawBoatNameTag(boatX, boatY, name, fillColor, strokeColor) {
        var textX = Math.min(SCREEN_WIDTH - 14, Math.max(14, boatX + SHIP_WIDTH * 0.5));
        var textY = boatY - 18;

        ctx.save();
        ctx.font = "bold 16px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 6;
        ctx.lineWidth = 3;
        ctx.strokeStyle = strokeColor;
        ctx.strokeText(name, textX, textY);
        ctx.fillStyle = fillColor;
        ctx.fillText(name, textX, textY);
        ctx.restore();
    }

    // --- Win screen (enhanced) ---
    function drawWinScreen() {
        // Radial gradient overlay
        var grad = ctx.createRadialGradient(
            SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, 50,
            SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2, SCREEN_WIDTH * 0.6
        );
        grad.addColorStop(0, "rgba(0, 0, 40, 0.5)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0.8)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        // Winner text with glow
        ctx.save();
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = 20;
        ctx.fillStyle = "rgb(255, 215, 0)";
        ctx.font = "bold 48px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(winnerText, SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 20);
        ctx.restore();

        // Duration
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = "28px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Time: " + winDuration.toFixed(2) + "s", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 30);
    }

    // --- HUD panel ---
    function drawHUD() {
        // semi-transparent control panel (left)
        ctx.save();
        ctx.fillStyle = "rgba(0, 20, 60, 0.5)";
        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.arcTo(310, 4, 310, 60, 8);
        ctx.arcTo(310, 60, 8, 60, 8);
        ctx.arcTo(8, 60, 8, 4, 8);
        ctx.arcTo(8, 4, 310, 4, 8);
        ctx.closePath();
        ctx.fill();

        ctx.font = "18px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        ctx.fillStyle = "rgba(255, 220, 120, 0.9)";
        ctx.fillText("🏁 " + p1Name + ":  ← →", 16, 12);
        ctx.fillStyle = "rgba(255, 180, 180, 0.9)";
        ctx.fillText("🏁 " + p2Name + ":  A / D", 16, 36);
        ctx.restore();
    }

    function drawRaceAtmosphere() {
        // top race ribbon
        ctx.save();
        var glow = (Math.sin(frameCounter * 0.08) + 1) * 0.15 + 0.2;
        ctx.fillStyle = "rgba(255, 205, 90, " + glow + ")";
        ctx.fillRect(0, 0, SCREEN_WIDTH, 6);

        ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
        for (var i = 0; i < 7; i++) {
            var lx = ((frameCounter * 4 + i * 185) % (SCREEN_WIDTH + 120)) - 120;
            ctx.fillRect(lx, 8, 70, 2);
        }

        // cheering sparkles near side edges
        for (var c = 0; c < 24; c++) {
            var side = c % 2 === 0 ? 16 : SCREEN_WIDTH - 16;
            var cy = ((c * 31 + frameCounter * 2.1) % SCREEN_HEIGHT);
            var rad = 1.3 + (c % 3);
            var alpha = 0.08 + ((Math.sin(frameCounter * 0.05 + c) + 1) * 0.08);
            ctx.fillStyle = "rgba(255, 250, 200, " + alpha + ")";
            ctx.beginPath();
            ctx.arc(side, cy, rad, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawCountdownOverlay(secondsLeft) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 56px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.fillText(String(secondsLeft), SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 - 22);

        ctx.font = "24px 'Microsoft YaHei', 'PingFang TC', sans-serif";
        ctx.fillStyle = "rgba(240, 240, 240, 0.95)";
        ctx.fillText("Race starts in", SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2 + 34);
        ctx.restore();
    }

    // --- Keyboard events ---
    function onKey(e) {
        if (gameOver) return;
        if (!raceStarted) return;

        // Player 1 (arrow keys)
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            if (e.key !== p1LastKey) {
                if (p1X < FINISH_X) {
                    p1X += SHIP_SPEED;
                    p1LastKey = e.key;
                }
            }
        }

        // Player 2 (A / D keys)
        if (e.key === "a" || e.key === "d" || e.key === "A" || e.key === "D") {
            var k = e.key.toLowerCase();
            if (k !== p2LastKey) {
                if (p2X < FINISH_X) {
                    p2X += SHIP_SPEED;
                    p2LastKey = k;
                }
            }
        }
    }

    document.addEventListener("keydown", onKey);

    // --- Listen for reset event from React ---
    function onGameReset() {
        p1X = 20;
        p2X = 20;
        p1LastKey = null;
        p2LastKey = null;
        gameOver = false;
        winnerText = "";
        winDuration = 0;
        raceStarted = false;
        raceStartTime = 0;
        countdownEndTime = Date.now() + countdownSeconds * 1000;
        document.dispatchEvent(new CustomEvent(EVENTS.RACE_RESET));
    }
    document.addEventListener(EVENTS.GAME_RESET, onGameReset);

    // --- 遊戲主迴圈 ---
    function gameLoop() {
        // Stop loop and clean up when canvas is removed by React
        if (!document.getElementById("gameCanvas")) {
            document.removeEventListener("keydown", onKey);
            document.removeEventListener(EVENTS.GAME_RESET, onGameReset);
            return;
        }

        frameCounter++;

        // 繪製動態水面
        drawDynamicRiver(frameCounter);
        drawRaceAtmosphere();

        // 終點線
        drawFinishLine();
        drawFinishSprintZone();

        // 船的浮動效果
        var floatEffect = Math.sin(frameCounter * 0.1) * 3;

        // 船尾水花尾跡
        drawWake(p1X, p1Y + SHIP_HEIGHT * 0.5, floatEffect, frameCounter);
        drawWake(p2X, p2Y + SHIP_HEIGHT * 0.5, floatEffect, frameCounter + 50);

        // 繪製兩艘船
        drawBoat(p1X, p1Y, "rgb(139, 69, 19)", floatEffect, ship1Img);
        drawBoat(p2X, p2Y, "rgb(180, 60, 60)", floatEffect, ship2Canvas);
        drawBoatNameTag(p1X, p1Y, p1Name, "rgba(185, 232, 255, 0.98)", "rgba(8, 38, 74, 0.98)");
        drawBoatNameTag(p2X, p2Y, p2Name, "rgba(255, 220, 220, 0.98)", "rgba(74, 12, 12, 0.98)");

        // control hints on track
        drawHUD();

        if (!raceStarted) {
            var secondsLeft = Math.max(0, Math.ceil((countdownEndTime - Date.now()) / 1000));
            if (secondsLeft <= 0) {
                raceStarted = true;
                raceStartTime = Date.now();
                document.dispatchEvent(new CustomEvent(EVENTS.RACE_START, { detail: { start_time: raceStartTime } }));
            } else {
                drawCountdownOverlay(secondsLeft);
            }
        }

        // Check winner
        if (!gameOver && raceStarted) {
            if (p1X >= FINISH_X && p2X >= FINISH_X) {
                winnerText = "It's a tie!";
                winDuration = (Date.now() - raceStartTime) / 1000;
                gameOver = true;
                document.dispatchEvent(new CustomEvent(EVENTS.GAME_OVER, { detail: { winner: "", duration_ms: Math.round(winDuration * 1000) } }));
            } else if (p1X >= FINISH_X) {
                winnerText = p1Name + " wins!";
                winDuration = (Date.now() - raceStartTime) / 1000;
                gameOver = true;
                document.dispatchEvent(new CustomEvent(EVENTS.GAME_OVER, { detail: { winner: p1User, duration_ms: Math.round(winDuration * 1000) } }));
            } else if (p2X >= FINISH_X) {
                winnerText = p2Name + " wins!";
                winDuration = (Date.now() - raceStartTime) / 1000;
                gameOver = true;
                document.dispatchEvent(new CustomEvent(EVENTS.GAME_OVER, { detail: { winner: p2User, duration_ms: Math.round(winDuration * 1000) } }));
            }
        }

        // 勝利畫面
        if (gameOver) {
            drawWinScreen();
        }

        requestAnimationFrame(gameLoop);
    }

    // 啟動遊戲
    gameLoop();
})();
