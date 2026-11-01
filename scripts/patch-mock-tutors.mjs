import fs from 'fs';

const p = 'src/data/mockTutors.ts';
let s = fs.readFileSync(p, 'utf8');

if (!s.includes('teachingModes:')) {
  s = s.replace(/mode: '(online|in-person|hybrid)',\n    hourlyRate:/g, (_m, mode) => {
    const modes =
      mode === 'online'
        ? "['online']"
        : mode === 'in-person'
          ? "['in_person', 'student_home']"
          : "['online', 'in_person', 'student_home']";
    return `mode: '${mode}',\n    teachingModes: ${modes},\n    hourlyRate:`;
  });
}

if (!s.includes('freeLessonMinutes:')) {
  s = s.replace(
    /firstLessonFree: (true|false),\n    responseSpeedMinutes: (\d+),/g,
    (_m, free, mins) => {
      const rt =
        Number(mins) <= 60 ? '通常在 1 小時內回覆' : '通常在數小時內回覆';
      return `firstLessonFree: ${free},\n    freeLessonMinutes: 60,\n    responseTime: '${rt}',\n    responseSpeedMinutes: ${mins},\n    isVerified: true,`;
    }
  );
}

fs.writeFileSync(p, s);
console.log('patched', p);
