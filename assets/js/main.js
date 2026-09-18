/* =============================================================
   Арина Мельситова — интерактив и анимации
   Всё на нативном JS, без зависимостей.
   ============================================================= */
(() => {
  "use strict";
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Шапка: тень при прокрутке + прогресс-бар ---------- */
  const header = $(".header");
  const progress = $(".scroll-progress");
  const onScroll = () => {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 20);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
    const fab = $(".fab");
    if (fab) fab.classList.toggle("is-visible", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  const burger = $(".burger");
  const menu = $(".mobile-menu");
  if (burger && menu) {
    const toggle = (open) => {
      burger.classList.toggle("is-open", open);
      menu.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    };
    burger.addEventListener("click", () => toggle(!menu.classList.contains("is-open")));
    $$("a", menu).forEach(a => a.addEventListener("click", () => toggle(false)));
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  const revealEls = $$(".reveal, .reveal-left, .reveal-right");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-in"));
  }

  /* ---------- Hero: запуск текстовой анимации + параллакс ---------- */
  const hero = $(".hero");
  if (hero) {
    requestAnimationFrame(() => hero.classList.add("is-in"));
    const bg = $(".hero__bg");
    if (bg && !reduceMotion) {
      window.addEventListener("scroll", () => {
        const y = window.scrollY;
        if (y < window.innerHeight) bg.style.transform = `translateY(${y * 0.28}px)`;
      }, { passive: true });
    }
  }

  /* ---------- Счётчики цифр в блоке статистики ---------- */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const animate = (el) => {
      const target = parseFloat(el.dataset.count);
      const dur = 1400;
      if (reduceMotion) { el.textContent = target; return; }
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { animate(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  /* ---------- Прорисовка линии таймлайна ---------- */
  const track = $(".roadmap__track");
  const fill = $(".road-line__fill");
  if (track && fill) {
    const items = $$(".road-item", track);
    const draw = () => {
      const r = track.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = r.height;
      // насколько «дорисована» линия сверху вниз (до середины экрана)
      const passed = Math.min(Math.max(vh * 0.5 - r.top, 0), total);
      fill.style.height = (total ? (passed / total) * 100 : 0) + "%";
      // точка загорается ровно тогда, когда линия доходит до её центра
      items.forEach((item) => {
        const dot = item.querySelector(".road-item__dot");
        if (!dot) return;
        const c = dot.getBoundingClientRect();
        const dotCenter = c.top + c.height / 2 - r.top;
        item.classList.toggle("is-lit", passed >= dotCenter);
      });
    };
    window.addEventListener("scroll", draw, { passive: true });
    window.addEventListener("resize", draw);
    draw();
  }

  /* ---------- Слайдеры отзывов ---------- */
  $$("[data-slider]").forEach((slider) => {
    const viewport = $(".slider__viewport", slider);
    const trackEl = $(".slider__track", slider);
    const slides = $$(".slide", trackEl);
    const prev = $("[data-prev]", slider);
    const next = $("[data-next]", slider);
    const dotsWrap = $(".slider__dots", slider);
    if (!trackEl || !slides.length) return;

    let index = 0;
    const perView = () => {
      const vw = viewport.clientWidth;
      const sw = slides[0].getBoundingClientRect().width + 26; // + gap
      return Math.max(1, Math.round(vw / sw));
    };
    const maxIndex = () => Math.max(0, slides.length - perView());

    // точки
    let dots = [];
    const buildDots = () => {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = "";
      dots = [];
      const count = maxIndex() + 1;
      for (let i = 0; i < count; i++) {
        const d = document.createElement("button");
        d.className = "slider__dot";
        d.setAttribute("aria-label", "Отзыв " + (i + 1));
        d.addEventListener("click", () => go(i));
        dotsWrap.appendChild(d);
        dots.push(d);
      }
    };
    const update = () => {
      const sw = slides[0].getBoundingClientRect().width + 26;
      trackEl.style.transform = `translateX(${-index * sw}px)`;
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
      if (prev) prev.disabled = index === 0;
      if (next) next.disabled = index >= maxIndex();
    };
    const go = (i) => { index = Math.min(Math.max(i, 0), maxIndex()); update(); };

    prev && prev.addEventListener("click", () => go(index - 1));
    next && next.addEventListener("click", () => go(index + 1));

    // свайп на тач-устройствах
    let startX = 0, dragging = false;
    viewport.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; dragging = true; }, { passive: true });
    viewport.addEventListener("touchend", (e) => {
      if (!dragging) return; dragging = false;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1));
    });

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => { buildDots(); index = Math.min(index, maxIndex()); update(); }, 150);
    });
    buildDots();
    update();
  });

  /* ---------- Плавный скролл по якорям ---------- */
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* =============================================================
     ФОРМА ЗАЯВКИ
     -------------------------------------------------------------
     Заявки уходят в Formspree (AJAX, без перехода со страницы).
     Endpoint задан в action формы: https://formspree.io/f/xvkggozj

     Дополнительно (необязательно) можно дублировать лид в Bitrix24:
     впишите URL входящего вебхука с правом crm.lead.add в
     BITRIX_WEBHOOK_URL — пустое значение = Bitrix не используется.
     ============================================================= */
  const BITRIX_WEBHOOK_URL = ""; // напр.: https://ваш-портал.bitrix24.ru/rest/1/xxxxxxxx/crm.lead.add.json

  const form = $("#lead-form");
  if (form) {
    const success = $(".form__success", form.parentElement) || $(".form__success");

    async function submitToFormspree() {
      const res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      return res.ok;
    }

    async function submitToBitrix(data) {
      if (!BITRIX_WEBHOOK_URL) return true;
      const payload = {
        fields: {
          TITLE: "Заявка с сайта — " + (data.format || "подготовка"),
          NAME: data.name,
          COMMENTS: "Контакт: " + data.contact + "\nКак связаться: " + data.channel + "\nФормат: " + data.format,
          PHONE: [{ VALUE: data.contact, VALUE_TYPE: "WORK" }],
          SOURCE_ID: "WEB"
        }
      };
      const res = await fetch(BITRIX_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return res.ok;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $('button[type="submit"]', form);
      const fd = new FormData(form);
      const data = {
        name: (fd.get("NAME") || "").trim(),
        contact: (fd.get("PHONE") || "").trim(),
        channel: (fd.get("CHANNEL") || "").trim(),
        format: fd.get("FORMAT") || ""
      };
      if (!data.name || !data.contact) {
        form.reportValidity && form.reportValidity();
        return;
      }
      const original = btn ? btn.innerHTML : "";
      if (btn) { btn.disabled = true; btn.innerHTML = "Отправляем…"; }
      try {
        const ok = await submitToFormspree();
        if (ok) submitToBitrix(data).catch(() => {}); // дубль в CRM не должен ломать отправку
        if (ok && success) {
          form.style.display = "none";
          success.classList.add("is-visible");
        } else throw new Error("send failed");
      } catch (err) {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
        alert("Не удалось отправить заявку. Напишите мне в Telegram или ВК — я на связи!");
      }
    });
  }
})();
