class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.playlist = [];
        this.currentTrackIndex = -1;
        this.isPlaying = false;
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadPlaylist();
    }

    initializeElements() {
        // Control buttons
        this.playPauseBtn = document.getElementById('play-pause-btn');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        
        // Progress elements
        this.progressSlider = document.getElementById('progress-slider');
        this.currentTimeEl = document.getElementById('current-time');
        this.durationEl = document.getElementById('duration');
        
        // Volume elements
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeDisplay = document.getElementById('volume-display');
        
        // Track info
        this.trackTitle = document.getElementById('track-title');
        this.trackArtist = document.getElementById('track-artist');
        
        // Playlist elements
        this.playlistEl = document.getElementById('playlist');
        this.playlistLoading = document.getElementById('playlist-loading');
        this.playlistEmpty = document.getElementById('playlist-empty');
        
        // Toast
        this.toast = document.getElementById('toast');
    }

    bindEvents() {
        // Control button events
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        this.prevBtn.addEventListener('click', () => this.previousTrack());
        this.nextBtn.addEventListener('click', () => this.nextTrack());
        
        // Progress slider events
        this.progressSlider.addEventListener('input', () => this.seekTo());
        
        // Volume slider events
        this.volumeSlider.addEventListener('input', () => this.updateVolume());
        
        // Audio events
        this.audio.addEventListener('loadstart', () => this.onLoadStart());
        this.audio.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.onTrackEnded());
        this.audio.addEventListener('error', (e) => this.onAudioError(e));
        this.audio.addEventListener('canplay', () => this.onCanPlay());
        
        // Set initial volume
        this.updateVolume();
    }

    async loadPlaylist() {
        try {
            this.showLoading(true);
            const response = await fetch('/api/music/playlist');
            
            if (!response.ok) {
                throw new Error(`Failed to load playlist: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.playlist = data.files || [];
            
            this.showLoading(false);
            
            if (this.playlist.length === 0) {
                this.showEmptyState(true);
            } else {
                this.renderPlaylist();
                this.showToast('Playlist loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            this.showLoading(false);
            this.showEmptyState(true);
            this.showToast(`Error loading playlist: ${error.message}`, 'error');
        }
    }

    renderPlaylist() {
        this.playlistEl.innerHTML = '';
        
        this.playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.className = 'playlist-item';
            li.dataset.index = index;
            
            li.innerHTML = `
                <div>
                    <div class="track-name">${this.getTrackName(track.filename)}</div>
                    <div class="track-duration">${this.formatFileSize(track.size)}</div>
                </div>
            `;
            
            li.addEventListener('click', () => this.selectTrack(index));
            this.playlistEl.appendChild(li);
        });
    }

    getTrackName(filename) {
        // Remove file extension and decode URI
        return decodeURIComponent(filename.replace(/\.[^/.]+$/, ""));
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    selectTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;
        
        this.currentTrackIndex = index;
        const track = this.playlist[index];
        
        // Update UI
        this.updateTrackInfo(track);
        this.updatePlaylistUI();
        
        // Load and play track
        this.loadTrack(track);
    }

    loadTrack(track) {
        this.isLoading = true;
        this.audio.src = `/api/music/stream/${encodeURIComponent(track.filename)}`;
        this.audio.load();
    }

    updateTrackInfo(track) {
        this.trackTitle.textContent = this.getTrackName(track.filename);
        this.trackArtist.textContent = 'Unknown Artist';
    }

    updatePlaylistUI() {
        // Remove active class from all items
        document.querySelectorAll('.playlist-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to current item
        if (this.currentTrackIndex >= 0) {
            const activeItem = document.querySelector(`[data-index="${this.currentTrackIndex}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
                activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }

    togglePlayPause() {
        if (this.currentTrackIndex === -1) {
            this.showToast('Please select a track first', 'error');
            return;
        }
        
        if (this.isLoading) {
            this.showToast('Track is loading, please wait', 'error');
            return;
        }
        
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    async play() {
        try {
            await this.audio.play();
            this.isPlaying = true;
            this.playPauseBtn.innerHTML = '<span>⏸️</span>';
            this.updateControlsState();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.showToast('Error playing audio', 'error');
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<span>▶️</span>';
    }

    previousTrack() {
        if (this.currentTrackIndex > 0) {
            this.selectTrack(this.currentTrackIndex - 1);
        }
    }

    nextTrack() {
        if (this.currentTrackIndex < this.playlist.length - 1) {
            this.selectTrack(this.currentTrackIndex + 1);
        }
    }

    seekTo() {
        if (this.audio.duration) {
            const seekTime = (this.progressSlider.value / 100) * this.audio.duration;
            this.audio.currentTime = seekTime;
        }
    }

    updateVolume() {
        const volume = this.volumeSlider.value / 100;
        this.audio.volume = volume;
        this.volumeDisplay.textContent = `${this.volumeSlider.value}%`;
    }

    updateProgress() {
        if (this.audio.duration) {
            const progress = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressSlider.value = progress;
            
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
            this.durationEl.textContent = this.formatTime(this.audio.duration);
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateControlsState() {
        const hasTrack = this.currentTrackIndex >= 0;
        const canPlay = hasTrack && !this.isLoading;
        
        this.playPauseBtn.disabled = !canPlay;
        this.prevBtn.disabled = !hasTrack || this.currentTrackIndex === 0;
        this.nextBtn.disabled = !hasTrack || this.currentTrackIndex === this.playlist.length - 1;
        this.progressSlider.disabled = !canPlay;
    }

    // Audio event handlers
    onLoadStart() {
        this.isLoading = true;
        this.updateControlsState();
        this.showToast('Loading track...', 'info');
    }

    onLoadedMetadata() {
        this.durationEl.textContent = this.formatTime(this.audio.duration);
    }

    onCanPlay() {
        this.isLoading = false;
        this.updateControlsState();
        
        // Auto-play if user clicked play
        if (this.isPlaying) {
            this.play();
        }
    }

    onTrackEnded() {
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<span>▶️</span>';
        
        // Auto-play next track if available
        if (this.currentTrackIndex < this.playlist.length - 1) {
            setTimeout(() => this.nextTrack(), 1000);
        }
    }

    onAudioError(event) {
        console.error('Audio error:', event);
        this.isLoading = false;
        this.isPlaying = false;
        this.playPauseBtn.innerHTML = '<span>▶️</span>';
        this.updateControlsState();
        this.showToast('Error loading audio file', 'error');
    }

    // UI helper methods
    showLoading(show) {
        this.playlistLoading.style.display = show ? 'block' : 'none';
        this.playlistEl.style.display = show ? 'none' : 'block';
    }

    showEmptyState(show) {
        this.playlistEmpty.style.display = show ? 'block' : 'none';
        this.playlistEl.style.display = show ? 'none' : 'block';
    }

    showToast(message, type = 'info') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize player when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});