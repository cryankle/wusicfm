const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

// Initialize Supabase client with your anon key
const supabase = window.supabase.createClient(
  'https://aebaggytwjsmhdbnpoos.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlYmFnZ3l0d2pzbWhkYm5wb29zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5OTU0MTAsImV4cCI6MjA1NDU3MTQxMH0.kGjHajHOKJ1eJzP9YhX_LdOqh94I7g4Fq0eKk86KpWc'
);

// Song metadata with filenames only (no public URLs)
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
if (volume) {
    volume.addEventListener("change", function(e) {
        audio.volume = e.currentTarget.value / 100;
    });
}

let songIndex = 0;

// Get signed URL directly from Supabase (NO EDGE FUNCTION NEEDED)
async function getSignedUrl(filename) {
    try {
        const { data, error } = await supabase
            .storage
            .from('public-audio')
            .createSignedUrl(filename, 3600); // 1 hour expiry

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        
        console.log('Got signed URL:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error getting signed URL:', error);
        return null;
    }
}

// Load song with signed URL
async function loadSong(index) {
    const song = songs[index];
    title.innerText = "Loading: " + song.name + "...";
    
    const signedUrl = await getSignedUrl(song.filename);
    
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
        console.error('Playback error:', error);
        // If playback fails, try reloading the signed URL
        const signedUrl = await getSignedUrl(songs[songIndex].filename);
        if (signedUrl) {
            audio.src = signedUrl;
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

// Progress bar
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