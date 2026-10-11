(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var navToggle = document.querySelector(".nav-toggle");
  var mainNav = document.querySelector(".main-nav");
  var backTop = document.querySelector(".back-top");

  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    if (backTop) backTop.classList.toggle("show", window.scrollY > 600);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      mainNav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", mainNav.classList.contains("open"));
    });
    mainNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        mainNav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (backTop) {
    backTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
        var suffix = el.getAttribute("data-suffix") || "";
        var duration = 1400;
        var start = null;
        function tick(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }
})();


  
  var announce = document.getElementById("announce");
  var announceClose = document.querySelector(".announce-close");
  if (announce && announceClose) {
    announceClose.addEventListener("click", function () {
      announce.classList.add("hidden");
    });
  }

    function setFormNote(form, text, ok) {
    var note = form.querySelector(".form-note");
    if (!note) {
      note = document.createElement("p");
      note.className = "form-note";
      form.appendChild(note);
    }
    note.style.cssText = "margin-top:6px; padding:12px 14px; border-radius:10px; font-size:14px; font-weight:600; background:" + (ok ? "#eef7ef" : "#fdf1ec") + "; color:" + (ok ? "#1e7a3c" : "#b23a1e") + ";";
    note.textContent = text;
  }

  function handleFormSubmit(form) {
    var btn = form.querySelector("button[type=submit]");
    var name = ((form.querySelector("[name=name]") || {}).value || "").trim();
    var company = ((form.querySelector("[name=company]") || {}).value || "").trim();
    var phone = ((form.querySelector("[name=phone]") || {}).value || "").trim();
    var email = ((form.querySelector("[name=email]") || {}).value || "").trim();
    var industry = ((form.querySelector("[name=industry]") || {}).value || "").trim();
    var message = ((form.querySelector("[name=message]") || {}).value || "").trim();
    if (!name || !phone) {
      setFormNote(form, "请填写您的姓名和联系电话。", false);
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = "发送中…"; }
    fetch("submit.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name, company: company, phone: phone, email: email, industry: industry, message: message })
    })
      .then(function (res) { return res.json(); })
      .then(function (json) {
        setFormNote(form, json.message || "已收到您的留言，我们会尽快与您联系。", json.ok);
        if (json.ok) { form.reset(); }
      })
      .catch(function () {
        setFormNote(form, "当前为本地预览模式：正式上线后此表单会自动把询盘发送到企业邮箱。如需尽快联系，请致电 18198482880。", false);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = "提交需求"; }
      });
  }

  document.querySelectorAll("form").forEach(function (form) {
    form.addEventListener("submit", function (e) { e.preventDefault(); handleFormSubmit(form); });
    var submitBtn = form.querySelector("button[type=submit]");
    if (submitBtn) {
      submitBtn.addEventListener("click", function (e) { e.preventDefault(); handleFormSubmit(form); });
    }
  });