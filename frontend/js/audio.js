const AUDIO = (() => {
  const SRC = "assets/audio/theme.mp3";
  const KEY = "dungeon_audio_pos";
  let audio = null;

  function init() {
    audio = new Audio(SRC);
    audio.loop = true;
    audio.volume = 0.4;

    const saved = parseFloat(localStorage.getItem(KEY) || "0");
    if (saved > 0) audio.currentTime = saved;

    // Save position every 2s so next page can resume
    setInterval(() => {
      if (!audio.paused) localStorage.setItem(KEY, audio.currentTime);
    }, 2000);

    // Autoplay requires a user gesture — try immediately, queue on interaction
    audio.play().catch(() => {
      const resume = () => { audio.play(); document.removeEventListener("click", resume); };
      document.addEventListener("click", resume);
    });
  }

  function toggle() {
    if (!audio) return;
    audio.paused ? audio.play() : audio.pause();
    return audio.paused;
  }

  return { init, toggle };
})();
