const musicContainer = document.getElementById('music-container');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

const audio = document.getElementById("audio");
const title = document.getElementById('title');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');

// Volume slider
let volume = document.getElementById('volume-slider');
if (volume) {
    volume.addEventListener("change", function(e) {
        audio.volume = e.currentTarget.value / 100;
    });
}

// Add Media Session API for better mobile notifications
if ('mediaSession' in navigator) {
    // Update media session with song metadata
    function updateMediaSession(songName) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songName,
            artist: 'Cry Ankle', // You can customize this
            album: 'Apocalypse Forever?',
            artwork: [
                // Add album artwork if you have it
                // If not, you can use a default image
                { src: 'cryankle/wusicfm/apocalypse_forever.jpg', sizes: '512x512', type: 'image/jpeg' }
            ]
        });
    }

    // Handle media controls from notification/lock screen
    navigator.mediaSession.setActionHandler('play', () => playSong());
    navigator.mediaSession.setActionHandler('pause', () => pauseSong());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
}

// ✅ FIXED: Using the new publishable key format
const supabaseClient = window.supabase.createClient(
  'https://aebaggytwjsmhdbnpoos.supabase.co',
  'sb_publishable_gQCknZeqIOn22sSNnprSfg_7WL0EHkk' // Your new publishable key
);

// Song metadata with filenames
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

let songIndex = 0;
let isLoading = false;

// Get signed URL from Supabase
async function getSignedUrl(filename) {
    try {
        console.log('Getting signed URL for:', filename);
        
        const { data, error } = await supabaseClient
            .storage
            .from('public-audio')
            .createSignedUrl(filename, 3600);

        if (error) {
            console.error('Signed URL error:', error);
            return null;
        }
        
        console.log('Got signed URL:', data.signedUrl);
        return data.signedUrl;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Load song
async function loadSong(index) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        const song = songs[index];
        title.innerText = "Loading: " + song.name + "...";
        
        const signedUrl = await getSignedUrl(song.filename);
        
        if (signedUrl) {
            audio.src = signedUrl;
            title.innerText = "Now playing: " + song.name;
            
            // ✅ Add this line to update notification with song name
            if ('mediaSession' in navigator) {
                updateMediaSession(song.name);
            }
        } else {
            title.innerText = "Error: Could not load " + song.name;
        }
    } catch (error) {
        console.error('Error:', error);
        title.innerText = "Error loading song";
    } finally {
        isLoading = false;
    }
}

// Update media session position state
audio.addEventListener('timeupdate', () => {
    if ('mediaSession' in navigator && audio.duration) {
        navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
        });
    }
    
    // Your existing progress update
    updateProgress({ srcElement: audio });
});

// Load first song
loadSong(0);

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
    
    if (!audio.src) {
        await loadSong(songIndex);
    }
    
    try {
        await audio.play();
    } catch (error) {
        console.error('Playback error:', error);
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
    
    if (duration && isFinite(duration)) {
        audio.currentTime = (clickX / width) * duration;
    }
}

function updateProgress(e) {
    if (audio.duration && isFinite(audio.duration)) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }
}

audio.addEventListener('timeupdate', updateProgress);
progressContainer.addEventListener("click", setProgress);
audio.addEventListener("ended", nextSong);