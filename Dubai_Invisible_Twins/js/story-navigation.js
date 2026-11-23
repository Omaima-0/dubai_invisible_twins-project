/* Member 1: chapter badge and direct links to each D3 view. */
(() => {
  const chapters = [
    ['top', '01 · ENTER DUBAI'], ['guess', '02 · GUESS THE GAP'],
    ['investigate', '03 · CHOOSE YOUR COMMUNITIES'], ['find', '04 · FIND THE MATCH'],
    ['evidence', '05 · EVERY SALE'], ['dna', '06 · TWIN DNA'],
    ['budget', '07 · YOUR BUDGET'], ['guest', '08 · GUEST RATINGS'],
    ['end', '09 · WHAT WE LEARNED']
  ];
  document.addEventListener('DOMContentLoaded', () => {
    const badge = document.getElementById('chapterBadge');
    // The badge shows the chapter whose top has most recently passed 40% of the screen height.
    // (The previous observer only compared the sections that had just changed, so it lagged behind.)
    const update = () => {
      const line = innerHeight * 0.4;
      let current = chapters[0];
      for (const ch of chapters) {
        const el = document.getElementById(ch[0]);
        if (el && el.getBoundingClientRect().top <= line) current = ch;
      }
      if (badge && badge.textContent !== current[1]) badge.textContent = current[1];
      document.querySelectorAll('.rail a').forEach(a =>
        a.classList.toggle('is-current', a.getAttribute('href') === '#' + current[0]));
    };
    addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
    update();

    // A direct URL (#find, #evidence, #dna, #budget, #guest, #end) opens that view after loading.
    const links = ['#find', '#evidence', '#dna', '#budget', '#guest', '#end'];
    if (location.hash && links.includes(location.hash)) {
      setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 850);
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        const guide = document.getElementById('tourHelper');
        if (guide && !guide.hidden) document.getElementById('tourClose')?.click();
      }
    });
  });
})();
