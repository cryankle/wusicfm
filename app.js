const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

// Song URLs from Supabase
const songs = [
  { name: "Online", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/1%20-%20Online.mp3" },
  { name: "Heat (Finger)", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/2%20-%20Heat%20(Finger).mp3" },
  { name: "Apocalypse Forever", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/3%20-%20Apocalypse%20Forever.mp3" },
  { name: "Sirens", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/4%20-%20Sirens.mp3" },
  { name: "Anything Goes", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/5%20-%20Anything%20Goes.mp3" },
  { name: "So Long", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/6%20-%20So%20Long.mp3" },
  { name: "Going After It", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/7%20-%20Going%20After%20It.mp3" },
  { name: "Tone Of The Unknown", url: "https://aebaggytwjsmhdbnpoos.supabase.co/storage/v1/object/public/public-audio/8%20-%20Tone%20Of%20The%20Unknown.mp3" }
];

// Volume slider
let volume = document.getElementById('volume-slider');
volume.addEventListener("change", function(e) {
    audio.volume = e.currentTarget.value / 100;
});

// Keep track of song
let songIndex = 0;

// Load initial song
loadSong(songIndex);

// Load song details into DOM
function loadSong(index) {
    const song = songs[index];
    title.innerText = "Now playing: " + song.name;
    audio.src = song.url;
}

// Event listeners for play/pause
playBtn.addEventListener("click", () => {
    const isPlaying = musicContainer.classList.contains('play');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

// Previous / Next buttons
prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);

function playSong(){
    musicContainer.classList.add("play");
    playBtn.querySelector('i.fas').classList.remove("fa-play");
    playBtn.querySelector("i.fas").classList.add('fa-pause');
    audio.play();
}

function pauseSong(){
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector('i.fas').classList.remove("fa-pause");
    audio.pause();
}

function prevSong(){
    songIndex--;
    if (songIndex < 0) songIndex = songs.length - 1;
    loadSong(songIndex);
    playSong();
}

function nextSong(){
    songIndex++;
    if (songIndex >= songs.length) songIndex = 0;
    loadSong(songIndex);
    playSong();
}

// Progress bar
function setProgress(e){
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function updateProgress(e){
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}

audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener("click", setProgress);
audio.addEventListener("ended", nextSong);