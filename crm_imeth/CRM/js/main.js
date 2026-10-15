/**
 * MyCrm - Pure Vanilla JavaScript Engine
 * Handles theme toggling, interactive RBAC dashboard, live assignment simulation,
 * multi-slide carousel, pricing toggle, FAQ accordion, and scroll listeners.
 * Zero dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. Theme Toggle (Light / Dark Mode)
  // --------------------------------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const htmlEl = document.documentElement;

  // Retrieve saved theme or system preference
  const savedTheme = localStorage.getItem('mycrm_theme') || 
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      htmlEl.setAttribute('data-theme', 'dark');
      htmlEl.classList.add('dark');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = `
          <!-- Sun Icon for switching to light -->
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #18DBF5;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;
        themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
        themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
      }
    } else {
      htmlEl.setAttribute('data-theme', 'light');
      htmlEl.classList.remove('dark');
      if (themeToggleBtn) {
        themeToggleBtn.innerHTML = `
          <!-- Moon Icon for switching to dark -->
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" style="color: #1B7BED;">
            <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        `;
        themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
        themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
      }
    }
  };

  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mycrm_theme', newTheme);
      applyTheme(newTheme);
    });
  }

  // --------------------------------------------------------------------------
  // 2. Mobile Navigation Drawer
  // --------------------------------------------------------------------------
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileNavDrawer = document.getElementById('mobile-nav-drawer');

  if (mobileMenuToggle && mobileNavDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      const isOpen = mobileNavDrawer.classList.contains('open');
      if (isOpen) {
        mobileNavDrawer.classList.remove('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      } else {
        mobileNavDrawer.classList.add('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close when clicking any nav link
    const drawerLinks = mobileNavDrawer.querySelectorAll('a');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // --------------------------------------------------------------------------
  // 3. Interactive 3-Tier RBAC Dashboard & Live Lead Assignment
  // --------------------------------------------------------------------------
  const roleTabBtns = document.querySelectorAll('.role-tab-btn');
  const roleViewContents = document.querySelectorAll('.role-view-content');
  const windowUrlText = document.getElementById('window-url-text');
  const liveToast = document.getElementById('live-toast-alert');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  const showToast = (message) => {
    if (!liveToast || !toastMessage) return;
    toastMessage.textContent = message;
    liveToast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      liveToast.classList.remove('show');
    }, 3500);
  };

  roleTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetRole = btn.getAttribute('data-role');

      // Update button active state
      roleTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Update role view content visibility
      roleViewContents.forEach((view) => {
        if (view.id === `role-view-${targetRole}`) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      // Update window simulated address bar
      if (windowUrlText) {
        windowUrlText.textContent = `tenant://acme-corp.mycrm.cloud / ${targetRole.toUpperCase()}`;
      }
    });
  });

  // Live Lead Assignment Buttons in Team Lead View
  const assignButtons = document.querySelectorAll('[data-assign-lead]');
  const unassignedCountBadge = document.getElementById('unassigned-count-badge');
  let unassignedCount = 1;

  assignButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const leadId = btn.getAttribute('data-assign-lead');
      const agentName = btn.getAttribute('data-agent');
      const leadCard = document.getElementById(`lead-card-${leadId}`);

      if (leadCard) {
        const actionArea = leadCard.querySelector('.lead-action-area');
        if (actionArea) {
          actionArea.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: var(--radius-md); background: rgba(16, 185, 129, 0.15); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.25); display: flex; align-items: center; gap: 0.35rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                Assigned to ${agentName}
              </span>
            </div>
          `;
        }

        // Increment agent lead count on the right monitor
        const agentLeadCountEl = document.getElementById(`agent-leads-${agentName.split(' ')[0].toLowerCase()}`);
        if (agentLeadCountEl) {
          const currentLeads = parseInt(agentLeadCountEl.textContent, 10) || 14;
          agentLeadCountEl.textContent = `${currentLeads + 1} Active Leads`;
        }

        // Decrement unassigned queue count
        if (unassignedCount > 0) {
          unassignedCount -= 1;
          if (unassignedCountBadge) {
            unassignedCountBadge.textContent = `${unassignedCount} Unassigned`;
          }
        }

        showToast(`Lead ${leadId} instantly assigned to ${agentName}`);
      }
    });
  });

  // --------------------------------------------------------------------------
  // 4. App Screenshots Carousel Slider
  // --------------------------------------------------------------------------
  const carouselTrack = document.getElementById('carousel-track');
  const carouselPrevBtn = document.getElementById('carousel-prev');
  const carouselNextBtn = document.getElementById('carousel-next');
  const carouselDotsContainer = document.getElementById('carousel-dots');
  const slides = document.querySelectorAll('.carousel-slide');

  if (carouselTrack && slides.length > 0) {
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoPlayInterval = null;

    // Dynamically generate navigation dots
    if (carouselDotsContainer) {
      carouselDotsContainer.innerHTML = '';
      slides.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `carousel-dot ${idx === 0 ? 'active' : ''}`;
        dot.setAttribute('aria-label', `Slide ${idx + 1}`);
        dot.addEventListener('click', () => {
          goToSlide(idx);
          resetAutoPlay();
        });
        carouselDotsContainer.appendChild(dot);
      });
    }

    const updateDots = () => {
      const dots = carouselDotsContainer ? carouselDotsContainer.querySelectorAll('.carousel-dot') : [];
      dots.forEach((dot, idx) => {
        if (idx === currentSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    };

    const goToSlide = (slideIndex) => {
      const isDesktop = window.innerWidth >= 1024;
      const maxIndex = isDesktop ? Math.max(0, totalSlides - 2) : totalSlides - 1;
      currentSlide = Math.min(Math.max(0, slideIndex), maxIndex);

      const slideWidthPercent = isDesktop ? 50 : 100;
      carouselTrack.style.transform = `translateX(-${currentSlide * slideWidthPercent}%)`;
      updateDots();
    };

    const nextSlide = () => {
      const isDesktop = window.innerWidth >= 1024;
      const maxIndex = isDesktop ? Math.max(0, totalSlides - 2) : totalSlides - 1;
      if (currentSlide >= maxIndex) {
        goToSlide(0);
      } else {
        goToSlide(currentSlide + 1);
      }
    };

    const prevSlide = () => {
      const isDesktop = window.innerWidth >= 1024;
      const maxIndex = isDesktop ? Math.max(0, totalSlides - 2) : totalSlides - 1;
      if (currentSlide <= 0) {
        goToSlide(maxIndex);
      } else {
        goToSlide(currentSlide - 1);
      }
    };

    if (carouselNextBtn) {
      carouselNextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoPlay();
      });
    }

    if (carouselPrevBtn) {
      carouselPrevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoPlay();
      });
    }

    // Autoplay Timer
    const startAutoPlay = () => {
      if (!autoPlayInterval) {
        autoPlayInterval = setInterval(nextSlide, 5000);
      }
    };

    const stopAutoPlay = () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
      }
    };

    const resetAutoPlay = () => {
      stopAutoPlay();
      startAutoPlay();
    };

    startAutoPlay();

    // Pause on hover
    const carouselWrapper = document.getElementById('carousel-outer-wrapper');
    if (carouselWrapper) {
      carouselWrapper.addEventListener('mouseenter', stopAutoPlay);
      carouselWrapper.addEventListener('mouseleave', startAutoPlay);
    }

    // Touch swipe support on mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) {
        nextSlide();
        resetAutoPlay();
      } else if (touchEndX - touchStartX > 50) {
        prevSlide();
        resetAutoPlay();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      goToSlide(currentSlide);
    });
  }

  // --------------------------------------------------------------------------
  // 5. Pricing Toggle (Monthly vs Annual) & Mobile Tabs
  // --------------------------------------------------------------------------
  const billingSwitch = document.getElementById('billing-switch');
  const proPriceVal = document.getElementById('pro-price-val');
  const proPeriodVal = document.getElementById('pro-period-val');
  const monthlyLabel = document.getElementById('billing-monthly-label');
  const annualLabel = document.getElementById('billing-annual-label');

  if (billingSwitch) {
    billingSwitch.addEventListener('click', () => {
      const isAnnual = billingSwitch.classList.toggle('annual');
      billingSwitch.setAttribute('aria-checked', isAnnual ? 'true' : 'false');

      if (isAnnual) {
        if (proPriceVal) proPriceVal.textContent = 'Rs. 2,400';
        if (proPeriodVal) proPeriodVal.textContent = '/ month (billed annually)';
        if (monthlyLabel) monthlyLabel.style.opacity = '0.6';
        if (annualLabel) {
          annualLabel.style.opacity = '1';
          annualLabel.style.color = 'var(--color-primary)';
        }
      } else {
        if (proPriceVal) proPriceVal.textContent = 'Rs. 3,000';
        if (proPeriodVal) proPeriodVal.textContent = '/ month';
        if (monthlyLabel) monthlyLabel.style.opacity = '1';
        if (annualLabel) {
          annualLabel.style.opacity = '0.6';
          annualLabel.style.color = '';
        }
      }
    });
  }

  // Mobile Pricing Tabs (Free / Professional / Enterprise)
  const mobilePricingTabs = document.querySelectorAll('.mobile-pricing-tab-btn');
  const pricingCards = document.querySelectorAll('.pricing-card');

  mobilePricingTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTier = tab.getAttribute('data-tier');
      mobilePricingTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      if (window.innerWidth < 1024) {
        pricingCards.forEach((card) => {
          if (card.id === `pricing-card-${targetTier}`) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      }
    });
  });

  const handleResizePricing = () => {
    if (window.innerWidth >= 1024) {
      pricingCards.forEach((card) => {
        card.style.display = 'flex';
      });
    } else {
      const activeTab = document.querySelector('.mobile-pricing-tab-btn.active');
      const activeTier = activeTab ? activeTab.getAttribute('data-tier') : 'growth';
      pricingCards.forEach((card) => {
        if (card.id === `pricing-card-${activeTier}`) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    }
  };

  window.addEventListener('resize', handleResizePricing);
  handleResizePricing();

  // --------------------------------------------------------------------------
  // 6. FAQ Accordion Interaction
  // --------------------------------------------------------------------------
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question-btn');
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const wasOpen = item.classList.contains('open');

        // Optional: close other FAQ items
        faqItems.forEach((other) => other.classList.remove('open'));

        if (!wasOpen) {
          item.classList.add('open');
        }
      });
    }
  });

  // --------------------------------------------------------------------------
  // 7. Mobile Sticky Conversion Bar On Scroll
  // --------------------------------------------------------------------------
  const mobileStickyBar = document.getElementById('mobile-sticky-bar');

  if (mobileStickyBar) {
    const handleScroll = () => {
      if (window.scrollY > 480) {
        mobileStickyBar.classList.add('visible');
      } else {
        mobileStickyBar.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }
});
