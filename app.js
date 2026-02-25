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

// ✅ FIXED: Using the new publishable key format
const supabaseClient = window.supabase.createClient(
  'https://aebaggytwjsmhdbnpoos.supabase.co',
  'sb_publishable_gQCknZeqIOn22sSNnprSfg_7WL0EHkk'
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

// Media Session Setup
if ('mediaSession' in navigator) {
    console.log('✅ Media Session API supported');
    
    function updateMediaSession(songName) {
        console.log('Updating media session for:', songName);
        
        const artwork = [
            {
                src: 'https://raw.githubusercontent.com/cryankle/wusicfm/main/apocalypse_forever.jpg',
                sizes: '512x512',
                type: 'image/png'
            }
        ];
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: songName,
            artist: 'Cry Ankle',
            album: 'Apocalypse Forever',
            artwork: artwork
        });
        
        console.log('Media session updated');
    }

    // Set up media controls
    navigator.mediaSession.setActionHandler('play', () => playSong());
    navigator.mediaSession.setActionHandler('pause', () => pauseSong());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevSong());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextSong());
}

// Get signed URL
async function getSignedUrl(filename) {
    try {
        const { data, error } = await supabaseClient
            .storage
            .from('public-audio')
            .createSignedUrl(filename, 3600);

        if (error) throw error;
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
            
            // Update media session
            if ('mediaSession' in navigator) {
                updateMediaSession(song.name);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        title.innerText = "Error loading song";
    } finally {
        isLoading = false;
    }
}

// Play/Pause functions
async function playSong() {
    console.log('Play clicked');
    
    if (!audio.src) {
        await loadSong(songIndex);
    }
    
    try {
        await audio.play();
        musicContainer.classList.add("play");
        playBtn.querySelector('i.fas').classList.remove("fa-play");
        playBtn.querySelector("i.fas").classList.add('fa-pause');
        
        // Set playback state
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    } catch (error) {
        console.error('Play error:', error);
    }
}

function pauseSong() {
    console.log('Pause clicked');
    audio.pause();
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector("i.fas").classList.remove("fa-pause");
    
    if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
    }
}

// Navigation
async function prevSong() {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    await loadSong(songIndex);
    playSong();
}

async function nextSong() {
    songIndex = (songIndex + 1) % songs.length;
    await loadSong(songIndex);
    playSong();
}

// Event listeners
playBtn.addEventListener("click", () => {
    const isPlaying = musicContainer.classList.contains('play');
    isPlaying ? pauseSong() : playSong();
});

prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);

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
        const progressPercent = (audio.currentTime / audio.duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }
}

// Update position state for lock screen
audio.addEventListener('timeupdate', () => {
    updateProgress({ srcElement: audio });
    
    if ('mediaSession' in navigator && audio.duration) {
        try {
            navigator.mediaSession.setPositionState({
                duration: audio.duration,
                playbackRate: 1,
                position: audio.currentTime
            });
        } catch (error) {
            // Silently fail - not critical
        }
    }
});

audio.addEventListener('ended', nextSong);
progressContainer.addEventListener("click", setProgress);

// Load first song
loadSong(0);


// Test function for GitHub images
window.testImages = async function() {
    const imageUrl = 'https://raw.githubusercontent.com/cryankle/wusicfm/main/apocalypse_forever.jpg';
    
    try {
        const response = await fetch(imageUrl, { method: 'HEAD' });
        console.log('Image status:', response.status, response.ok ? '✅' : '❌');
        
        if (response.ok) {
            console.log('Image URL is working!');
        } else {
            console.log('Image URL is not accessible - check the path');
        }
    } catch (error) {
        console.error('Error testing image:', error);
    }
};