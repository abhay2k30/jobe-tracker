(function () {
  'use strict';

  const hostname = window.location.hostname;
  const href = window.location.href;

  function logJob(data) {
    chrome.runtime.sendMessage({
      type: 'LOG_JOB',
      payload: {
        company: data.company?.trim() || 'Unknown Company',
        role: data.role?.trim() || 'Unknown Role',
        url: data.url || href,
        source: data.source,
      },
    });
  }

  function waitForElement(selector, callback, timeout = 10000) {
    const el = document.querySelector(selector);
    if (el) return callback(el);
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { observer.disconnect(); callback(found); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), timeout);
  }

  const attachedButtons = new WeakSet();
  function attachOnce(btn, handler) {
    if (attachedButtons.has(btn)) return;
    attachedButtons.add(btn);
    btn.addEventListener('click', handler);
  }

  // ── LINKEDIN ────────────────────────────────────────────────────────────
  if (hostname.includes('linkedin.com')) {
    function extractLinkedInData() {
      const titleEl =
        document.querySelector('.job-details-jobs-unified-top-card__job-title') ||
        document.querySelector('h1.t-24') ||
        document.querySelector('[class*="job-title"]');
      const companyEl =
        document.querySelector('.job-details-jobs-unified-top-card__company-name') ||
        document.querySelector('[class*="company-name"]') ||
        document.querySelector('.topcard__org-name-link');
      return {
        role: titleEl?.innerText || document.title.split(' | ')[0],
        company: companyEl?.innerText || 'LinkedIn Company',
      };
    }

    function watchLinkedInModal() {
      waitForElement('[aria-label="Submit application"]', (btn) => {
        attachOnce(btn, () => {
          const data = extractLinkedInData();
          setTimeout(() => logJob({ ...data, source: 'LinkedIn', url: href }), 1500);
        });
      });
    }

    let lastUrl = href;
    new MutationObserver(() => {
      if (window.location.href !== lastUrl) { lastUrl = window.location.href; watchLinkedInModal(); }
    }).observe(document.body, { childList: true, subtree: true });

    watchLinkedInModal();
  }

  // ── NAUKRI ──────────────────────────────────────────────────────────────
  if (hostname.includes('naukri.com')) {
    function extractNaukriData() {
      return {
        role: document.querySelector('.jd-header-title')?.innerText ||
          document.querySelector('h1')?.innerText || document.title.split('-')[0],
        company: document.querySelector('.jd-header-comp-name')?.innerText ||
          document.querySelector('[class*="comp-name"]')?.innerText || 'Naukri Company',
      };
    }

    function watchNaukri() {
      waitForElement('[class*="apply-button"], button[id*="apply"], .apply-btn', (btn) => {
        attachOnce(btn, () => {
          const data = extractNaukriData();
          setTimeout(() => logJob({ ...data, source: 'Naukri', url: href }), 2000);
        });
      });
    }

    watchNaukri();
    let lastUrl = href;
    new MutationObserver(() => {
      if (window.location.href !== lastUrl) { lastUrl = window.location.href; watchNaukri(); }
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ── INTERNSHALA ─────────────────────────────────────────────────────────
  if (hostname.includes('internshala.com')) {
    waitForElement('#apply-button, .apply-button, button[class*="apply"]', (btn) => {
      attachOnce(btn, () => {
        const data = {
          role: document.querySelector('.profile-heading')?.innerText ||
            document.querySelector('h1')?.innerText || document.title.split('-')[0],
          company: document.querySelector('.company-name')?.innerText ||
            document.querySelector('[class*="company"]')?.innerText || 'Internshala Company',
        };
        setTimeout(() => logJob({ ...data, source: 'Internshala', url: href }), 2000);
      });
    });
  }

  // ── WELLFOUND ───────────────────────────────────────────────────────────
  if (hostname.includes('wellfound.com')) {
    function extractWellfoundData() {
      return {
        role: document.querySelector('[class*="jobListing"] h1')?.innerText ||
          document.querySelector('h1')?.innerText || document.title.split('at')[0],
        company: document.querySelector('[class*="startupName"]')?.innerText ||
          document.querySelector('[data-test="company-name"]')?.innerText ||
          document.title.split('at')[1]?.split('|')[0] || 'Wellfound Company',
      };
    }

    function watchWellfound() {
      waitForElement('button[class*="apply"], [data-test="apply-button"]', (btn) => {
        attachOnce(btn, () => {
          const data = extractWellfoundData();
          setTimeout(() => logJob({ ...data, source: 'Wellfound', url: href }), 2000);
        });
      });
    }

    watchWellfound();
    let lastUrl = href;
    new MutationObserver(() => {
      if (window.location.href !== lastUrl) { lastUrl = window.location.href; watchWellfound(); }
    }).observe(document.body, { childList: true, subtree: true });
  }

  // ── GREENHOUSE ──────────────────────────────────────────────────────────
  if (hostname.includes('greenhouse.io')) {
    const company = (window.location.pathname.split('/')[1] || 'Greenhouse Company').replace(/-/g, ' ');
    const role = document.querySelector('h1.app-title')?.innerText ||
      document.querySelector('h1')?.innerText || document.title.split('at')[0];

    waitForElement('#application_form, form[action*="applications"]', (form) => {
      form.addEventListener('submit', () => {
        setTimeout(() => logJob({ company, role, source: 'Greenhouse', url: href }), 1000);
      });
    });

    waitForElement('[data-submit="true"], input[type="submit"], button[type="submit"]', (btn) => {
      attachOnce(btn, () => {
        setTimeout(() => logJob({ company, role, source: 'Greenhouse', url: href }), 1000);
      });
    });
  }

  // ── LEVER ───────────────────────────────────────────────────────────────
  if (hostname.includes('lever.co')) {
    const company = (window.location.pathname.split('/')[1] || 'Lever Company').replace(/-/g, ' ');
    const role = document.querySelector('.posting-headline h2')?.innerText ||
      document.querySelector('h2')?.innerText || document.title.split('at')[0];

    if (href.includes('/apply/thanks') || href.includes('/thanks')) {
      logJob({
        company, role, source: 'Lever',
        url: href.replace('/apply/thanks', '').replace('/thanks', ''),
      });
    } else {
      waitForElement('form.application-form, form[action*="apply"]', (form) => {
        form.addEventListener('submit', () => {
          setTimeout(() => logJob({ company, role, source: 'Lever', url: href }), 1000);
        });
      });
    }
  }
})();
