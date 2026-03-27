import pygame
import sys
import math  # 匯入數學庫來計算波浪

# --- 1. 初始化 ---
pygame.init()
pygame.display.set_caption("雙人划船：動態水波紋版")

SCREEN_WIDTH = 1000
SCREEN_HEIGHT = 600
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))

# --- 2. 顏色定義 (漸層藍) ---
WATER_COLORS = [
    (20, 100, 200),  # 深
    (30, 144, 255),  # 中
    (100, 191, 255), # 淺
    (30, 144, 255),  # 中
    (20, 100, 200)   # 深
]

# --- 3. 動態背景函式 ---
def draw_dynamic_river(time_val):
    section_height = SCREEN_HEIGHT // len(WATER_COLORS)
    
    for i, color in enumerate(WATER_COLORS):
        # 計算波浪偏移：math.sin 會在 -1 到 1 之間震盪
        # i * 0.5 讓每一層水的波動有「時間差」，看起來更自然
        offset = math.sin(time_val * 0.05 + i * 0.8) * 20 
        
        # 畫出比螢幕寬一點點的矩形，避免左右出現空隙
        pygame.draw.rect(screen, color, (-50 + offset, i * section_height, SCREEN_WIDTH + 100, section_height))
    
    # 畫賽道中間的白線 (也要跟著動一點點)
    line_offset = math.sin(time_val * 0.05) * 10
    pygame.draw.line(screen, (200, 230, 255, 100), (0, SCREEN_HEIGHT//2), (SCREEN_WIDTH, SCREEN_HEIGHT//2), 2)

# --- 4. 角色與變數設定 ---
try:
    base_img = pygame.image.load("boat.png").convert_alpha()
    ship1_img = pygame.transform.scale(base_img, (120, 60))
    ship2_img = pygame.transform.scale(base_img, (120, 60))
    ship2_img.fill((255, 150, 150), special_flags=pygame.BLEND_RGB_MULT) 
    use_image = True
except:
    use_image = False

p1_x, p1_y = 20, 150
p2_x, p2_y = 20, 400
p1_last_key, p2_last_key = None, None
ship_speed = 15
finish_x = SCREEN_WIDTH - 150
clock = pygame.time.Clock()
font = pygame.font.SysFont("microsoftyahei", 72)
small_font = pygame.font.SysFont("microsoftyahei", 36)

# 計時器，用來控制波浪
frame_counter = 0

# 遊戲狀態
game_over = False
winner_text = ""

# --- 5. 遊戲主迴圈 ---
while True:
    clock.tick(60)
    frame_counter += 1 # 每一幀加 1

    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
            sys.exit()

        if event.type == pygame.KEYDOWN:
            # 按 R 重新開始
            if event.key == pygame.K_r:
                p1_x, p2_x = 20, 20
                p1_last_key, p2_last_key = None, None
                game_over = False
                winner_text = ""

            if not game_over:
                # 玩家 1 (左右鍵)
                if event.key in [pygame.K_LEFT, pygame.K_RIGHT] and event.key != p1_last_key:
                    if p1_x < finish_x:
                        p1_x += ship_speed
                        p1_last_key = event.key
                
                # 玩家 2 (AD 鍵)
                if event.key in [pygame.K_a, pygame.K_d] and event.key != p2_last_key:
                    if p2_x < finish_x:
                        p2_x += ship_speed
                        p2_last_key = event.key

    # --- 6. 繪製 ---
    # 傳入 frame_counter 讓背景動起來
    draw_dynamic_river(frame_counter)

    # 終點線
    for y in range(0, SCREEN_HEIGHT, 20):
        pygame.draw.rect(screen, (255, 255, 255), (finish_x + 120, y, 5, 10))

    if use_image:
        # 讓船也有一點點隨波逐流的感覺 (Y 座標微幅震盪)
        float_effect = math.sin(frame_counter * 0.1) * 3
        screen.blit(ship1_img, (p1_x, p1_y + float_effect))
        screen.blit(ship2_img, (p2_x, p2_y + float_effect))
    else:
        pygame.draw.rect(screen, (139, 69, 19), (p1_x, p1_y, 120, 60))
        pygame.draw.rect(screen, (100, 50, 20), (p2_x, p2_y, 120, 60))

    # 判斷勝利
    if not game_over:
        if p1_x >= finish_x and p2_x >= finish_x:
            winner_text = "平手！"
            game_over = True
        elif p1_x >= finish_x:
            winner_text = "玩家1 (左右鍵) 獲勝！"
            game_over = True
        elif p2_x >= finish_x:
            winner_text = "玩家2 (AD鍵) 獲勝！"
            game_over = True

    # 勝利畫面
    if game_over:
        overlay = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 150))
        screen.blit(overlay, (0, 0))
        win_surf = font.render(winner_text, True, (255, 215, 0))
        screen.blit(win_surf, (SCREEN_WIDTH // 2 - win_surf.get_width() // 2, SCREEN_HEIGHT // 2 - 60))
        restart_surf = small_font.render("按 R 重新開始", True, (255, 255, 255))
        screen.blit(restart_surf, (SCREEN_WIDTH // 2 - restart_surf.get_width() // 2, SCREEN_HEIGHT // 2 + 30))

    pygame.display.flip()