"""Generate the audio test files used by the custom-sound tests (stdlib only).

    python dev/make_fixtures.py
"""
import math, os, random, struct, wave

HERE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'mock', 'fixtures')
os.makedirs(HERE, exist_ok=True)


def wav(name, secs, rate, fn):
    w = wave.open(os.path.join(HERE, name), 'wb')
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
    frames = bytearray()
    for i in range(int(secs * rate)):
        frames += struct.pack('<h', int(max(-1, min(1, fn(i / rate))) * 20000))
    w.writeframes(bytes(frames)); w.close()


random.seed(1)
wav('my_rain_loop.wav', 5, 16000, lambda t: random.uniform(-0.4, 0.4))                      # short: decoded, seamless loop
wav('long_tavern_track.wav', 100, 8000, lambda t: 0.3 * math.sin(2 * math.pi * 220 * t) * (0.5 + 0.5 * math.sin(t)))  # > 90 s: streamed
wav('ding.wav', 0.5, 22050, lambda t: 0.6 * math.sin(2 * math.pi * 880 * t) * math.exp(-t * 6))  # interface sound
open(os.path.join(HERE, 'notes.txt'), 'w').write('not audio')                                # must be rejected
print('fixtures written to', HERE)
