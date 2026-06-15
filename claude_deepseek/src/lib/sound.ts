let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/**
 * 正常提醒音：两段短促正弦波（880Hz → 1100Hz），轻快上扬
 */
function playNormalBeep() {
  try {
    const ctx = getAudioContext();
    const play = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };
    play(880, 0, 0.15);
    play(1100, 0.2, 0.15);
  } catch {
    // 用户未交互前 AudioContext 可能被浏览器阻止，静默处理
  }
}

/**
 * 逾期提醒音：低频方波间断蜂鸣（440Hz），严肃警告
 */
function playOverdueBeep() {
  try {
    const ctx = getAudioContext();
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 0.2);
      osc.start(ctx.currentTime + i * 0.3);
      osc.stop(ctx.currentTime + i * 0.3 + 0.2);
    }
  } catch {
    // 静默处理
  }
}

export function playReminderSound(type: string) {
  if (type === "OVERDUE") {
    playOverdueBeep();
  } else {
    playNormalBeep();
  }
}
