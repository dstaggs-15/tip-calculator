// ─────────────────────────────────────────
//  THE TIP CALCULATOR — script.js
// ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ─── SCROLL ANIMATION ───────────────────
  const animateEls = document.querySelectorAll('.animate-up');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // stagger each card slightly
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  animateEls.forEach(el => observer.observe(el));


  // ─── LEGEND TOGGLE ──────────────────────
  const legendToggle = document.getElementById('legendToggle');
  const legendBody   = document.getElementById('legendBody');

  legendToggle.addEventListener('click', () => {
    const isOpen = legendBody.classList.toggle('open');
    legendToggle.setAttribute('aria-expanded', isOpen);
    legendBody.setAttribute('aria-hidden', !isOpen);
  });


  // ─── BASE TIP SLIDER ────────────────────
  const baseTipSlider  = document.getElementById('baseTip');
  const baseTipDisplay = document.getElementById('baseTipDisplay');

  function updateSliderTrack(slider) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const val = parseFloat(slider.value);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--slider-pct', pct + '%');
  }

  baseTipSlider.addEventListener('input', () => {
    baseTipDisplay.textContent = baseTipSlider.value + '%';
    updateSliderTrack(baseTipSlider);
  });

  updateSliderTrack(baseTipSlider);


  // ─── OPTION BUTTON GROUPS ───────────────
  // Single-select within each group
  function setupGroup(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        // special handling: show/hide conditional fields
        if (groupId === 'orderAccuracy') handleOrderChange(btn.dataset.value);
        if (groupId === 'neededRefills') handleRefillChange(btn.dataset.value);
      });
    });
  }

  const allGroups = [
    'orderAccuracy', 'kitchenFault', 'attitude',
    'neededRefills', 'refillQuality',
    'aboveAndBeyond', 'vibe', 'overwhelmed'
  ];
  allGroups.forEach(setupGroup);


  // ─── CONDITIONAL FIELDS ─────────────────
  function handleOrderChange(val) {
    const kitchenField = document.getElementById('kitchenFaultField');
    if (val === 'wrong') {
      kitchenField.style.display = 'block';
    } else {
      kitchenField.style.display = 'none';
      // clear kitchen fault selection
      document.getElementById('kitchenFault').querySelectorAll('.opt-btn')
        .forEach(b => b.classList.remove('selected'));
    }
  }

  function handleRefillChange(val) {
    const refillField = document.getElementById('refillQualityField');
    if (val === 'yes') {
      refillField.style.display = 'block';
    } else {
      refillField.style.display = 'none';
      document.getElementById('refillQuality').querySelectorAll('.opt-btn')
        .forEach(b => b.classList.remove('selected'));
    }
  }


  // ─── HELPER: get selected value from group ──
  function getSelected(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return null;
    const sel = group.querySelector('.opt-btn.selected');
    return sel ? sel.dataset.value : null;
  }


  // ─── THE FORMULA ────────────────────────
  function calcTip() {
    const bill    = parseFloat(document.getElementById('billAmount').value);
    const basePct = parseFloat(baseTipSlider.value);

    if (!bill || bill <= 0) {
      shakeField('billAmount');
      return null;
    }

    let modifier = 0;

    // — Order accuracy
    const order = getSelected('orderAccuracy');
    if (order === 'perfect') {
      modifier += 2;
    } else if (order === 'wrong') {
      const kitchen = getSelected('kitchenFault');
      if (kitchen !== 'yes') {
        // server's fault
        modifier -= 4;
      }
      // kitchen's fault: no penalty
    }

    // — Attitude
    const attitude = getSelected('attitude');
    if (attitude === 'warm')   modifier += 2;
    if (attitude === 'rude')   modifier -= 5;

    // — Refills
    const neededRefills = getSelected('neededRefills');
    if (neededRefills === 'yes') {
      const refillQuality = getSelected('refillQuality');
      if (refillQuality === 'ontop')    modifier += 2;
      if (refillQuality === 'begged')   modifier -= 2;
      // askedonce = 0, no change
    }
    // neededRefills === 'no' or null: skipped, no change

    // — Above & beyond
    const above = getSelected('aboveAndBeyond');
    if (above === 'yes') modifier += 3;

    // — Vibe
    const vibe = getSelected('vibe');
    if (vibe === 'yes') modifier += 2;

    // — Overwhelmed / hustling
    const overwhelmed = getSelected('overwhelmed');
    if (overwhelmed === 'yes') modifier += 2;

    // — Final %
    let finalPct = basePct + modifier;
    finalPct = Math.max(10, Math.min(35, finalPct));

    return { bill, basePct, finalPct, modifier };
  }


  // ─── SHAKE ANIMATION FOR MISSING BILL ───
  function shakeField(id) {
    const wrap = document.getElementById(id).closest('.input-prefix-wrap') ||
                 document.getElementById(id);
    wrap.style.animation = 'none';
    wrap.offsetHeight; // reflow
    wrap.style.animation = 'shake 0.4s ease';
    setTimeout(() => { wrap.style.animation = ''; }, 400);
  }

  // inject shake keyframes dynamically
  const shakeStyle = document.createElement('style');
  shakeStyle.textContent = `
    @keyframes shake {
      0%,100% { transform: translateX(0); }
      20%      { transform: translateX(-8px); }
      40%      { transform: translateX(8px); }
      60%      { transform: translateX(-5px); }
      80%      { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(shakeStyle);


  // ─── VERDICT MESSAGE ────────────────────
  function getVerdict(pct) {
    if (pct >= 30) return '"An absolute legend served you today. Tip like it."';
    if (pct >= 25) return '"That\'s a great server. They earned it."';
    if (pct >= 20) return '"Solid service. Tip reflects that."';
    if (pct >= 15) return '"Decent service, decent tip."';
    return '"Rough around the edges, but we kept it fair."';
  }


  // ─── COUNT-UP ANIMATION ─────────────────
  function animateCountUp(element, targetText, duration = 800) {
    // for the % number
    const isPercent = targetText.includes('%');
    const isDollar  = targetText.includes('$');
    const target    = parseFloat(targetText.replace(/[$%,]/g, ''));

    let start = null;
    const startVal = 0;

    function step(timestamp) {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (target - startVal) * ease;

      if (isPercent) {
        element.textContent = Math.round(current) + '%';
      } else if (isDollar) {
        element.textContent = '$' + current.toFixed(2);
      } else {
        element.textContent = current.toFixed(2);
      }

      if (progress < 1) requestAnimationFrame(step);
      else element.textContent = targetText;
    }

    requestAnimationFrame(step);
  }


  // ─── CALCULATE BUTTON ───────────────────
  const calculateBtn = document.getElementById('calculateBtn');
  const resultCard   = document.getElementById('resultCard');

  calculateBtn.addEventListener('click', () => {
    const result = calcTip();
    if (!result) return;

    const { bill, finalPct, modifier } = result;

    const tipAmount  = bill * (finalPct / 100);
    const totalAmount = bill + tipAmount;

    // show result card
    resultCard.style.display = 'block';
    resultCard.classList.remove('visible');
    // small delay then animate in
    setTimeout(() => resultCard.classList.add('visible'), 50);

    // store current tip for round-up
    resultCard.dataset.tipAmt   = tipAmount.toFixed(2);
    resultCard.dataset.bill     = bill.toFixed(2);
    resultCard.dataset.totalAmt = totalAmount.toFixed(2);
    resultCard.dataset.pct      = finalPct;
    resultCard.dataset.rounded  = 'false';

    // animate the numbers
    animateCountUp(document.getElementById('resultPct'),    finalPct + '%', 900);
    animateCountUp(document.getElementById('resultTipAmt'), '$' + tipAmount.toFixed(2), 900);
    animateCountUp(document.getElementById('resultTotal'),  '$' + totalAmount.toFixed(2), 900);

    // verdict
    document.getElementById('resultVerdict').textContent = getVerdict(finalPct);

    // scroll to result
    setTimeout(() => {
      resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  });


  // ─── ROUND UP BUTTON ────────────────────
  const roundUpBtn = document.getElementById('roundUpBtn');

  roundUpBtn.addEventListener('click', () => {
    if (resultCard.dataset.rounded === 'true') return;

    const bill       = parseFloat(resultCard.dataset.bill);
    const tipAmt     = parseFloat(resultCard.dataset.tipAmt);
    const rounded    = Math.ceil(tipAmt);
    const newTotal   = bill + rounded;
    const newPct     = (rounded / bill) * 100;

    document.getElementById('resultTipAmt').textContent = '$' + rounded.toFixed(2);
    document.getElementById('resultTotal').textContent  = '$' + newTotal.toFixed(2);
    document.getElementById('resultPct').textContent    = Math.round(newPct) + '%';

    resultCard.dataset.rounded = 'true';
    roundUpBtn.textContent     = '✓ Rounded Up';
    roundUpBtn.style.borderColor = 'var(--gold)';
    roundUpBtn.style.color       = 'var(--gold-lt)';
    roundUpBtn.disabled          = true;
  });


  // ─── RESET BUTTON ───────────────────────
  const resetBtn = document.getElementById('resetBtn');

  resetBtn.addEventListener('click', () => {
    // hide result
    resultCard.classList.remove('visible');
    setTimeout(() => {
      resultCard.style.display = 'none';
      resultCard.dataset.rounded = 'false';
      roundUpBtn.textContent     = 'Round Up the Tip';
      roundUpBtn.style.borderColor = '';
      roundUpBtn.style.color       = '';
      roundUpBtn.disabled          = false;
    }, 400);

    // clear all selections
    allGroups.forEach(groupId => {
      const group = document.getElementById(groupId);
      if (group) group.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('selected'));
    });

    // hide conditional fields
    document.getElementById('kitchenFaultField').style.display = 'none';
    document.getElementById('refillQualityField').style.display = 'none';

    // reset inputs
    document.getElementById('billAmount').value = '';
    baseTipSlider.value = 20;
    baseTipDisplay.textContent = '20%';
    updateSliderTrack(baseTipSlider);

    // scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

});
