"""
Block Planner Backend Application
FastAPI Server for Intelligent Railway Maintenance Block Planning.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from config import settings
from database.session import init_db, get_connection
from seed.seed_data import seed_database
from routers import stations, tasks, trains, blocks, optimizer, analytics, simulation, data_io
import os

app = FastAPI(
    title="Block Planner API",
    description="Intelligent Railway Maintenance Block Planning",
    version=settings.VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(stations.router)
app.include_router(tasks.router)
app.include_router(trains.router)
app.include_router(blocks.router)
app.include_router(optimizer.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(data_io.router)

@app.on_event("startup")
def on_startup():
    init_db()
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM stations")
    count = c.fetchone()[0]
    conn.close()
    if count == 0:
        print("Empty database detected. Seeding dataset...")
        seed_database()
    print("Block Planner backend initialized successfully.")

@app.get("/api/health")
def api_health():
    return {
        "project": settings.PROJECT_NAME,
        "subtitle": settings.SUBTITLE,
        "version": settings.VERSION,
        "status": "Operational"
    }

# Mount frontend build if available
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="static-assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"project": settings.PROJECT_NAME, "status": "Operational"}
else:
    @app.get("/")
    def root():
        return api_health()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
