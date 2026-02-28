import Sound from 'react-native-sound';

// Enable playback in silence mode
Sound.setCategory('Playback');

class SoundService {
    private sounds: { [key: string]: Sound } = {};

    loadSound(name: string, path: any) {
        const sound = new Sound(path, (error) => {
            if (error) {
                console.log(`Failed to load sound ${name}`, error);
                return;
            }
            this.sounds[name] = sound;
        });
    }

    play(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            sound.play((success) => {
                if (!success) {
                    console.log(`Sound ${name} playback failed`);
                }
            });
        } else {
            console.warn(`Sound ${name} not loaded`);
        }
    }

    stop(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            sound.stop();
        }
    }

    playLoop(name: string) {
        const sound = this.sounds[name];
        if (sound) {
            sound.setNumberOfLoops(-1);
            sound.play();
        }
    }

    releaseAll() {
        Object.values(this.sounds).forEach(sound => sound.release());
        this.sounds = {};
    }
}

export const soundService = new SoundService();
