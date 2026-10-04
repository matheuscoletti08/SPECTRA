const form = document.querySelector(".add-track");
const input = document.querySelector("#youtube-url");
const playlist = document.querySelector("#playlist");
const volumeInput = document.querySelector(".volume input");

const trackTitle = document.querySelector(".track-title");
const trackArtist = document.querySelector(".track-artist");

const currentTime = document.querySelector(".time span:first-child");
const duration = document.querySelector(".time span:last-child");

const canvas = document.querySelector("#visualizer");
const ctx = canvas.getContext("2d");

const tracks = [];

const bars = 20;
const levels = new Array(bars).fill(0);

let currentTrack = -1;
let player;
let animation;
let clock;

const script = document.createElement("script");
script.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(script);

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player("youtube-player", {
    height: 0.01,
    width: 0.01,
    playerVars: { controls: 0, origin: window.location.origin },
    events: {
      onReady: () => player.setVolume(volumeInput.value),

      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          startVisualizer();
          clock = setInterval(updateTime, 500);
        }

        if (event.data === YT.PlayerState.PAUSED) {
          stopVisualizer();
        }

        if (event.data === YT.PlayerState.ENDED) {
          stopVisualizer();
          clearInterval(clock);
          step(1);
        }
      },
    },
  });
};

function getVideoId(url) {
  const parsed = new URL(url);

  return parsed.searchParams.get("v") || parsed.pathname.slice(1);
}

async function addTrack(url) {
  const id = getVideoId(url);

  if (!id) return;

  const track = { id, title: "Carregando...", artist: "YouTube" };

  tracks.push(track);
  renderPlaylist();

  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
    );

    const data = await response.json();

    track.title = data.title;
    track.artist = data.author_name;
  } catch {
    track.title = id;
  }

  renderPlaylist();

  if (currentTrack === -1) playTrack(0);
}

function renderPlaylist() {
  playlist.innerHTML = "";

  tracks.forEach((track, index) => {
    const item = document.createElement("li");

    item.textContent = track.title;
    item.onclick = () => playTrack(index);

    if (index === currentTrack) item.classList.add("active");

    playlist.appendChild(item);
  });
}

function playTrack(index) {
  if (!tracks[index] || !player) return;

  currentTrack = index;

  const track = tracks[index];

  player.loadVideoById(track.id);
  player.setVolume(volumeInput.value);

  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;

  renderPlaylist();
}

function step(offset) {
  if (!tracks.length) return;

  playTrack((currentTrack + offset + tracks.length) % tracks.length);
}

document.querySelector('[aria-label="Anterior"]').onclick = () => step(-1);

document.querySelector('[aria-label="Reproduzir"]').onclick = () => {
  if (currentTrack === -1) {
    playTrack(0);
  } else {
    player.playVideo();
  }
};

document.querySelector('[aria-label="Pausar"]').onclick = () => player.pauseVideo();

document.querySelector('[aria-label="Parar"]').onclick = () => player.stopVideo();

document.querySelector('[aria-label="Próxima"]').onclick = () => step(1);

form.onsubmit = (event) => {
  event.preventDefault();

  if (!input.value) return;

  addTrack(input.value);
  input.value = "";
};

volumeInput.oninput = () => player.setVolume(volumeInput.value);

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function updateTime() {
  currentTime.textContent = formatTime(player.getCurrentTime());
  duration.textContent = formatTime(player.getDuration());
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

function clearCanvas() {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVisualizer() {
  clearCanvas();

  const width = canvas.width / bars;

  ctx.fillStyle = "#00ff00";

  for (let i = 0; i < bars; i++) {
    levels[i] = Math.max(levels[i] * 0.92, Math.random());

    const height = levels[i] * canvas.height * 0.9;

    ctx.fillRect(i * width, canvas.height - height, width - 1, height);
  }

  animation = requestAnimationFrame(drawVisualizer);
}

function startVisualizer() {
  cancelAnimationFrame(animation);
  resizeCanvas();
  drawVisualizer();
}

function stopVisualizer() {
  cancelAnimationFrame(animation);
  clearCanvas();
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
