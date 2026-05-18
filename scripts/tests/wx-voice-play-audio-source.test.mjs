import assert from 'node:assert/strict'
import { resolveAudioPlaybackMode } from '../../src/views/mp/components/wx-voice-play/audioSource.mjs'

assert.equal(resolveAudioPlaybackMode('https://example.com/media/voice.mp3'), 'native')
assert.equal(resolveAudioPlaybackMode('https://example.com/media/voice.amr'), 'amr')
assert.equal(resolveAudioPlaybackMode('https://example.com/media/voice'), 'amr')
assert.equal(resolveAudioPlaybackMode('https://example.com/media/voice.mp3?token=1'), 'native')

console.log('wx-voice-play audio source assertions passed')
