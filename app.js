const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

// Only song names and filenames (NO URLs!)
const songs = [
  { name: "Online", filename: "1 - Online.mp3" },
  { name: "Heat (Finger)", filename: "2 - Heat (Finger).mp3" },
  { name: "Apocalypse Forever", filename: "3 - Apocalypse Forever.mp3" },
  { name: "Sirens", filename: "4 - Sirens.mp3" },
  { name: "Anything Goes", filename: "5 - Anything Goes.mp3" },
  { name: "So Long", filename: "6 - So Long.mp3" },
  { name: "Going After It", filename: "7 - Going After It.mp3" },
  { name: "Tone Of The Unknown", filename: "8 - Tone Of The Unknown.mp3" }
];

// Volume slider
let volume = document.getElementById('volume-slider');
volume.addEventListener("change", function(e) {
    audio.volume = e.currentTarget.value / 100;
});

let songIndex = 0;

// ONLY ONE NEW FUNCTION: Get URL from Edge Function
async function getSongUrl(filename) {
    try {
        const response = await fetch('https://aebaggytwjsmhdbnpoos.supabase.co/functions/v1/get-song-url', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filename })
        });

        if (!response.ok) {
            throw new Error('Could not get URL');
        }

        const data = await response.json();
        return data.signedUrl;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Update the loadSong function
async function loadSong(index) {
    const song = songs[index];
    title.innerText = "Loading: " + song.name + "...";
    
    // Get URL from Edge Function
    const signedUrl = await getSongUrl(song.filename);
    
    if (signedUrl) {
        audio.src = signedUrl;
        title.innerText = "Now playing: " + song.name;
    } else {
        title.innerText = "Error: Could not load " + song.name;
    }
}

// Load first song
loadSong(songIndex);

// Play/Pause button
playBtn.addEventListener("click", () => {
    const isPlaying = musicContainer.classList.contains('play');
    if (isPlaying) {
        pauseSong();
    } else {
        playSong();
    }
});

prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);

async function playSong() {
    musicContainer.classList.add("play");
    playBtn.querySelector('i.fas').classList.remove("fa-play");
    playBtn.querySelector("i.fas").classList.add('fa-pause');
    
    try {
        await audio.play();
    } catch (error) {
        console.log('Retrying...');
        // If error, refresh the URL
        const newUrl = await getSongUrl(songs[songIndex].filename);
        if (newUrl) {
            audio.src = newUrl;
            await audio.play();
        }
    }
}

function pauseSong() {
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector("i.fas").classList.remove("fa-pause");
    audio.pause();
}

async function prevSong() {
    songIndex--;
    if (songIndex < 0) songIndex = songs.length - 1;
    await loadSong(songIndex);
    playSong();
}

async function nextSong() {
    songIndex++;
    if (songIndex >= songs.length) songIndex = 0;
    await loadSong(songIndex);
    playSong();
}

// Progress bar - STAYS EXACTLY THE SAME
function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
}

audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener("click", setProgress);
audio.addEventListener("ended", nextSong);