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

// Supabase client
const supabaseClient = window.supabase.createClient(
  'https://aebaggytwjsmhdbnpoos.supabase.co',
  'sb_publishable_gQCknZeqIOn22sSNnprSfg_7WL0EHkk'
);

// Songs
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

// Working image URL
const ALBUM_ART_URL = 'https://raw.githubusercontent.com/cryankle/wusicfm/main/apocalypse_forever.jpg';

// Media Session Setup
if ('mediaSession' in navigator) {
    console.log('✅ Media Session API supported');
    
    function updateMediaSession(songName) {
        console.log('Updating media session for:', songName);
        
        try {
            // Create metadata with working image
            navigator.mediaSession.metadata = new MediaMetadata({
                title: songName,
                artist: 'Cry Ankle',
                album: 'Apocalypse Forever',
                artwork: [
                    {
                        src: ALBUM_ART_URL,
                        sizes: '512x512',
                        type: 'image/jpeg'
                    }
                ]
            });
            
            // Set playback state based on audio
            navigator.mediaSession.playbackState = audio.paused ? 'paused' : 'playing';
            
            console.log('✅ Media session updated');
        } catch (error) {
            console.error('Media session error:', error);
        }
    }

    // Set up media controls
    try {
        navigator.mediaSession.setActionHandler('play', () => {
            console.log('MediaSession: play');
            playSong();
        });
        
        navigator.mediaSession.setActionHandler('pause', () => {
            console.log('MediaSession: pause');
            pauseSong();
        });
        
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            console.log('MediaSession: previous');
            prevSong();
        });
        
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            console.log('MediaSession: next');
            nextSong();
        });
        
        console.log('✅ Media session handlers set');
    } catch (error) {
        console.error('Handler error:', error);
    }
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
        console.error('Signed URL error:', error);
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
        console.error('Load error:', error);
        title.innerText = "Error loading song";
    } finally {
        isLoading = false;
    }
}

// Play function
async function playSong() {
    console.log('playSong() called');
    
    if (!audio.src) {
        await loadSong(songIndex);
    }
    
    try {
        await audio.play();
        musicContainer.classList.add("play");
        playBtn.querySelector('i.fas').classList.remove("fa-play");
        playBtn.querySelector("i.fas").classList.add('fa-pause');
        
        // Update media session
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    } catch (error) {
        console.error('Play error:', error);
    }
}

// Pause function
function pauseSong() {
    console.log('pauseSong() called');
    audio.pause();
    musicContainer.classList.remove("play");
    playBtn.querySelector('i.fas').classList.add("fa-play");
    playBtn.querySelector("i.fas").classList.remove("fa-pause");
    
    // Update media session
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
            // Ignore position state errors
        }
    }
});

audio.addEventListener('ended', nextSong);
progressContainer.addEventListener("click", setProgress);

// Load first song
loadSong(0);

// Add a manual test function
window.testNowPlaying = function() {
    if ('mediaSession' in navigator) {
        updateMediaSession(songs[songIndex].name);
        navigator.mediaSession.playbackState = 'playing';
        console.log('Test now playing sent');
    }
};