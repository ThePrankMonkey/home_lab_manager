from datetime import datetime, timezone

import human_readable
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from python_on_whales import DockerClient


class ComposeCheck(BaseModel):
    service: str
    status: str
    uptime: str
    imageUrl: str


class Containers(BaseModel):
    service: str
    compose: str
    image: str


origins = [
    "http://localhost:3000",
    "http://localhost",
    "http://127.0.0.1:3000",
    "http://127.0.0.1",
    # "*",
]

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    # allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

composes = {
    "docker-mediaserver": "/root/workspace/infra_containers/docker-mediaserver/docker-compose.yml",
}
containers = {
    "plex": Containers.model_validate(
        {
            "service": "plex",
            "compose": composes["docker-mediaserver"],
            "image": "http://localhost:8000/static/images/plex.jpeg",
        }
    ),
    "radarr": Containers.model_validate(
        {
            "service": "radarr",
            "compose": composes["docker-mediaserver"],
            "image": "http://localhost:8000/static/images/radarr.svg",
        }
    ),
}


@app.get("/")
async def hello():
    return {"Hello": "World"}


@app.post("/restart/{service}")
async def restart(service: str):
    container_details = containers[service]
    docker = DockerClient(
        compose_files=[
            container_details.compose,
        ]
    )
    docker.compose.restart(
        services=[service],
    )
    return {"message": f"restart {service}"}


@app.post("/rebuild/{service}")
async def rebuild(service: str):
    container_details = containers[service]
    docker = DockerClient(
        compose_files=[
            container_details.compose,
        ]
    )
    docker.compose.pull(
        services=[service],
    )
    docker.compose.up(
        services=[service],
        detach=True,
    )
    return {"message": f"rebuild {service}"}


@app.get("/check/{service}")
async def check(service: str) -> ComposeCheck:
    container_details = containers[service]
    docker = DockerClient(
        compose_files=[
            container_details.compose,
        ]
    )
    container = docker.compose.ps(
        services=[service],
    )[0]
    state = container.state
    now = datetime.now(timezone.utc)
    delta = now - state.started_at
    uptime = human_readable.precise_delta(delta, minimum_unit="seconds")
    results = ComposeCheck.model_validate(
        {
            "service": service,
            "status": state.status,
            "uptime": uptime,
            "imageUrl": containers[service].image,
        }
    )
    print(results)
    return results


@app.get("/list_services")
async def check() -> list:
    docker = DockerClient(compose_files=[composes["docker-mediaserver"]])
    names = [c.name for c in docker.compose.ps()]
    return names
