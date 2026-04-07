from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from games.dragon_boat.router import router as dragon_boat_router
from games.speed_typing.router import router as speed_typing_router
from games.vertical_game.router import router as vertical_game_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Game Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(dragon_boat_router)
app.include_router(speed_typing_router)
app.include_router(vertical_game_router)

@app.get("/health")
def health():
    return {"status": "ok"}
